// src/app/core/services/llm-orchestrator.service.ts

import { Injectable, inject, signal } from '@angular/core';
import { GlobalConfigStore } from '../stores/global-config.store';
import { SessionStore } from '../stores/session.store';
import { LlmApiService } from './llm-api.service';
import { MessageBuilderService } from './message-builder.service';
import { ToastService } from './toast.service';
import { StreamChunk } from './stream-parser.service';
import { ProviderStore } from '../stores/provider.store';

@Injectable({ providedIn: 'root' })
export class LlmOrchestratorService {

    private api = inject(LlmApiService);
    private builder = inject(MessageBuilderService);
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

    // Obtiene las sesiones que deben procesarse según el modo
    private getActiveSessions() {
        const all = this.sessionStore.sessions();
        return this.configStore.state().isCompareMode ? all.slice(0, 2) : [all[0]];
    }

    async sendMessage(userContent: string): Promise<void> {
        const activeSessions = this.getActiveSessions();

        // Validación
        for (const session of activeSessions) {
            const provider = this.providerStore.providers().find(p => p.id === session.providerId);
            if (!provider || !provider.apiUrl || !provider.apiToken || !session.model) {
                this.toast.warning(`Falta configurar API URL, Token o Modelo en: ${session.name}`);
                return;
            }
        }

        this._isLoading.set(true);
        this.stopRequested.set(false);

        // 1. Agregar el mensaje del usuario a todas las sesiones activas
        const userMsgId = crypto.randomUUID();
        for (const session of activeSessions) {
            this.sessionStore.addMessage(session.id, {
                id: userMsgId,
                role: 'user',
                content: userContent,
                timestamp: new Date()
            });
        }

        // 2. Procesar todas las sesiones en paralelo
        const tasks = activeSessions.map(session => this.processSession(session.id, userContent));
        await Promise.all(tasks);

        this._isLoading.set(false);
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

        // Obtener historial válido de esta sesión
        const history = session.messages.filter(m => !m.isStreaming && !m.error && m.role !== 'system');
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
                            if (chunk) this.applyChunk(sessionId, assistantId, chunk, ttft);
                        }
                    }
                    if (buffer) {
                        const chunk = this.api.parseStreamLine(buffer);
                        if (chunk) this.applyChunk(sessionId, assistantId, chunk, ttft);
                    }
                } finally {
                    reader.releaseLock();
                }
            } else {
                const data = await response.json();
                const content = this.api.extractContent(data);
                const finishReason = data.choices?.[0]?.finish_reason || data.candidates?.[0]?.finishReason;

                this.sessionStore.updateMessage(sessionId, assistantId, msg => ({
                    ...msg,
                    content: existingMessageId ? msg.content + content : content,
                    finishReason: finishReason
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

    async continueMessage(sessionId: string, messageId: string): Promise<void> {
        const session = this.sessionStore.sessions().find(s => s.id === sessionId);
        if (!session) return;

        const targetMsg = session.messages.find(m => m.id === messageId);
        if (!targetMsg || targetMsg.role !== 'assistant' || targetMsg.isStreaming) return;

        this._isLoading.set(true);
        this.stopRequested.set(false);

        this.sessionStore.updateMessage(sessionId, messageId, m => ({ ...m, isStreaming: true, error: undefined }));

        const continuePrompt = "Continúa exactamente desde donde te quedaste en tu última respuesta. No repitas lo que ya dijiste, no agregues introducciones ni saludos, simplemente continúa el texto o código de forma natural.";

        await this.processSession(sessionId, continuePrompt, messageId);
        this._isLoading.set(false);
    }

    canRegenerate(): boolean {
        const activeSessions = this.getActiveSessions();
        // Se puede regenerar si al menos una sesión activa tiene un último mensaje de asistente válido
        return activeSessions.some(session => {
            const last = session.messages[session.messages.length - 1];
            return last && last.role === 'assistant' && !last.isStreaming && !last.error;
        });
    }

    async regenerateLast(): Promise<void> {
        const activeSessions = this.getActiveSessions();
        if (activeSessions.length === 0) return;

        // Buscamos el último mensaje del usuario en la primera sesión activa (debería ser el mismo en todas)
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

        // Truncamos los mensajes en todas las sesiones activas
        for (const session of activeSessions) {
            this.sessionStore.truncateMessagesFrom(session.id, lastUserIdx - 1);
        }

        await this.sendMessage(userContent);
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
        let message = `Error ${response.status}`;
        try {
            const text = await response.text();
            message = `Error ${response.status}: ${text.slice(0, 200)}`;
        } catch {
            if (response.status === 401) message = 'API Token inválido';
            else if (response.status === 404) message = 'Modelo o URL no encontrados';
        }
        this.handleStreamError(sessionId, messageId, message);
    }

    private handleStreamError(sessionId: string, messageId: string, message: string) {
        this.toast.error(message);
        this.sessionStore.updateMessage(sessionId, messageId, msg => ({
            ...msg,
            isStreaming: false,
            error: message,
            content: msg.content ? `${msg.content}\n\n❌ Error: ${message}` : `❌ Error: ${message}`,
        }));
    }
}
