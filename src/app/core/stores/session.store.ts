// src/app/core/stores/session.store.ts

import { Injectable, signal, computed } from '@angular/core';
import { Subject, debounceTime } from 'rxjs';
import { ChatSession, Message } from '../../models/chat.models';

const SESSIONS_KEY = 'llm-sessions-v1';

@Injectable({ providedIn: 'root' })
export class SessionStore {
    
    private _sessions = signal<ChatSession[]>([]);
    readonly sessions = computed(() => this._sessions());
    readonly isLoaded = signal(false);

    private save$ = new Subject<ChatSession[]>();

    constructor() {
        this.load();
        this.save$.pipe(debounceTime(1000)).subscribe(data => {
            localStorage.setItem(SESSIONS_KEY, JSON.stringify(data));
        });
    }

    private load() {
        try {
            const raw = localStorage.getItem(SESSIONS_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                // Validación estricta
                if (!Array.isArray(parsed) || (parsed.length > 0 && !parsed[0].providerId)) {
                    throw new Error('Backup corrupto');
                }
                this._sessions.set(parsed.map((s: any) => ({
                    ...s,
                    useParams: s.useParams ?? true,
                    temperature: s.temperature ?? 0.7,
                    maxTokens: s.maxTokens ?? 8192,
                    systemPrompt: s.systemPrompt ?? 'You are a helpful assistant.',
                    messages: s.messages?.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })) || []
                })));
            } else {
                throw new Error('No hay backup');
            }
        } catch (e) {
            console.warn('Sesiones corruptas o vacías. Restaurando defaults.');
            this._sessions.set([
                { id: 'session-a', name: 'Modelo A', providerId: 'openai', model: 'gpt-4o-mini', messages: [], useParams: true, temperature: 0.7, maxTokens: 8192, systemPrompt: 'You are a helpful assistant.' },
                { id: 'session-b', name: 'Modelo B', providerId: 'openai', model: 'gpt-4o-mini', messages: [], useParams: true, temperature: 0.7, maxTokens: 8192, systemPrompt: 'You are a helpful assistant.' }
            ]);
            localStorage.removeItem(SESSIONS_KEY);
        }
        this.isLoaded.set(true);
    }

    private triggerSave() {
        this.save$.next(this._sessions());
    }

    updateSession(id: string, partial: Partial<ChatSession>) {
        this._sessions.update(sessions => sessions.map(s => s.id === id ? { ...s, ...partial } : s));
        this.triggerSave();
    }

    addMessage(sessionId: string, message: Message) {
        this._sessions.update(sessions => sessions.map(s => s.id === sessionId ? { ...s, messages: [...s.messages, message] } : s));
        this.triggerSave();
    }

    updateMessage(sessionId: string, messageId: string, updater: (msg: Message) => Message) {
        this._sessions.update(sessions => sessions.map(s => s.id === sessionId ? { ...s, messages: s.messages.map(m => m.id === messageId ? updater(m) : m) } : s));
        this.triggerSave();
    }

    deleteMessage(sessionId: string, messageId: string) {
        this._sessions.update(sessions => sessions.map(s => s.id === sessionId ? { ...s, messages: s.messages.filter(m => m.id !== messageId) } : s));
        this.triggerSave();
    }

    clearMessages(sessionId?: string) {
        this._sessions.update(sessions => sessions.map(s => (!sessionId || s.id === sessionId) ? { ...s, messages: [] } : s));
        this.triggerSave();
    }

    truncateMessagesFrom(sessionId: string, index: number) {
        this._sessions.update(sessions => sessions.map(s => s.id === sessionId ? { ...s, messages: s.messages.slice(0, index + 1) } : s));
        this.triggerSave();
    }

}
