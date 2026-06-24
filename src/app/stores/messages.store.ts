// src/app/stores/messages.store.ts

import { Injectable, signal, computed, effect } from '@angular/core';
import { Message } from '../models/llm.models';

const STORAGE_KEY_V2 = 'llm-messages-v2';
const STORAGE_KEY_V1 = 'llm-messages-v1';
const MAX_MESSAGES = 200;

export interface MessagesState {
    a: Message[];
    b: Message[];
}

function generateId(): string {
    return crypto.randomUUID();
}

// Restaura un mensaje desde el localStorage asegurando que tenga el formato correcto
function reviveMessage(m: Partial<Message>): Message {
    return {
        id: m.id || generateId(),
        role: m.role || 'user',
        content: m.content || '',
        timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
        model: m.model,
        provider: m.provider,
        reasoning: m.reasoning,
        metrics: m.metrics,
        finishReason: m.finishReason,
        isStreaming: false,
        error: undefined,
    };
}

function loadFromStorage(): MessagesState {
    try {
        const rawV2 = localStorage.getItem(STORAGE_KEY_V2);
        if (rawV2) {
            const parsed = JSON.parse(rawV2);
            return {
                a: (parsed.a || []).map(reviveMessage),
                b: (parsed.b || []).map(reviveMessage)
            };
        }

        const rawV1 = localStorage.getItem(STORAGE_KEY_V1);
        if (rawV1) {
            const parsed = JSON.parse(rawV1);
            const msgs = parsed.map(reviveMessage);
            const state = { a: msgs, b: [...msgs] };
            localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(state));
            localStorage.removeItem(STORAGE_KEY_V1);
            return state;
        }

        return { a: [], b: [] };
    } catch (e) {
        console.error('Error cargando mensajes:', e);
        return { a: [], b: [] };
    }
}

function saveToStorage(state: MessagesState): MessagesState {
    try {
        localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(state));
        return state;
    } catch (e) {
        console.error('Error guardando mensajes:', e);
        return state;
    }
}

@Injectable({ providedIn: 'root' })
export class MessagesStore {

    private _state = signal<MessagesState>(loadFromStorage());
    private saveTimeout: ReturnType<typeof setTimeout> | null = null;

    readonly stateA = computed(() => this._state().a);
    readonly stateB = computed(() => this._state().b);
    readonly isEmpty = computed(() => this._state().a.length === 0 && this._state().b.length === 0);

    constructor() {
        effect(() => {
            const state = this._state();

            if (this.saveTimeout) {
                clearTimeout(this.saveTimeout);
            }

            this.saveTimeout = setTimeout(() => {
                saveToStorage(state);
            }, 500);
        });
    }

    append(msg: Omit<Message, 'id'> & { id?: string }, thread: 'a' | 'b' | 'both' = 'both') {
        const withId = { ...msg, id: msg.id || generateId() } as Message;

        this._state.update(current => {
            const next = { ...current };

            if (thread === 'a' || thread === 'both') {
                next.a = [...current.a, { ...withId }];
                if (next.a.length > MAX_MESSAGES) next.a = next.a.slice(-MAX_MESSAGES);
            }
            if (thread === 'b' || thread === 'both') {
                next.b = [...current.b, { ...withId }];
                if (next.b.length > MAX_MESSAGES) next.b = next.b.slice(-MAX_MESSAGES);
            }
            return next;
        });
    }

    updateById(id: string, updater: (msg: Message) => Message) {
        this._state.update(current => {
            const next = { ...current };

            const idxA = current.a.findIndex(m => m.id === id);
            if (idxA !== -1) {
                next.a = [...current.a];
                next.a[idxA] = updater(next.a[idxA]);
            }

            const idxB = current.b.findIndex(m => m.id === id);
            if (idxB !== -1) {
                next.b = [...current.b];
                next.b[idxB] = updater(next.b[idxB]);
            }

            return next;
        });
    }

    deleteById(id: string) {
        this._state.update(current => ({
            a: current.a.filter(m => m.id !== id),
            b: current.b.filter(m => m.id !== id)
        }));
    }

    clear() {
        this._state.set({ a: [], b: [] });
    }

    validHistory(thread: 'a' | 'b'): Message[] {
        return this._state()[thread].filter(m => !m.isStreaming && !m.error && m.role !== 'system');
    }

    last(thread: 'a' | 'b'): Message | null {
        const msgs = this._state()[thread];
        return msgs.length > 0 ? msgs[msgs.length - 1] : null;
    }

    findIndexById(id: string, thread: 'a' | 'b'): number {
        return this._state()[thread].findIndex(m => m.id === id);
    }

    truncateFrom(index: number, thread: 'a' | 'b' | 'both' = 'both') {
        this._state.update(current => {
            const next = { ...current };
            if (thread === 'a' || thread === 'both') next.a = current.a.slice(0, index + 1);
            if (thread === 'b' || thread === 'both') next.b = current.b.slice(0, index + 1);
            return next;
        });
    }

    findLastUserIndex(thread: 'a' | 'b'): number {
        const msgs = this._state()[thread];
        for (let i = msgs.length - 1; i >= 0; i--) {
            if (msgs[i].role === 'user') return i;
        }
        return -1;
    }

}
