// src/app/services/llm-orchestrator.service.ts

import { Injectable, inject, signal } from '@angular/core';
import { ConfigStore } from '../stores/config.store';
import { MessagesStore } from '../stores/messages.store';
import { LlmApiService } from './llm-api.service';
import { MessageBuilderService } from './message-builder.service';
import { ToastService } from './toast.service';
import { Message } from '../models/llm.models';
import { StreamChunk } from './stream-parser.service';
import { guessProvider } from '../utils/provider.utils';

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

    // Cancela la petición HTTP actual de forma abrupta
    cancel() {
        this.stopRequested.set(false);
        this.api.cancel();
    }

    // Detiene la lectura del stream de forma controlada
    stopGenerating() {
        this.stopRequested.set(true);
    }

    // Inicia el envío de un nuevo mensaje del usuario y maneja automáticamente el modo comparación si está activo
    async sendMessage(userContent: string): Promise<void> {
        const cfg = this.configStore.state();
        if (!this.configStore.isReady()) {
            this.toast.warning('Falta configurar API URL, Token o Modelo');
            return;
        }

        this._isLoading.set(true);
        this.stopRequested.set(false);

        const userMsg: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: userContent,
            timestamp: new Date()
        };
        this.messagesStore.append(userMsg, 'both');

        const tasks = [this.processThread('a', userContent, cfg.streamMode)];
        if (cfg.isCompareMode) {
            tasks.push(this.processThread('b', userContent, cfg.streamMode));
        }

        await Promise.all(tasks);
        this._isLoading.set(false);
    }

    // Procesa un hilo de chat individual (Modelo A o Modelo B)
    private async processThread(thread: 'a' | 'b', userContent: string, isStream: boolean, existingMessageId?: string) {
        const cfg = this.configStore.state();
        const apiUrl = thread === 'a' ? cfg.apiUrl : cfg.apiUrlB;
        const apiToken = thread === 'a' ? cfg.apiToken : cfg.apiTokenB;
        const model = thread === 'a' ? cfg.model : cfg.modelB;

        const assistantId = existingMessageId || crypto.randomUUID();

        if (!existingMessageId) {
            this.messagesStore.append({
                id: assistantId,
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                model: model,
                provider: guessProvider(apiUrl),
                isStreaming: true,
                metrics: { ttft: 0, totalTime: 0 },
            }, thread);
        }

        const threadCfg = { ...cfg, apiUrl, apiToken, model };
        const apiMessages = this.builder.build(userContent, threadCfg, this.messagesStore.validHistory(thread));
        const startTime = performance.now();

        try {
            const response = await this.api.send(threadCfg, apiMessages, isStream);
            const ttft = performance.now() - startTime;

            if (!response.ok) {
                await this.handleHttpError(response, assistantId);
                return;
            }

            if (isStream) {
                const reader = response.body?.getReader();
                if (!reader) throw new Error('No se pudo leer el stream');
                const decoder = new TextDecoder();
                let buffer = '';

                try {
                    while (true) {
                        if (this.stopRequested()) break;
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                            const chunk = this.api.parseStreamLine(line);
                            if (chunk) this.applyChunkById(assistantId, chunk, ttft);
                        }
                    }
                    if (buffer) {
                        const chunk = this.api.parseStreamLine(buffer);
                        if (chunk) this.applyChunkById(assistantId, chunk, ttft);
                    }
                } finally {
                    reader.releaseLock();
                }
            } else {
                const data = await response.json();
                const content = this.api.extractContent(data);
                const finishReason = data.choices?.[0]?.finish_reason || data.candidates?.[0]?.finishReason;

                this.messagesStore.updateById(assistantId, msg => ({
                    ...msg,
                    content: existingMessageId ? msg.content + content : content,
                    finishReason: finishReason
                }));
            }

            const totalTime = performance.now() - startTime;
            this.messagesStore.updateById(assistantId, msg => ({
                ...msg,
                isStreaming: false,
                metrics: {
                    ...msg.metrics,
                    totalTime: Math.round(totalTime),
                    ttft: msg.metrics?.ttft || Math.round(ttft),
                },
            }));

        } catch (error: unknown) {
            const err = error as Error;
            if (err.name === 'AbortError') {
                this.messagesStore.updateById(assistantId, msg => ({ ...msg, isStreaming: false }));
                return;
            }
            this.handleStreamErrorById(assistantId, err.message || 'Error desconocido');
        }
    }

    // Continúa la generación de un mensaje que fue interrumpido (ej: por max_tokens)
    async continueMessage(id: string): Promise<void> {
        const cfg = this.configStore.state();
        if (!this.configStore.isReady()) return;

        let thread: 'a' | 'b' = 'a';
        let msgIndex = this.messagesStore.findIndexById(id, 'a');
        if (msgIndex === -1) {
            msgIndex = this.messagesStore.findIndexById(id, 'b');
            thread = 'b';
        }
        if (msgIndex === -1) return;

        const targetMsg = thread === 'a' ? this.messagesStore.stateA()[msgIndex] : this.messagesStore.stateB()[msgIndex];
        if (targetMsg.role !== 'assistant' || targetMsg.isStreaming) return;

        this._isLoading.set(true);
        this.stopRequested.set(false);

        this.messagesStore.updateById(id, m => ({ ...m, isStreaming: true, error: undefined }));

        const continuePrompt = "Continúa exactamente desde donde te quedaste en tu última respuesta. No repitas lo que ya dijiste, no agregues introducciones ni saludos, simplemente continúa el texto o código de forma natural.";

        await this.processThread(thread, continuePrompt, cfg.streamMode, id);
        this._isLoading.set(false);
    }

    // Verifica si es posible regenerar el último mensaje
    canRegenerate(): boolean {
        const lastA = this.messagesStore.last('a');
        const lastB = this.messagesStore.last('b');
        const canA = !!lastA && lastA.role === 'assistant' && !lastA.isStreaming && !lastA.error;
        const canB = !!lastB && lastB.role === 'assistant' && !lastB.isStreaming && !lastB.error;
        return canA || canB;
    }

    // Elimina la última respuesta de la IA y vuelve a enviar el último prompt del usuario
    async regenerateLast(): Promise<void> {
        const lastUserIdxA = this.messagesStore.findLastUserIndex('a');
        if (lastUserIdxA === -1) return;

        const userContent = this.messagesStore.stateA()[lastUserIdxA].content;
        this.messagesStore.truncateFrom(lastUserIdxA - 1, 'both');

        await this.sendMessage(userContent);
    }

    private applyChunkById(id: string, chunk: StreamChunk, ttft: number) {
        this.messagesStore.updateById(id, msg => ({
            ...msg,
            content: msg.content + chunk.content,
            reasoning: chunk.reasoning ? (msg.reasoning || '') + chunk.reasoning : msg.reasoning,
            finishReason: chunk.finish_reason || msg.finishReason,
            metrics: {
                ...(msg.metrics ?? { ttft: 0, totalTime: 0 }),
                ttft: msg.metrics?.ttft || Math.round(ttft),
                ...(chunk.usage && {
                    tokensIn: chunk.usage.prompt_tokens,
                    tokensOut: chunk.usage.completion_tokens,
                }),
            },
        }));
    }

    private async handleHttpError(response: Response, id: string) {
        let message = `Error ${response.status}`;
        try {
            const text = await response.text();
            message = `Error ${response.status}: ${text.slice(0, 200)}`;
        } catch {
            if (response.status === 401) message = 'API Token inválido';
            else if (response.status === 404) message = 'Modelo o URL no encontrados';
        }
        this.handleStreamErrorById(id, message);
    }

    private handleStreamErrorById(id: string, message: string) {
        this.toast.error(message);
        this.messagesStore.updateById(id, msg => ({
            ...msg,
            isStreaming: false,
            error: message,
            content: msg.content ? `${msg.content}\n\n❌ Error: ${message}` : `❌ Error: ${message}`,
        }));
    }

}
