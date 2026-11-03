// src/app/core/services/llm-orchestrator.service.ts

import { Injectable, computed, inject, signal } from '@angular/core';
import {
    AppError,
    ChatSession,
    isAppError,
    Message,
    toAppError
} from '../models';
import { activeSessions, sessionReadiness } from '../state/session.selectors';
import { ConfigStore } from '../stores/config.store';
import { ProviderStore } from '../stores/provider.store';
import { SessionStore } from '../stores/session.store';
import { estimateTokens } from '../../utils/token.utils';
import { LlmApiService } from './llm-api.service';
import { MessageBuilderService } from './message-builder.service';
import { StreamChunk } from './stream-parser.service';
import { StreamReaderService } from './stream-reader.service';
import { ToastService } from './toast.service';

const CONTINUE_PROMPT = 'Continúa exactamente desde donde te quedaste en tu última respuesta. No repitas lo que ya dijiste, no agregues introducciones ni saludos, simplemente continúa el texto o código de forma natural.';

interface ProcessOptions {
    existingMessageId?: string;
    excludeMessageId?: string;
}

@Injectable({ providedIn: 'root' })
export class LlmOrchestratorService {

    private api = inject(LlmApiService);
    private builder = inject(MessageBuilderService);
    private reader = inject(StreamReaderService);
    private toast = inject(ToastService);
    private configStore = inject(ConfigStore);
    private sessionStore = inject(SessionStore);
    private providerStore = inject(ProviderStore);

    private readonly _isLoading = signal(false);
    readonly isLoading = this._isLoading.asReadonly();

    readonly canRegenerate = computed(() => {
        const sessions = this.currentActiveSessions();
        return sessions.some(session => {
            const last = session.messages[session.messages.length - 1];
            return !!last && last.role === 'assistant' && !last.isStreaming && !last.error;
        });
    });

    canSend(): boolean {
        const providers = this.providerStore.providers();
        return this.currentActiveSessions().some(session => sessionReadiness(session, providers).ready);
    }

    async sendMessage(userContent: string): Promise<boolean> {
        const active = this.currentActiveSessions();
        const providers = this.providerStore.providers();

        if (!active.length) {
            this.toast.warning('No hay sesiones para enviar. Configurá un proveedor y un modelo.');
            return false;
        }

        const ready = active.filter(session => sessionReadiness(session, providers).ready);
        if (!ready.length) {
            const first = active[0];
            const reason = sessionReadiness(first, providers).reason ?? 'configuración incompleta';
            this.toast.warning(`No se puede enviar en "${first.name}": ${reason}.`);
            return false;
        }

        const skipped = active.filter(session => !ready.includes(session));
        if (skipped.length) {
            this.toast.warning(`Sin configurar: ${skipped.map(s => s.name).join(', ')}. Se envía sólo a las columnas listas.`);
        }

        this._isLoading.set(true);
        const userMessageId = crypto.randomUUID();
        for (const session of ready) {
            this.sessionStore.addMessage(session.id, {
                id: userMessageId,
                role: 'user',
                content: userContent,
                timestamp: new Date()
            });
        }

        try {
            await Promise.all(ready.map(session =>
                this.processSession(session.id, userContent, { excludeMessageId: userMessageId })
            ));
        } finally {
            this._isLoading.set(false);
        }

        return true;
    }

    async continueMessage(sessionId: string, messageId: string): Promise<void> {
        const session = this.findSession(sessionId);
        const target = session?.messages.find(message => message.id === messageId);
        if (!session || !target || target.role !== 'assistant' || target.isStreaming) return;

        const readiness = sessionReadiness(session, this.providerStore.providers());
        if (!readiness.ready) {
            this.fail(sessionId, messageId, {
                type: 'invalid_params',
                message: `No se puede continuar: ${readiness.reason}.`,
                retryable: false
            });
            return;
        }

        this._isLoading.set(true);
        this.sessionStore.updateMessage(sessionId, messageId, message => ({ ...message, isStreaming: true, error: undefined }));

        try {
            await this.processSession(sessionId, CONTINUE_PROMPT, { existingMessageId: messageId });
        } finally {
            this._isLoading.set(false);
        }
    }

