// src/app/services/llm-orchestrator.service.ts

import { Injectable, inject, signal } from '@angular/core';
import { ConfigStore } from '../stores/config.store';
import { MessagesStore } from '../stores/messages.store';
import { LlmApiService } from './llm-api.service';
import { MessageBuilderService } from './message-builder.service';
import { ToastService } from './toast.service';
import { Message } from '../models/llm.models';
import { StreamChunk } from './stream-parser.service';

@Injectable({ providedIn: 'root' })
export class LlmOrchestratorService {

    private api = inject(LlmApiService);
    private builder = inject(MessageBuilderService);
    private toast = inject(ToastService);
    private configStore = inject(ConfigStore);
    private messagesStore = inject(MessagesStore);

    private _isLoading = signal(false);
    readonly isLoading = this._isLoading.asReadonly();
    private stopRequested = signal(false);
    readonly isStopping = this.stopRequested.asReadonly();

    // ─── Non-streaming ───
    async sendMessage(userContent: string): Promise<void> {
        const cfg = this.configStore.state();
        if (!this.configStore.isReady()) {
            this.toast.warning('Falta configurar API URL, Token o Modelo');
            return;
        }

        this._isLoading.set(true);

        const userMsg: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: userContent,
            timestamp: new Date(),
        };
        this.messagesStore.append(userMsg);

        const apiMessages = this.builder.build(userContent, cfg, this.messagesStore.validHistory());
        const startTime = performance.now();

        try {
            const response = await this.api.send(cfg, apiMessages, false);
            const ttft = performance.now() - startTime;

            if (!response.ok) {
                await this.handleHttpError(response);
                return;
            }

            const data = await response.json();
            const totalTime = performance.now() - startTime;

            const assistantMsg: Message = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: this.api.extractContent(data),
                timestamp: new Date(),
                metrics: { ttft: Math.round(ttft), totalTime: Math.round(totalTime) },
            };
            this.messagesStore.append(assistantMsg);

        } catch (error: any) {
            if (error.name === 'AbortError') {
                this._isLoading.set(false);
                return;
            }
            this.handleError(error.message);
        } finally {
            this._isLoading.set(false);
        }

    }

    // ─── Streaming ───
    async sendMessageStream(userContent: string): Promise<void> {
        const cfg = this.configStore.state();
        if (!this.configStore.isReady()) {
            this.toast.warning('Falta configurar API URL, Token o Modelo');
            return;
        }

        this._isLoading.set(true);
        this.stopRequested.set(false);

        this.messagesStore.append({
            id: crypto.randomUUID(),
            role: 'user',
            content: userContent,
            timestamp: new Date(),
        });

        const assistantId = crypto.randomUUID();
        this.messagesStore.append({
            id: assistantId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isStreaming: true,
            metrics: { ttft: 0, totalTime: 0 },
        });

        const apiMessages = this.builder.build(userContent, cfg, this.messagesStore.validHistory());
        const startTime = performance.now();

        try {
            const response = await this.api.send(cfg, apiMessages, true);
            const ttft = performance.now() - startTime;

            if (!response.ok) {
                this.messagesStore.deleteById(assistantId);
                await this.handleHttpError(response);
                return;
            }

            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const data = await response.json();
                throw new Error(this.api.extractError(data) || 'La API devolvió JSON en lugar de stream');
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No se pudo leer el stream');

            const decoder = new TextDecoder();
            let buffer = '';

            try {
                while (true) {
                    if (this.stopRequested()) {
                        this.stopRequested.set(false);
                        break;
                    }

                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        const chunk = this.api.parseStreamLine(line);
                        if (chunk) {
                            this.applyChunkById(assistantId, chunk, ttft);
                        }
                    }
                }

                if (buffer) {
                    const chunk = this.api.parseStreamLine(buffer);
                    if (chunk) {
                        this.applyChunkById(assistantId, chunk, ttft);
                    }
                }
            } finally {
                reader.releaseLock();
            }

            const totalTime = performance.now() - startTime;
            this.messagesStore.updateById(assistantId, msg => ({
                ...msg,
                isStreaming: false,
                metrics: {
                    ...msg.metrics,
                    totalTime: Math.round(totalTime),
                    ttft: Math.round(ttft),
                },
            }));

        } catch (error: any) {
            if (error.name === 'AbortError') {
                this.messagesStore.updateById(assistantId, msg => ({
                    ...msg,
                    isStreaming: false,
                }));
                return;
            }
            this.handleStreamErrorById(assistantId, error.message);
        } finally {
            this._isLoading.set(false);
        }
    }

    // ─── Regeneración ───
    canRegenerate(): boolean {
        const last = this.messagesStore.last();
        return !!last && last.role === 'assistant' && !last.isStreaming && !last.error;
    }

    async regenerateLast(): Promise<void> {
        const lastUserIdx = this.messagesStore.findLastUserIndex();
        if (lastUserIdx === -1) return;

        const userContent = this.messagesStore.state()[lastUserIdx].content;
        this.messagesStore.truncateFrom(lastUserIdx);

        if (this.configStore.streamMode()) {
            await this.sendMessageStream(userContent);
        } else {
            await this.sendMessage(userContent);
        }
    }

    // ─── Cancelación ───
    cancel() {
        this.stopRequested.set(false);
        this.api.cancel();
    }

    stopGenerating() {
        this.stopRequested.set(true);
        const last = this.messagesStore.last();
        if (last && last.isStreaming) {
            this.messagesStore.updateById(last.id, msg => ({
                ...msg,
                isStreaming: false,
                metrics: {
                    ...msg.metrics,
                    totalTime: msg.metrics?.totalTime ?? 0,
                },
            }));
        }
    }

    // ─── Helpers privados ───
    private applyChunkById(id: string, chunk: StreamChunk, ttft: number) {
        this.messagesStore.updateById(id, msg => ({
            ...msg,
            content: msg.content + chunk.content,
            reasoning: chunk.reasoning
                ? (msg.reasoning || '') + chunk.reasoning
                : msg.reasoning,
            metrics: {
                ...(msg.metrics ?? { ttft: 0, totalTime: 0 }),
                ttft: Math.round(ttft),
                ...(chunk.usage && {
                    tokensIn: chunk.usage.prompt_tokens,
                    tokensOut: chunk.usage.completion_tokens,
                }),
            },
        }));
    }

    private async handleHttpError(response: Response) {
        let message = `Error ${response.status}`;
        try {
            const text = await response.text();
            message = `Error ${response.status}: ${text.slice(0, 200)}`;
        } catch {
            if (response.status === 401) message = 'API Token inválido';
            else if (response.status === 404) message = 'Modelo o URL no encontrados';
        }
        this.handleError(message);
    }

    private handleError(message: string) {
        this.toast.error(message);
        this.messagesStore.append({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `❌ Error: ${message}`,
            timestamp: new Date(),
            error: message,
        });
    }

    private handleStreamErrorById(id: string, message: string) {
        this.toast.error(message);
        this.messagesStore.updateById(id, msg => ({
            ...msg,
            isStreaming: false,
            error: message,
            content: `❌ Error: ${message}`,
        }));
    }

}