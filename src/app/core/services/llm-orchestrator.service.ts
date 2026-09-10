// src/app/core/services/llm-orchestrator.service.ts

import { Injectable, inject, signal } from '@angular/core';
import { GlobalConfigStore } from '../stores/global-config.store';
import { SessionStore } from '../stores/session.store';
import { ProviderStore } from '../stores/provider.store';
import { LlmApiService } from './llm-api.service';
import { MessageBuilderService } from './message-builder.service';
import { StreamReaderService } from './stream-reader.service';
import { ToastService } from './toast.service';
import { StreamChunk } from './stream-parser.service';
import { Message } from '../../models/chat.models';

@Injectable({ providedIn: 'root' })
export class LlmOrchestratorService {

    private api = inject(LlmApiService);
    private builder = inject(MessageBuilderService);
    private streamReader = inject(StreamReaderService);
    private toast = inject(ToastService);
    private configStore = inject(GlobalConfigStore);
    private sessionStore = inject(SessionStore);
    private providerStore = inject(ProviderStore);

    private _isLoading = signal(false);
    readonly isLoading = this._isLoading.asReadonly();

    private stopRequested = signal(false);
    readonly isStopping = this.stopRequested.asReadonly();

    cancel() {
        this.stopRequested.set(false);
        this.api.cancel();
    }

    stopGenerating() {
        this.stopRequested.set(true);
    }

    private getActiveSessions() {
        const all = this.sessionStore.sessions();
        return this.configStore.state().isCompareMode ? all.slice(0, 2) : [all[0]];
    }

    async sendMessage(userContent: string): Promise<void> {
        const activeSessions = this.getActiveSessions();

        for (const session of activeSessions) {
            const provider = this.providerStore.providers().find(p => p.id === session.providerId);
            if (!provider || !provider.apiUrl || !provider.apiToken || !session.model) {
                this.toast.warning(`Falta configurar API URL, Token o Modelo en: ${session.name}`);
                return;
            }
        }

        this._isLoading.set(true);
        this.stopRequested.set(false);

        const userMsgId = crypto.randomUUID();
        for (const session of activeSessions) {
            this.sessionStore.addMessage(session.id, {
                id: userMsgId,
                role: 'user',
                content: userContent,
                timestamp: new Date()
            });
        }

        const tasks = activeSessions.map(session => this.processSession(session.id, userContent));
        await Promise.all(tasks);

        this._isLoading.set(false);
    }

    async continueMessage(sessionId: string, messageId: string): Promise<void> {
        const session = this.sessionStore.sessions().find(s => s.id === sessionId);
        if (!session) return;

        const targetMsg = session.messages.find(m => m.id === messageId);
        if (!targetMsg || targetMsg.role !== 'assistant' || targetMsg.isStreaming) return;

        this._isLoading.set(true);
        this.stopRequested.set(false);

        this.sessionStore.updateMessage(sessionId, messageId, m => ({ ...m, isStreaming: true, error: undefined }));

        const continuePrompt = 'Continúa exactamente desde donde te quedaste en tu última respuesta. No repitas lo que ya dijiste, no agregues introducciones ni saludos, simplemente continúa el texto o código de forma natural.';

        await this.processSession(sessionId, continuePrompt, messageId);
        this._isLoading.set(false);
    }

    canRegenerate(): boolean {
        const activeSessions = this.getActiveSessions();
        return activeSessions.some(session => {
            const last = session.messages[session.messages.length - 1];
            return last && last.role === 'assistant' && !last.isStreaming && !last.error;
        });
    }

    async regenerateLast(): Promise<void> {
        const activeSessions = this.getActiveSessions();
        if (activeSessions.length === 0) return;

        const firstSession = activeSessions[0];
        let lastUserIdx = -1;
        for (let i = firstSession.messages.length - 1; i >= 0; i--) {
            if (firstSession.messages[i].role === 'user') {
                lastUserIdx = i;
                break;
            }
        }

        if (lastUserIdx === -1) return;
        const userContent = firstSession.messages[lastUserIdx].content;

        for (const session of activeSessions) {
            this.sessionStore.truncateMessagesFrom(session.id, lastUserIdx - 1);
        }

        await this.sendMessage(userContent);
    }

    private async processSession(sessionId: string, userContent: string, existingMessageId?: string) {
        const config = this.configStore.state();
        const session = this.sessionStore.sessions().find(s => s.id === sessionId);
        if (!session) return;

        const assistantId = existingMessageId || crypto.randomUUID();
        const provider = this.providerStore.providers().find(p => p.id === session.providerId);
        if (!provider) return;

        if (!existingMessageId) {
            this.sessionStore.addMessage(sessionId, {
                id: assistantId,
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                model: session.model,
                provider: provider.id,
                isStreaming: true,
                metrics: { ttft: 0, totalTime: 0 },
            });
        }

        const history = this.historyForRequest(session.messages, existingMessageId);
        const apiMessages = this.builder.build(userContent, session, config, history);
        const startTime = performance.now();

        try {
            const response = await this.api.send(provider, session, config, apiMessages);
            const ttft = performance.now() - startTime;

            if (!response.ok) {
                await this.handleHttpError(response, sessionId, assistantId);
                return;
            }

            if (config.streamMode) {
                await this.streamReader.readStream(
                    response,
                    () => this.stopRequested(),
                    (chunk) => this.applyChunk(sessionId, assistantId, chunk, ttft)
                );
            } else {
                const data = await response.json();
                const content = this.api.extractContent(data);
                const finishReason = data.choices?.[0]?.finish_reason || data.candidates?.[0]?.finishReason;
                const usage = data.usage;

                this.sessionStore.updateMessage(sessionId, assistantId, msg => ({
                    ...msg,
                    content: existingMessageId ? msg.content + content : content,
                    finishReason: finishReason,
                    metrics: {
                        ...(msg.metrics ?? { ttft: 0, totalTime: 0 }),
                        ttft: msg.metrics?.ttft || Math.round(ttft),
                        ...(usage && {
                            tokensIn: usage.prompt_tokens,
                            tokensOut: usage.completion_tokens,
                        }),
                    },
                }));
            }

            const totalTime = performance.now() - startTime;
            this.sessionStore.updateMessage(sessionId, assistantId, msg => ({
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
                this.sessionStore.updateMessage(sessionId, assistantId, msg => ({ ...msg, isStreaming: false }));
                return;
            }
            this.handleStreamError(sessionId, assistantId, err.message || 'Error desconocido');
        }
    }

    private historyForRequest(messages: Message[], continueId?: string): Message[] {
        return messages.filter(m => {
            if (m.role === 'system' || m.error) return false;
            if (continueId && m.id === continueId) return !!m.content;
            return !m.isStreaming;
        });
    }

    private applyChunk(sessionId: string, messageId: string, chunk: StreamChunk, ttft: number) {
        this.sessionStore.updateMessage(sessionId, messageId, msg => ({
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

    private async handleHttpError(response: Response, sessionId: string, messageId: string) {
        const smartMessage = await this.api.extractSmartError(response);
        this.handleStreamError(sessionId, messageId, smartMessage);
    }

    private handleStreamError(sessionId: string, messageId: string, message: string) {
        this.toast.error(message);
        this.sessionStore.updateMessage(sessionId, messageId, msg => ({
            ...msg,
            isStreaming: false,
            error: message,
            content: msg.content ? `${msg.content}\n\n${message}` : message,
        }));
    }
}