    async retry(sessionId: string, messageId: string): Promise<void> {
        const session = this.findSession(sessionId);
        if (!session) return;

        const index = session.messages.findIndex(message => message.id === messageId);
        if (index < 0) return;

        let userIndex = -1;
        for (let i = index - 1; i >= 0; i--) {
            if (session.messages[i].role === 'user') {
                userIndex = i;
                break;
            }
        }

        if (userIndex < 0) {
            this.toast.warning('No se encontró el mensaje original para reintentar.');
            return;
        }

        const userMessage = session.messages[userIndex];
        const readiness = sessionReadiness(session, this.providerStore.providers());
        if (!readiness.ready) {
            this.fail(sessionId, messageId, {
                type: 'invalid_params',
                message: `No se puede reintentar: ${readiness.reason}.`,
                retryable: false
            });
            return;
        }

        this.sessionStore.truncateMessagesFrom(sessionId, userIndex);

        this._isLoading.set(true);
        try {
            await this.processSession(sessionId, userMessage.content, { excludeMessageId: userMessage.id });
        } finally {
            this._isLoading.set(false);
        }
    }

    async regenerateLast(): Promise<void> {
        const providers = this.providerStore.providers();
        const sessions = this.currentActiveSessions()
            .filter(session => sessionReadiness(session, providers).ready);
        if (!sessions.length) return;

        this._isLoading.set(true);
        const jobs: Promise<void>[] = [];

        try {
            for (const session of sessions) {
                let userIndex = -1;
                for (let i = session.messages.length - 1; i >= 0; i--) {
                    if (session.messages[i].role === 'user') {
                        userIndex = i;
                        break;
                    }
                }
                if (userIndex < 0) continue;

                const userMessage = session.messages[userIndex];
                this.sessionStore.truncateMessagesFrom(session.id, userIndex);
                jobs.push(this.processSession(session.id, userMessage.content, { excludeMessageId: userMessage.id }));
            }

            await Promise.all(jobs);
        } finally {
            this._isLoading.set(false);
        }
    }

    stopGenerating(): void {
        for (const session of this.currentActiveSessions()) {
            this.api.abort(session.id);
        }
    }

    cancelAll(): void {
        this.api.abortAll();
    }

    private async processSession(sessionId: string, userContent: string, options: ProcessOptions = {}): Promise<void> {
        const config = this.configStore.state();
        const session = this.findSession(sessionId);
        if (!session) return;

        const provider = this.providerStore.providers().find(p => p.id === session.providerId);
        if (!provider) {
            if (options.existingMessageId) {
                this.fail(sessionId, options.existingMessageId, {
                    type: 'invalid_params',
                    message: 'Proveedor no encontrado.',
                    retryable: false
                });
            }
            return;
        }

        const assistantId = options.existingMessageId ?? crypto.randomUUID();
        const isContinuation = options.existingMessageId !== undefined;

        if (isContinuation) {
            this.sessionStore.updateMessage(sessionId, assistantId, message => ({ ...message, isStreaming: true, error: undefined }));
        } else {
            this.sessionStore.addMessage(sessionId, {
                id: assistantId,
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                model: session.model,
                provider: provider.id,
                isStreaming: true,
                metrics: { ttft: 0, totalTime: 0 }
            });
        }

        const history = this.historyForRequest(session.messages, options);
        const apiMessages = this.builder.build(userContent, session, config, history);
        const estimatedInput = estimateTokens(apiMessages.map(message => message.content).join(' '));

        const started = performance.now();
        let ttft = 0;
        let gotFirstToken = false;

        try {
            const response = await this.api.send(provider, session, config, apiMessages);

            if (!response.ok) {
                const error = await this.api.toAppError(response);
                this.fail(sessionId, assistantId, error, started);
                return;
            }

            if (config.streamMode) {
                await this.reader.readStream(response, {
                    signal: this.api.signalFor(sessionId),
                    onChunk: chunk => {
                        if (!gotFirstToken && (chunk.content || chunk.reasoning)) {
                            ttft = performance.now() - started;
                            gotFirstToken = true;
                        }
                        this.applyChunk(sessionId, assistantId, chunk, ttft);
                    }
                });
            } else {
                const data: unknown = await response.json();
                const content = this.api.extractContent(data);
                const usage = this.api.extractUsage(data);
                const finishReason = this.api.extractFinishReason(data);
                ttft = performance.now() - started;
                gotFirstToken = true;

                this.sessionStore.updateMessage(sessionId, assistantId, message => ({
                    ...message,
                    content: isContinuation ? (message.content || '') + content : content,
                    finishReason: finishReason ?? message.finishReason,
                    metrics: {
                        ...(message.metrics ?? {}),
                        ttft: message.metrics?.ttft || Math.round(ttft),
                        tokensIn: usage.tokensIn ?? message.metrics?.tokensIn,
                        tokensOut: usage.tokensOut ?? message.metrics?.tokensOut
                    }
                }));
            }

            if (!gotFirstToken) ttft = performance.now() - started;
            this.finalize(sessionId, assistantId, started, ttft, estimatedInput, false);
        } catch (error: unknown) {
            if ((isAppError(error) && error.type === 'aborted') || (error instanceof Error && error.name === 'AbortError')) {
                this.finalize(sessionId, assistantId, started, ttft, estimatedInput, true);
                return;
            }
            this.fail(sessionId, assistantId, toAppError(error), started);
        } finally {
            this.api.release(sessionId);
            this.sessionStore.updateMessage(sessionId, assistantId, message =>
                message.isStreaming ? { ...message, isStreaming: false } : message
            );
        }
    }

