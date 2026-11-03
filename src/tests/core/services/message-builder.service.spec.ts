// src/tests/core/services/message-builder.service.spec.ts

import { TestBed } from '@angular/core/testing';
import { MessageBuilderService } from '../../../app/core/services/message-builder.service';
import { ModelRegistryService } from '../../../app/core/registry/model-registry.service';
import { ChatSession, GlobalConfig, Message, createSession } from '../../../app/core/models';

function session(partial: Partial<ChatSession>): ChatSession {
    return { ...createSession('session-a', 'Modelo A'), ...partial };
}

function message(partial: Partial<Message> & Pick<Message, 'role' | 'content'>): Message {
    return { id: crypto.randomUUID(), timestamp: new Date(), ...partial };
}

const config = (partial: Partial<GlobalConfig>): GlobalConfig => ({
    includeHistory: false,
    streamMode: false,
    isCompareMode: false,
    includeReasoningExport: true,
    activeSessionId: 'session-a',
    splitWidth: 50,
    ...partial
});

describe('MessageBuilderService', () => {
    let service: MessageBuilderService;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [ModelRegistryService, MessageBuilderService] });
        service = TestBed.inject(MessageBuilderService);
    });

    it('incluye el system prompt si useParams y el modelo lo soporta', () => {
        const result = service.build('Hola', session({ systemPrompt: 'Sos útil.' }), config({}), []);
        expect(result[0]).toEqual({ role: 'system', content: 'Sos útil.' });
        expect(result.at(-1)).toEqual({ role: 'user', content: 'Hola' });
    });

    it('no incluye system prompt si useParams es false', () => {
        const result = service.build('Hola', session({ useParams: false, systemPrompt: 'Sos útil.' }), config({}), []);
        expect(result.length).toBe(1);
        expect(result[0].role).toBe('user');
    });

    it('incluye historial válido e ignora errores y streaming', () => {
        const history: Message[] = [
            message({ role: 'user', content: 'Pregunta 1' }),
            message({ role: 'assistant', content: 'Respuesta 1' }),
            message({ role: 'assistant', content: '', error: { type: 'auth', message: 'Fallo', retryable: false } }),
            message({ role: 'assistant', content: 'Escribiendo', isStreaming: true })
        ];

        const result = service.build('Pregunta 2', session({ useParams: false }), config({ includeHistory: true }), history);
        expect(result.map(m => m.content)).toEqual(['Pregunta 1', 'Respuesta 1', 'Pregunta 2']);
    });

    it('no incluye historial si includeHistory es false', () => {
        const history: Message[] = [message({ role: 'user', content: 'Pregunta 1' })];
        const result = service.build('Pregunta 2', session({ useParams: false }), config({}), history);
        expect(result.length).toBe(1);
        expect(result[0].content).toBe('Pregunta 2');
    });
});
