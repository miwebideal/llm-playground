// src/app/core/stores/session.store.ts

import { Injectable, inject, signal } from '@angular/core';
import {
    ChatSession,
    DEFAULT_SESSION_SETTINGS,
    Message,
    MessageMetrics,
    FinishReason,
    isAppError,
    legacyError
} from '../models';
import { StorageService, STORAGE_KEYS } from '../services/storage.service';

const DEFAULT_SESSIONS: ChatSession[] = [
    { id: 'session-a', name: 'Modelo A', providerId: 'openai', model: 'gpt-4o-mini', messages: [], ...DEFAULT_SESSION_SETTINGS },
    { id: 'session-b', name: 'Modelo B', providerId: 'openai', model: 'gpt-4o-mini', messages: [], ...DEFAULT_SESSION_SETTINGS }
];

function isSessions(data: unknown): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every(item => {
        const session = item as Partial<ChatSession>;
        return typeof session.id === 'string'
            && typeof session.providerId === 'string'
            && Array.isArray(session.messages);
    });
}

function hydrateMetrics(raw: unknown): MessageMetrics | undefined {
    if (!raw || typeof raw !== 'object') return undefined;
    const value = raw as MessageMetrics;
    return {
        ttft: typeof value.ttft === 'number' ? value.ttft : undefined,
        totalTime: typeof value.totalTime === 'number' ? value.totalTime : undefined,
        tokensIn: typeof value.tokensIn === 'number' ? value.tokensIn : undefined,
        tokensOut: typeof value.tokensOut === 'number' ? value.tokensOut : undefined,
        estimated: value.estimated === true
    };
}

function hydrateMessage(raw: unknown): Message | null {
    if (!raw || typeof raw !== 'object') return null;
    const message = raw as Partial<Message> & { error?: unknown };
    if (message.role !== 'user' && message.role !== 'assistant') return null;
    if (typeof message.content !== 'string') return null;

    const error = isAppError(message.error)
        ? message.error
        : typeof message.error === 'string' && message.error
            ? legacyError(message.error)
            : undefined;

    if (message.role === 'assistant' && !message.content && !error) return null;

    const rawTimestamp = message.timestamp ? new Date(message.timestamp) : new Date();
    const timestamp = Number.isNaN(rawTimestamp.getTime()) ? new Date() : rawTimestamp;

    return {
        id: typeof message.id === 'string' ? message.id : crypto.randomUUID(),
        role: message.role,
        content: message.content,
        reasoning: typeof message.reasoning === 'string' ? message.reasoning : undefined,
        timestamp,
        model: typeof message.model === 'string' ? message.model : undefined,
        provider: typeof message.provider === 'string' ? message.provider : undefined,
        finishReason: typeof message.finishReason === 'string' ? message.finishReason as FinishReason : undefined,
        metrics: hydrateMetrics(message.metrics),
        isStreaming: false,
        error
    };
}

function hydrateSession(session: ChatSession): ChatSession {
    const messages = (Array.isArray(session.messages) ? session.messages : [])
        .map(hydrateMessage)
        .filter((message): message is Message => message !== null);

    return {
        ...DEFAULT_SESSION_SETTINGS,
        ...session,
        providerId: session.providerId || 'unknown',
        model: session.model || '',
        messages,
        tokenLimitOverride: session.tokenLimitOverride === 'max_completion_tokens' || session.tokenLimitOverride === 'max_tokens'
            ? session.tokenLimitOverride
            : undefined
    };
}

@Injectable({ providedIn: 'root' })
export class SessionStore {

    private storage = inject(StorageService);

    private readonly _sessions = signal<ChatSession[]>([]);
    readonly sessions = this._sessions.asReadonly();
    readonly isLoaded = signal(false);

    constructor() {
        const saved = this.storage.load<ChatSession[]>(STORAGE_KEYS.sessions, isSessions);
        this._sessions.set((saved ?? DEFAULT_SESSIONS).map(hydrateSession));
        this.isLoaded.set(true);
    }

    updateSession(id: string, partial: Partial<ChatSession>): void {
        this._sessions.update(sessions =>
            sessions.map(session => session.id === id ? { ...session, ...partial } : session)
        );
        this.persist();
    }

    addMessage(sessionId: string, message: Message): void {
        this._sessions.update(sessions =>
            sessions.map(session => session.id === sessionId
                ? { ...session, messages: [...session.messages, message] }
                : session)
        );
        this.persist();
    }

    updateMessage(sessionId: string, messageId: string, updater: (message: Message) => Message): void {
        this._sessions.update(sessions =>
            sessions.map(session => session.id === sessionId
                ? { ...session, messages: session.messages.map(m => m.id === messageId ? updater(m) : m) }
                : session)
        );
        this.persist();
    }

    deleteMessage(sessionId: string, messageId: string): void {
        this._sessions.update(sessions =>
            sessions.map(session => session.id === sessionId
                ? { ...session, messages: session.messages.filter(m => m.id !== messageId) }
                : session)
        );
        this.persist();
    }

    clearMessages(sessionIds?: string[]): void {
        const ids = sessionIds && sessionIds.length ? new Set(sessionIds) : null;
        this._sessions.update(sessions =>
            sessions.map(session => !ids || ids.has(session.id) ? { ...session, messages: [] } : session)
        );
        this.persist();
    }

    truncateMessagesFrom(sessionId: string, index: number): void {
        this._sessions.update(sessions =>
            sessions.map(session => session.id === sessionId
                ? { ...session, messages: session.messages.slice(0, index + 1) }
                : session)
        );
        this.persist();
    }

    private persist(): void {
        this.storage.save(STORAGE_KEYS.sessions, this._sessions());
    }
}
