// src/app/stores/messages.store.ts

import { Injectable, signal, computed, effect } from '@angular/core';
import { Message } from '../models/llm.models';

const STORAGE_KEY = 'llm-messages-v1';
const MAX_MESSAGES = 200;

function generateId(): string {
    return crypto.randomUUID();
}

function loadFromStorage(): Message[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return parsed.map((m: any) => ({
            id: m.id || generateId(),
            ...m,
            timestamp: new Date(m.timestamp),
            isStreaming: false,
            error: undefined,
        }));
    } catch (e) {
        console.error('Error cargando mensajes:', e);
        return [];
    }
}

function saveToStorage(msgs: Message[]): Message[] {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
        return msgs;
    } catch (e: any) {
        if (isQuotaExceeded(e)) {
            console.warn('Quota exceeded, reducing messages by 50%');
            const reduced = msgs.slice(Math.floor(msgs.length / 2));
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(reduced));
                return reduced;
            } catch (e2) {
                console.error('Failed to save even reduced messages, clearing');
                localStorage.removeItem(STORAGE_KEY);
                return [];
            }
        }
        console.error('Error saving messages:', e);
        return msgs;
    }
}

function isQuotaExceeded(e: any): boolean {
    return (
        e instanceof DOMException &&
        (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    );
}

@Injectable({ providedIn: 'root' })
export class MessagesStore {

    private _state = signal<Message[]>(loadFromStorage());

    readonly state = computed(() => this._state());
    readonly count = computed(() => this._state().length);
    readonly isEmpty = computed(() => this._state().length === 0);
    readonly last = computed(() => {
        const msgs = this._state();
        return msgs.length > 0 ? msgs[msgs.length - 1] : null;
    });
    readonly validHistory = computed(() =>
        this._state().filter(m => !m.isStreaming && !m.error && m.role !== 'system')
    );

    constructor() {
        let lastSaved = '';
        effect(() => {
            const msgs = this._state();
            const serialized = JSON.stringify(msgs);
            if (serialized !== lastSaved) {
                const result = saveToStorage(msgs);
                lastSaved = JSON.stringify(result);
            }
        });
    }

    append(msg: Omit<Message, 'id'> & { id?: string }) {
        const withId: Message = { ...msg, id: msg.id || generateId() } as Message;
        this._state.update(current => {
            const next = [...current, withId];
            return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
        });
    }

    updateAt(index: number, updater: (msg: Message) => Message) {
        this._state.update(current => {
            if (index < 0 || index >= current.length) return current;
            const next = [...current];
            next[index] = updater(next[index]);
            return next;
        });
    }


    updateLast(updater: (msg: Message) => Message) {
        const idx = this._state().length - 1;
        if (idx >= 0) {
            this._state.update(current => {
                const next = [...current];
                next[idx] = updater(next[idx]);
                return next;
            });
        }
    }

    updateById(id: string, updater: (msg: Message) => Message) {
        this._state.update(current => {
            const index = current.findIndex(m => m.id === id);
            if (index === -1) return current;
            const next = [...current];
            next[index] = updater(next[index]);
            return next;
        });
    }

    delete(index: number) {
        console.warn('[MessagesStore] delete(index) is deprecated, use deleteById(id) instead');
        this._state.update(current => current.filter((_, i) => i !== index));
    }

    findIndexById(id: string): number {
        return this._state().findIndex(m => m.id === id);
    }

    deleteById(id: string) {
        this._state.update(current => current.filter(m => m.id !== id));
    }

    clear() {
        this._state.set([]);
    }

    truncateFrom(index: number) {
        this._state.update(current => current.slice(0, index + 1));
    }

    findLastUserIndex(): number {
        const msgs = this._state();
        for (let i = msgs.length - 1; i >= 0; i--) {
            if (msgs[i].role === 'user') return i;
        }
        return -1;
    }

}