    private applyChunk(sessionId: string, messageId: string, chunk: StreamChunk, ttft: number): void {
        const usage = this.api.usageFromChunk(chunk);
        this.sessionStore.updateMessage(sessionId, messageId, message => ({
            ...message,
            content: (message.content || '') + chunk.content,
            reasoning: chunk.reasoning ? (message.reasoning || '') + chunk.reasoning : message.reasoning,
            finishReason: chunk.finishReason ?? message.finishReason,
            metrics: {
                ...(message.metrics ?? {}),
                ttft: message.metrics?.ttft || Math.round(ttft),
                tokensIn: usage.tokensIn ?? message.metrics?.tokensIn,
                tokensOut: usage.tokensOut ?? message.metrics?.tokensOut
            }
        }));
    }

    private finalize(
        sessionId: string,
        messageId: string,
        started: number,
        ttft: number,
        estimatedInput: number,
        stopped: boolean
    ): void {
        const totalTime = performance.now() - started;
        this.sessionStore.updateMessage(sessionId, messageId, message => {
            const metrics = { ...(message.metrics ?? {}) };
            metrics.totalTime = Math.round(totalTime);
            if (!metrics.ttft && ttft > 0) metrics.ttft = Math.round(ttft);

            if (metrics.tokensIn == null) {
                metrics.tokensIn = estimatedInput;
                metrics.estimated = true;
            }
            if (metrics.tokensOut == null) {
                metrics.tokensOut = estimateTokens(message.content) + estimateTokens(message.reasoning ?? '');
                metrics.estimated = true;
            }

            return {
                ...message,
                isStreaming: false,
                finishReason: stopped ? 'stopped' : (message.finishReason ?? 'stop'),
                metrics
            };
        });
    }

    private fail(sessionId: string, messageId: string, error: AppError, started?: number): void {
        this.toast.error(error.message);
        this.sessionStore.updateMessage(sessionId, messageId, message => ({
            ...message,
            isStreaming: false,
            error,
            finishReason: 'error',
            metrics: started === undefined
                ? message.metrics
                : { ...(message.metrics ?? {}), totalTime: Math.round(performance.now() - started) }
        }));
    }

    private historyForRequest(messages: Message[], options: ProcessOptions): Message[] {
        return messages.filter(message => {
            if (options.excludeMessageId && message.id === options.excludeMessageId) return false;
            if (message.error) return false;
            if (options.existingMessageId && message.id === options.existingMessageId) return !!message.content;
            return !message.isStreaming;
        });
    }

    private findSession(sessionId: string): ChatSession | undefined {
        return this.sessionStore.sessions().find(session => session.id === sessionId);
    }

    private currentActiveSessions(): ChatSession[] {
        return activeSessions(
            this.sessionStore.sessions(),
            this.configStore.state(),
            this.providerStore.providers()
        );
    }
}
