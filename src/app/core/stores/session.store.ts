// src/app/core/stores/session.store.ts

import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { ChatSession, Message } from '../../models/chat.models';
import { StorageService } from '../services/storage.service';

@Injectable({ providedIn: 'root' })
export class SessionStore {

    private storage = inject(StorageService);

    private _sessions = signal<ChatSession[]>([]);
    private _isLoaded = signal(false);

    readonly sessions = computed(() => this._sessions());
    readonly isLoaded = computed(() => this._isLoaded());

    constructor() {
        this.load();
        effect(() => {
            if (this._isLoaded()) {
                this.storage.dispatchSaveSessions(this._sessions());
            }
        });
    }

    private async load() {
        let loaded = await this.storage.loadSessions();
        if (loaded.length === 0) {
            loaded = [
                { id: 'session-a', name: 'Modelo A', providerId: 'openai', model: 'gpt-4o-mini', messages: [], useParams: true, temperature: 0.7, maxTokens: 8192, systemPrompt: 'You are a helpful assistant.' },
                { id: 'session-b', name: 'Modelo B', providerId: 'openai', model: 'gpt-4o-mini', messages: [], useParams: true, temperature: 0.7, maxTokens: 8192, systemPrompt: 'You are a helpful assistant.' }
            ];
        }
        this._sessions.set(loaded);
        this._isLoaded.set(true);
    }

    updateSession(id: string, partial: Partial<ChatSession>) {
        this._sessions.update(sessions => sessions.map(s => s.id === id ? { ...s, ...partial } : s));
    }

    addMessage(sessionId: string, message: Message) {
        this._sessions.update(sessions => sessions.map(s => s.id === sessionId ? { ...s, messages: [...s.messages, message] } : s));
    }

    updateMessage(sessionId: string, messageId: string, updater: (msg: Message) => Message) {
        this._sessions.update(sessions => sessions.map(s => s.id === sessionId ? { ...s, messages: s.messages.map(m => m.id === messageId ? updater(m) : m) } : s));
    }

    deleteMessage(sessionId: string, messageId: string) {
        this._sessions.update(sessions => sessions.map(s => s.id === sessionId ? { ...s, messages: s.messages.filter(m => m.id !== messageId) } : s));
    }

    clearMessages(sessionId?: string) {
        this._sessions.update(sessions => sessions.map(s => (!sessionId || s.id === sessionId) ? { ...s, messages: [] } : s));
    }

    truncateMessagesFrom(sessionId: string, index: number) {
        this._sessions.update(sessions => sessions.map(s => s.id === sessionId ? { ...s, messages: s.messages.slice(0, index + 1) } : s));
    }

}
