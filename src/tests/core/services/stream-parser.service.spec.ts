// src/tests/core/services/stream-parser.service.spec.ts

import { TestBed } from '@angular/core/testing';
import { StreamParserService } from '../../../app/core/services/stream-parser.service';

describe('StreamParserService', () => {
    let service: StreamParserService;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [StreamParserService] });
        service = TestBed.inject(StreamParserService);
    });

    it('parsea content', () => {
        const chunk = service.parseLine('data: {"choices":[{"delta":{"content":"hola"}}]}');
        expect(chunk?.content).toBe('hola');
    });

    it('acepta data sin espacio', () => {
        const chunk = service.parseLine('data:{"choices":[{"delta":{"content":"x"}}]}');
        expect(chunk?.content).toBe('x');
    });

    it('lee reasoning en ambas variantes', () => {
        expect(service.parseLine('data: {"choices":[{"delta":{"reasoning_content":"a"}}]}')?.reasoning).toBe('a');
        expect(service.parseLine('data: {"choices":[{"delta":{"reasoning":"b"}}]}')?.reasoning).toBe('b');
    });

    it('devuelve usage en chunks sin choices', () => {
        const chunk = service.parseLine('data: {"choices":[],"usage":{"prompt_tokens":3,"completion_tokens":4}}');
        expect(chunk?.usage?.prompt_tokens).toBe(3);
        expect(chunk?.usage?.completion_tokens).toBe(4);
    });

    it('ignora DONE, vacíos y eventos', () => {
        expect(service.parseLine('data: [DONE]')).toBeNull();
        expect(service.parseLine('')).toBeNull();
        expect(service.parseLine('event: message')).toBeNull();
        expect(service.parseLine(': keep-alive')).toBeNull();
    });

    it('convierte errores del stream en AppError', () => {
        const chunk = service.parseLine('data: {"error":{"message":"boom","code":429}}');
        expect(chunk?.error?.type).toBe('stream');
        expect(chunk?.error?.message).toContain('boom');
        expect(chunk?.error?.code).toBe(429);
    });

    it('tolera JSON inválido', () => {
        expect(service.parseLine('data: {roto')).toBeNull();
    });

    it('soporta finales de línea CRLF', () => {
        const chunk = service.parseLine('data: {"choices":[{"delta":{"content":"crlf"}}]}\r');
        expect(chunk?.content).toBe('crlf');
    });
});
