// src/app/core/stores/session.store.ts

import { Injectable, signal, computed, effect } from '@angular/core';
import { ChatSession, Message } from '../../models/chat.models';
import { decrypt, encrypt } from '../../utils/crypto.utils';

const STORAGE_KEY = 'llm-sessions-v2';

@Injectable({ providedIn: 'root' })
export class SessionStore {
    private _sessions = signal<ChatSession[]>([]);
    private initialized = false;

    readonly sessions = computed(() => this._sessions());

    // Devuelve las sesiones activas (1 si es normal, 2 si es compare)
    readonly activeSessions = computed(() => {
        // Por ahora devolvemos todas, el layout decidirá cuántas mostrar
        return this._sessions();
    });

    constructor() {
        this.load();
        effect(() => {
            if (this.initialized) this.save(this._sessions());
        });
    }

    private async load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed: ChatSession[] = JSON.parse(raw);
                for (const s of parsed) {
                    if (s.apiToken) s.apiToken = await decrypt(s.apiToken);
                    // Asegurar que las fechas vuelvan a ser objetos Date
                    s.messages = s.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
                }
                this._sessions.set(parsed);
            } else {
                // Estado inicial por defecto
                this._sessions.set([
                    { id: 'session-a', name: 'Modelo A', apiUrl: '', apiToken: '', model: '', provider: 'OpenAI', messages: [] },
                    { id: 'session-b', name: 'Modelo B', apiUrl: '', apiToken: '', model: '', provider: 'OpenAI', messages: [] }
                ]);
            }
        } catch (e) {
            console.error('Error cargando sesiones:', e);
        } finally {
            this.initialized = true;
        }
    }

    private async save(sessions: ChatSession[]) {
        try {
            // Clonamos profundo para no mutar el estado al encriptar
            const toStore = JSON.parse(JSON.stringify(sessions)) as ChatSession[];
            for (const s of toStore) {
                if (s.apiToken) s.apiToken = await encrypt(s.apiToken);
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
        } catch (e) {
            console.warn('No se pudo guardar sesiones:', e);
        }
    }

    updateSession(id: string, partial: Partial<ChatSession>) {
        this._sessions.update(sessions =>
            sessions.map(s => s.id === id ? { ...s, ...partial } : s)
        );
    }

    addMessage(sessionId: string, message: Message) {
        this._sessions.update(sessions =>
            sessions.map(s => {
                if (s.id === sessionId) {
                    return { ...s, messages: [...s.messages, message] };
                }
                return s;
            })
        );
    }

    updateMessage(sessionId: string, messageId: string, updater: (msg: Message) => Message) {
        this._sessions.update(sessions =>
            sessions.map(s => {
                if (s.id === sessionId) {
                    return {
                        ...s,
                        messages: s.messages.map(m => m.id === messageId ? updater(m) : m)
                    };
                }
                return s;
            })
        );
    }

    deleteMessage(sessionId: string, messageId: string) {
        this._sessions.update(sessions =>
            sessions.map(s => {
                if (s.id === sessionId) {
                    return { ...s, messages: s.messages.filter(m => m.id !== messageId) };
                }
                return s;
            })
        );
    }

    clearMessages(sessionId?: string) {
        this._sessions.update(sessions =>
            sessions.map(s => {
                if (!sessionId || s.id === sessionId) {
                    return { ...s, messages: [] };
                }
                return s;
            })
        );
    }

    truncateMessagesFrom(sessionId: string, index: number) {
        this._sessions.update(sessions =>
            sessions.map(s => {
                if (s.id === sessionId) {
                    return { ...s, messages: s.messages.slice(0, index + 1) };
                }
                return s;
            })
        );
    }
}
