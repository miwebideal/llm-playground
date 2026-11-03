// src/tests/core/stores/session.store.spec.ts

import { TestBed } from '@angular/core/testing';
import { SessionStore } from '../../../app/core/stores/session.store';
import { StorageService, STORAGE_KEYS } from '../../../app/core/services/storage.service';
import { ToastService } from '../../../app/core/services/toast.service';

function createStore(): SessionStore {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [ToastService, StorageService, SessionStore] });
    return TestBed.inject(SessionStore);
}

describe('SessionStore', () => {
    afterEach(() => localStorage.clear());

    it('crea las sesiones por defecto si no hay datos', () => {
        localStorage.clear();
        const store = createStore();
        expect(store.sessions().length).toBe(2);
        expect(store.sessions()[0].model).toBe('gpt-4o-mini');
    });

    it('migra error string a AppError', () => {
        localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify([{
            id: 'session-a',
            name: 'A',
            providerId: 'openai',
            model: 'gpt-4o',
            messages: [{ id: 'm1', role: 'assistant', content: 'x', error: 'falló', timestamp: new Date().toISOString() }]
        }]));

        const message = createStore().sessions()[0].messages[0];
        expect(message.error?.type).toBe('unknown');
        expect(message.error?.message).toBe('falló');
    });

    it('descarta assistant vacío sin error y normaliza fechas', () => {
        localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify([{
            id: 'session-a',
            name: 'A',
            providerId: 'openai',
            model: 'gpt-4o',
            messages: [
                { id: 'm1', role: 'assistant', content: '', timestamp: 'no-es-fecha' },
                { id: 'm2', role: 'user', content: 'hola', timestamp: '2026-01-01T00:00:00.000Z' }
            ]
        }]));

        const session = createStore().sessions()[0];
        expect(session.messages.length).toBe(1);
        expect(session.messages[0].timestamp instanceof Date).toBe(true);
        expect(session.messages[0].isStreaming).toBe(false);
    });

    it('clearMessages sólo borra los ids indicados', () => {
        const store = createStore();
        store.addMessage('session-a', { id: 'a1', role: 'user', content: 'a', timestamp: new Date() });
        store.addMessage('session-b', { id: 'b1', role: 'user', content: 'b', timestamp: new Date() });

        store.clearMessages(['session-a']);
        expect(store.sessions().find(s => s.id === 'session-a')?.messages.length).toBe(0);
        expect(store.sessions().find(s => s.id === 'session-b')?.messages.length).toBe(1);
    });

    it('truncateMessagesFrom conserva hasta el índice', () => {
        const store = createStore();
        store.addMessage('session-a', { id: '1', role: 'user', content: 'a', timestamp: new Date() });
        store.addMessage('session-a', { id: '2', role: 'assistant', content: 'b', timestamp: new Date() });
        store.addMessage('session-a', { id: '3', role: 'user', content: 'c', timestamp: new Date() });

        store.truncateMessagesFrom('session-a', 0);
        expect(store.sessions()[0].messages.map(m => m.id)).toEqual(['1']);
    });
});
