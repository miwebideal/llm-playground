// src/app/core/stores/session.store.ts

import { Injectable, signal, computed, inject } from '@angular/core';
import { ChatSession, Message } from '../../models/chat.models';
import { PersistenceService, STORAGE_KEYS } from '../services/persistence.service';

const DEFAULT_SESSIONS: ChatSession[] = [
    {
        id: 'session-a', name: 'Modelo A', providerId: 'openai', model: 'gpt-4o-mini', messages: [],
        useParams: true, temperature: 0.7, topP: 1, maxTokens: 8192, jsonMode: false,
        systemPrompt: 'You are a helpful assistant.'
    },
    {
        id: 'session-b', name: 'Modelo B', providerId: 'openai', model: 'gpt-4o-mini', messages: [],
        useParams: true, temperature: 0.7, topP: 1, maxTokens: 8192, jsonMode: false,
        systemPrompt: 'You are a helpful assistant.'
    }
];

function isSessions(data: unknown): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every((item) => {
        const s = item as Partial<ChatSession>;
        return typeof s.id === 'string'
            && typeof s.providerId === 'string'
            && Array.isArray(s.messages);
    });
}

function hydrateSession(s: ChatSession): ChatSession {
    const messages = (s.messages || [])
        .map(m => ({
            ...m,
            timestamp: new Date(m.timestamp),
            isStreaming: false
        }))
        .filter(m => !(m.role === 'assistant' && !m.content && !m.error));

    return {
        ...s,
        useParams: s.useParams ?? true,
        temperature: s.temperature ?? 0.7,
        topP: s.topP ?? 1,
        maxTokens: s.maxTokens ?? 8192,
        jsonMode: s.jsonMode ?? false,
        systemPrompt: s.systemPrompt ?? 'You are a helpful assistant.',
        messages
    };
}

@Injectable({ providedIn: 'root' })
export class SessionStore {

    private persist = inject(PersistenceService);

    private _sessions = signal<ChatSession[]>([]);
    readonly sessions = computed(() => this._sessions());
    readonly isLoaded = signal(false);

    constructor() {
        const saved = this.persist.load<ChatSession[]>(STORAGE_KEYS.sessions, isSessions);
        this._sessions.set(saved ? saved.map(hydrateSession) : DEFAULT_SESSIONS);
        this.isLoaded.set(true);
    }

    private queueSave() {
        this.persist.save(STORAGE_KEYS.sessions, this._sessions());
    }

    updateSession(id: string, partial: Partial<ChatSession>) {
        this._sessions.update(sessions =>
            sessions.map(s => s.id === id ? { ...s, ...partial } : s)
        );
        this.queueSave();
    }

    addMessage(sessionId: string, message: Message) {
        this._sessions.update(sessions =>
            sessions.map(s => s.id === sessionId ? { ...s, messages: [...s.messages, message] } : s)
        );
        this.queueSave();
    }

    updateMessage(sessionId: string, messageId: string, updater: (msg: Message) => Message) {
        this._sessions.update(sessions =>
            sessions.map(s => s.id === sessionId
                ? { ...s, messages: s.messages.map(m => m.id === messageId ? updater(m) : m) }
                : s)
        );
        this.queueSave();
    }

    deleteMessage(sessionId: string, messageId: string) {
        this._sessions.update(sessions =>
            sessions.map(s => s.id === sessionId
                ? { ...s, messages: s.messages.filter(m => m.id !== messageId) }
                : s)
        );
        this.queueSave();
    }

    clearMessages(sessionId?: string) {
        this._sessions.update(sessions =>
            sessions.map(s => (!sessionId || s.id === sessionId) ? { ...s, messages: [] } : s)
        );
        this.queueSave();
    }

    truncateMessagesFrom(sessionId: string, index: number) {
        this._sessions.update(sessions =>
            sessions.map(s => s.id === sessionId
                ? { ...s, messages: s.messages.slice(0, index + 1) }
                : s)
        );
        this.queueSave();
    }
}