// src/tests/core/services/llm-api.service.spec.ts

import { TestBed } from '@angular/core/testing';
import { LlmApiService } from '../../../app/core/services/llm-api.service';
import { ModelRegistryService } from '../../../app/core/registry/model-registry.service';
import { ChatSession, GlobalConfig, createSession } from '../../../app/core/models';

const config = (partial: Partial<GlobalConfig> = {}): GlobalConfig => ({
    includeHistory: true,
    streamMode: false,
    isCompareMode: false,
    includeReasoningExport: true,
    activeSessionId: 'session-a',
    splitWidth: 50,
    ...partial
});

function session(partial: Partial<ChatSession> = {}): ChatSession {
    return { ...createSession('session-a', 'Modelo A'), ...partial };
}

describe('LlmApiService', () => {
    let service: LlmApiService;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [ModelRegistryService, LlmApiService] });
        service = TestBed.inject(LlmApiService);
    });

    it('usa max_completion_tokens y omite temperature en modelos GPT-5+', () => {
        const payload = service.buildPayload(
            session({ model: 'gpt-5.6-sol', temperature: 0.5, topP: 0.9, jsonMode: true }),
            config(),
            []
        );
        expect(payload.max_completion_tokens).toBe(8192);
        expect(payload.max_tokens).toBeUndefined();
        expect(payload.temperature).toBeUndefined();
        expect(payload.top_p).toBeUndefined();
        expect(payload.response_format).toBeUndefined();
    });

    it('usa max_tokens y parámetros en modelos clásicos', () => {
        const payload = service.buildPayload(
            session({ model: 'gpt-4o', temperature: 0.3, topP: 0.8, jsonMode: true }),
            config(),
            []
        );
        expect(payload.max_tokens).toBe(8192);
        expect(payload.max_completion_tokens).toBeUndefined();
        expect(payload.temperature).toBe(0.3);
        expect(payload.top_p).toBe(0.8);
        expect(payload.response_format).toEqual({ type: 'json_object' });
    });

    it('no envía parámetros si useParams es false', () => {
        const payload = service.buildPayload(session({ useParams: false }), config(), []);
        expect(payload.temperature).toBeUndefined();
        expect(payload.max_tokens).toBeUndefined();
        expect(payload.max_completion_tokens).toBeUndefined();
    });

    it('incluye stream_options en modo stream', () => {
        const payload = service.buildPayload(session(), config({ streamMode: true }), []);
        expect(payload.stream).toBe(true);
        expect(payload.stream_options).toEqual({ include_usage: true });
    });

    it('mapea 401 a auth no reintentable', async () => {
        const response = new Response(JSON.stringify({ error: { message: 'Invalid API key' } }), { status: 401 });
        const error = await service.toAppError(response);
        expect(error.type).toBe('auth');
        expect(error.retryable).toBe(false);
    });

    it('mapea 429 a rate_limit reintentable', async () => {
        const response = new Response(JSON.stringify({ error: { message: 'Rate limit exceeded' } }), { status: 429 });
        const error = await service.toAppError(response);
        expect(error.type).toBe('rate_limit');
        expect(error.retryable).toBe(true);
    });

    it('mapea 400 con max_tokens a invalid_params con hint', async () => {
        const response = new Response(JSON.stringify({ error: { message: 'Unrecognized argument: max_tokens' } }), { status: 400 });
        const error = await service.toAppError(response);
        expect(error.type).toBe('invalid_params');
        expect(error.hint).toBeTruthy();
    });

    it('extrae contenido OpenAI y Gemini', () => {
        expect(service.extractContent({ choices: [{ message: { content: 'hola' } }] })).toBe('hola');
        expect(service.extractContent({ candidates: [{ content: { parts: [{ text: 'chau' }] } }] })).toBe('chau');
        expect(service.extractContent(null)).toBe('');
    });

    it('extrae usage y finish_reason', () => {
        const data = {
            choices: [{ message: { content: 'x' }, finish_reason: 'length' }],
            usage: { prompt_tokens: 10, completion_tokens: 20 }
        };
        expect(service.extractUsage(data)).toEqual({ tokensIn: 10, tokensOut: 20 });
        expect(service.extractFinishReason(data)).toBe('length');
    });
});
