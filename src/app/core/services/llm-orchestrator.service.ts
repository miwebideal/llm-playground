// src/app/core/services/llm-orchestrator.service.ts

import { Injectable, computed, inject, signal } from '@angular/core';
import { ChatSession } from '../models';
import { activeSessions, sessionReadiness } from '../state/session.selectors';
import { ConfigStore } from '../stores/config.store';
import { ProviderStore } from '../stores/provider.store';
import { SessionStore } from '../stores/session.store';
import { LlmApiService } from './llm-api.service';
import { SessionRunnerService } from './session-runner.service';
import { ToastService } from './toast.service';

/**
 * Comandos de alto nivel (enviar, continuar, reintentar, regenerar, detener) sobre
 * las sesiones activas. La ejecución de cada request vive en SessionRunnerService.
 */
const CONTINUE_PROMPT = 'Continúa exactamente desde donde te quedaste en tu última respuesta. No repitas lo que ya dijiste, no agregues introducciones ni saludos, simplemente continúa el texto o código de forma natural.';

@Injectable({ providedIn: 'root' })
export class LlmOrchestratorService {

    private api = inject(LlmApiService);
    private runner = inject(SessionRunnerService);
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
                this.runner.run(session.id, userContent, { excludeMessageId: userMessageId })
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
            this.runner.fail(sessionId, messageId, {
                type: 'invalid_params',
                message: `No se puede continuar: ${readiness.reason}.`,
                retryable: false
            });
            return;
        }

        this._isLoading.set(true);
        this.sessionStore.updateMessage(sessionId, messageId, message => ({ ...message, isStreaming: true, error: undefined }));

        try {
            await this.runner.run(sessionId, CONTINUE_PROMPT, { existingMessageId: messageId });
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
            this.runner.fail(sessionId, messageId, {
                type: 'invalid_params',
                message: `No se puede reintentar: ${readiness.reason}.`,
                retryable: false
            });
            return;
        }

        this.sessionStore.truncateMessagesFrom(sessionId, userIndex);

        this._isLoading.set(true);
        try {
            await this.runner.run(sessionId, userMessage.content, { excludeMessageId: userMessage.id });
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
                jobs.push(this.runner.run(session.id, userMessage.content, { excludeMessageId: userMessage.id }));
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
