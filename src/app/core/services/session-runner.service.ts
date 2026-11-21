// src/app/core/services/session-runner.service.ts

import { Injectable, inject } from '@angular/core';
import { AppError, ChatSession, isAppError, Message, toAppError } from '../models';
import { ConfigStore } from '../stores/config.store';
import { ProviderStore } from '../stores/provider.store';
import { RunLogStore } from '../stores/run-log.store';
import { SessionStore } from '../stores/session.store';
import { estimateTokens } from '../../utils/token.utils';
import { LlmApiService } from './llm-api.service';
import { MessageBuilderService } from './message-builder.service';
import { StreamChunk } from './stream-parser.service';
import { StreamReaderService } from './stream-reader.service';
import { ToastService } from './toast.service';

export interface RunOptions {
    existingMessageId?: string;
    excludeMessageId?: string;
}

/** Ejecuta UNA request de una sesión: arma mensajes, llama, streamea, mide y registra. */
@Injectable({ providedIn: 'root' })
export class SessionRunnerService {

    private api = inject(LlmApiService);
    private builder = inject(MessageBuilderService);
    private reader = inject(StreamReaderService);
    private toast = inject(ToastService);
    private configStore = inject(ConfigStore);
    private sessionStore = inject(SessionStore);
    private providerStore = inject(ProviderStore);
    private runLog = inject(RunLogStore);

    /** Ejecuta una sesión completa: request, stream, métricas y persistencia. */
    async run(sessionId: string, userContent: string, options: RunOptions = {}): Promise<void> {
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
            this.logRun(sessionId, assistantId);
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

    fail(sessionId: string, messageId: string, error: AppError, started?: number): void {
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

    private historyForRequest(messages: Message[], options: RunOptions): Message[] {
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

    private logRun(sessionId: string, messageId: string): void {
        const message = this.findSession(sessionId)?.messages.find(m => m.id === messageId);
        if (message) this.runLog.record(message);
    }
}
