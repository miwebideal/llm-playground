// src/tests/core/services/message-builder.service.spec.ts

import { TestBed } from '@angular/core/testing';
import { MessageBuilderService } from '../../../app/core/services/message-builder.service';
import { ChatSession, GlobalConfig, Message } from '../../../app/models/chat.models';

describe('MessageBuilderService', () => {
    let service: MessageBuilderService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [MessageBuilderService]
        });
        service = TestBed.inject(MessageBuilderService);
    });

    it('debería crearse correctamente', () => {
        expect(service).toBeTruthy();
    });

    it('debería incluir el system prompt si useParams es true y el prompt no está vacío', () => {
        const session = { useParams: true, systemPrompt: 'Sos un asistente útil.' } as ChatSession;
        const config = { includeHistory: false } as GlobalConfig;

        const result = service.build('Hola', session, config, []);

        expect(result.length).toBe(2);
        expect(result[0].role).toBe('system');
        expect(result[0].content).toBe('Sos un asistente útil.');
        expect(result[1].role).toBe('user');
        expect(result[1].content).toBe('Hola');
    });

    it('NO debería incluir el system prompt si useParams es false', () => {
        const session = { useParams: false, systemPrompt: 'Sos un asistente útil.' } as ChatSession;
        const config = { includeHistory: false } as GlobalConfig;

        const result = service.build('Hola', session, config, []);

        expect(result.length).toBe(1);
        expect(result[0].role).toBe('user');
        expect(result[0].content).toBe('Hola');
    });

    it('debería incluir el historial si includeHistory es true (ignorando errores y streaming)', () => {
        const session = { useParams: false, systemPrompt: '' } as ChatSession;
        const config = { includeHistory: true } as GlobalConfig;

        const history: Message[] = [
            { id: '1', role: 'user', content: 'Pregunta 1', timestamp: new Date() },
            { id: '2', role: 'assistant', content: 'Respuesta 1', timestamp: new Date() },
            { id: '3', role: 'assistant', content: 'Error', error: 'Fallo', timestamp: new Date() }, // Debe ignorarse
            { id: '4', role: 'assistant', content: 'Escribiendo...', isStreaming: true, timestamp: new Date() } // Debe ignorarse
        ];

        const result = service.build('Pregunta 2', session, config, history);

        expect(result.length).toBe(3); // Pregunta 1, Respuesta 1, Pregunta 2
        expect(result[0].content).toBe('Pregunta 1');
        expect(result[1].content).toBe('Respuesta 1');
        expect(result[2].content).toBe('Pregunta 2');
    });

    it('NO debería incluir el historial si includeHistory es false', () => {
        const session = { useParams: false, systemPrompt: '' } as ChatSession;
        const config = { includeHistory: false } as GlobalConfig;

        const history: Message[] = [
            { id: '1', role: 'user', content: 'Pregunta 1', timestamp: new Date() }
        ];

        const result = service.build('Pregunta 2', session, config, history);

        expect(result.length).toBe(1);
        expect(result[0].content).toBe('Pregunta 2');
    });
});
