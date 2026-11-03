// src/tests/core/services/llm-orchestrator.service.spec.ts

import { Signal, WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { LlmOrchestratorService } from '../../../app/core/services/llm-orchestrator.service';
import { LlmApiService } from '../../../app/core/services/llm-api.service';
import { MessageBuilderService } from '../../../app/core/services/message-builder.service';
import { StreamReaderService } from '../../../app/core/services/stream-reader.service';
import { StreamChunk } from '../../../app/core/services/stream-parser.service';
import { ToastService } from '../../../app/core/services/toast.service';
import { ConfigStore } from '../../../app/core/stores/config.store';
import { ProviderStore } from '../../../app/core/stores/provider.store';
import { SessionStore } from '../../../app/core/stores/session.store';
import {
    AppError,
    ChatSession,
    GlobalConfig,
    Message,
    ProviderConfig,
    createSession
} from '../../../app/core/models';

class FakeSessionStore {
    private readonly _sessions: WritableSignal<ChatSession[]>;
    readonly sessions: Signal<ChatSession[]>;

    constructor(sessions: ChatSession[]) {
        this._sessions = signal(sessions);
        this.sessions = this._sessions.asReadonly();
    }

    addMessage(sessionId: string, message: Message): void {
        this._sessions.update(all => all.map(session => session.id === sessionId
            ? { ...session, messages: [...session.messages, message] }
            : session));
    }

    updateMessage(sessionId: string, messageId: string, updater: (message: Message) => Message): void {
        this._sessions.update(all => all.map(session => session.id === sessionId
            ? { ...session, messages: session.messages.map(m => m.id === messageId ? updater(m) : m) }
            : session));
    }

    truncateMessagesFrom(sessionId: string, index: number): void {
        this._sessions.update(all => all.map(session => session.id === sessionId
            ? { ...session, messages: session.messages.slice(0, index + 1) }
            : session));
    }

    updateSession(id: string, partial: Partial<ChatSession>): void {
        this._sessions.update(all => all.map(session => session.id === id ? { ...session, ...partial } : session));
    }
}

const PROVIDERS: ProviderConfig[] = [
    { id: 'openai', name: 'OpenAI', apiUrl: 'https://api.test', apiToken: 'sk-test' }
];

const CONFIG: GlobalConfig = {
    includeHistory: true,
    streamMode: true,
    isCompareMode: false,
    includeReasoningExport: true,
    activeSessionId: 'session-a',
    splitWidth: 50
};

function readySession(id: string, partial: Partial<ChatSession> = {}): ChatSession {
    return { ...createSession(id, id), model: 'gpt-4o', ...partial };
}

interface Harness {
    orchestrator: LlmOrchestratorService;
    store: FakeSessionStore;
    api: {
        send: ReturnType<typeof vi.fn>;
        abort: ReturnType<typeof vi.fn>;
        abortAll: ReturnType<typeof vi.fn>;
        release: ReturnType<typeof vi.fn>;
        signalFor: ReturnType<typeof vi.fn>;
        toAppError: ReturnType<typeof vi.fn>;
        extractContent: (data: unknown) => string;
        extractUsage: (data: unknown) => { tokensIn?: number; tokensOut?: number };
        extractFinishReason: (data: unknown) => string | undefined;
        usageFromChunk: (chunk: { usage?: { prompt_tokens?: number; completion_tokens?: number } }) => {
            tokensIn?: number; tokensOut?: number
        };
    };
    reader: { readStream: ReturnType<typeof vi.fn> };
    builder: { build: ReturnType<typeof vi.fn> };
    toast: { error: ReturnType<typeof vi.fn>; warning: ReturnType<typeof vi.fn> };
}

function setup(sessions: ChatSession[], config: Partial<GlobalConfig> = {}): Harness {
    const store = new FakeSessionStore(sessions);
    const api = {
        send: vi.fn().mockResolvedValue(new Response('', { status: 200 })),
        abort: vi.fn(),
        abortAll: vi.fn(),
        release: vi.fn(),
        signalFor: vi.fn().mockReturnValue(undefined),
        toAppError: vi.fn(),
        extractContent: (data: unknown) => {
            const value = data as { choices?: Array<{ message?: { content?: string } }> };
            return value.choices?.[0]?.message?.content ?? '';
        },
        extractUsage: (data: unknown) => {
            const value = data as { usage?: { prompt_tokens?: number; completion_tokens?: number } };
            return { tokensIn: value.usage?.prompt_tokens, tokensOut: value.usage?.completion_tokens };
        },
        extractFinishReason: (data: unknown) => {
            const value = data as { choices?: Array<{ finish_reason?: string }> };
            return value.choices?.[0]?.finish_reason;
        },
        usageFromChunk: (chunk: { usage?: { prompt_tokens?: number; completion_tokens?: number } }) => ({
            tokensIn: chunk.usage?.prompt_tokens,
            tokensOut: chunk.usage?.completion_tokens
        })
    };
    const reader = { readStream: vi.fn() };
    const builder = { build: vi.fn((content: string) => [{ role: 'user', content }]) };
    const toast = { error: vi.fn(), warning: vi.fn() };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
        providers: [
            LlmOrchestratorService,
            { provide: SessionStore, useValue: store },
            { provide: ProviderStore, useValue: { providers: signal(PROVIDERS).asReadonly() } },
            { provide: ConfigStore, useValue: { state: signal({ ...CONFIG, ...config }).asReadonly() } },
            { provide: LlmApiService, useValue: api },
            { provide: MessageBuilderService, useValue: builder },
            { provide: StreamReaderService, useValue: reader },
            { provide: ToastService, useValue: toast }
        ]
    });

    return {
        orchestrator: TestBed.inject(LlmOrchestratorService),
        store,
        api,
        reader,
        builder,
        toast
    };
}

function sessionMessages(store: FakeSessionStore, sessionId: string): Message[] {
    return store.sessions().find(session => session.id === sessionId)?.messages ?? [];
}

describe('LlmOrchestratorService', () => {
    afterEach(() => TestBed.resetTestingModule());

    it('envía sólo a sesiones configuradas y no aborta el resto', async () => {
        const harness = setup([readySession('session-a'), readySession('session-b', { model: '' })], { isCompareMode: true });
        harness.reader.readStream.mockImplementation(async (_response: Response, options: { onChunk: (chunk: StreamChunk) => void }) => {
            options.onChunk({ content: 'hola', reasoning: '' });
            options.onChunk({ content: ' mundo', reasoning: '', finishReason: 'stop' });
        });

        const queued = await harness.orchestrator.sendMessage('prompt');

        expect(queued).toBe(true);
        expect(sessionMessages(harness.store, 'session-b')).toHaveLength(0);
        const messages = sessionMessages(harness.store, 'session-a');
        expect(messages).toHaveLength(2);
        expect(messages[1].content).toBe('hola mundo');
        expect(messages[1].isStreaming).toBe(false);
        expect(messages[1].finishReason).toBe('stop');
    });

    it('no duplica el mensaje del usuario en el historial enviado', async () => {
        const harness = setup([readySession('session-a')]);
        harness.reader.readStream.mockResolvedValue(undefined);

        await harness.orchestrator.sendMessage('prompt');
        const userMessage = sessionMessages(harness.store, 'session-a')[0];
        const history = harness.builder.build.mock.calls[0][3] as Message[];
        expect(history.some(message => message.id === userMessage.id)).toBe(false);
    });

    it('guarda error tipado sin contaminar el contenido', async () => {
        const error: AppError = { type: 'auth', message: 'API key inválida', retryable: false };
        const harness = setup([readySession('session-a')]);
        harness.api.send.mockResolvedValue(new Response('', { status: 401 }));
        harness.api.toAppError.mockResolvedValue(error);

        await harness.orchestrator.sendMessage('prompt');

        const assistant = sessionMessages(harness.store, 'session-a')[1];
        expect(assistant.error?.type).toBe('auth');
        expect(assistant.content).toBe('');
        expect(assistant.finishReason).toBe('error');
        expect(harness.toast.error).toHaveBeenCalledWith('API key inválida');
    });

    it('al detener conserva lo recibido, marca stopped y estima tokens', async () => {
        const harness = setup([readySession('session-a')]);
        harness.reader.readStream.mockImplementation(async (_response: Response, options: { onChunk: (chunk: StreamChunk) => void }) => {
            options.onChunk({ content: 'parcial', reasoning: '' });
            throw { type: 'aborted', message: 'detenido', retryable: true } satisfies AppError;
        });

        await harness.orchestrator.sendMessage('prompt');

        const assistant = sessionMessages(harness.store, 'session-a')[1];
        expect(assistant.content).toBe('parcial');
        expect(assistant.finishReason).toBe('stopped');
        expect(assistant.isStreaming).toBe(false);
        expect(assistant.metrics?.estimated).toBe(true);
        expect(assistant.metrics?.tokensOut).toBeGreaterThan(0);
    });

    it('en modo no-stream usa el cuerpo completo y su usage', async () => {
        const harness = setup([readySession('session-a')], { streamMode: false });
        harness.api.send.mockResolvedValue(new Response(JSON.stringify({
            choices: [{ message: { content: 'respuesta completa' }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 7, completion_tokens: 9 }
        }), { status: 200 }));

        await harness.orchestrator.sendMessage('prompt');

        const assistant = sessionMessages(harness.store, 'session-a')[1];
        expect(assistant.content).toBe('respuesta completa');
        expect(assistant.metrics?.tokensIn).toBe(7);
        expect(assistant.metrics?.tokensOut).toBe(9);
        expect(assistant.isStreaming).toBe(false);
    });

    it('stopGenerating aborta las sesiones activas', () => {
        const harness = setup([readySession('session-a')], { isCompareMode: true });
        harness.orchestrator.stopGenerating();
        expect(harness.api.abort).toHaveBeenCalledWith('session-a');
    });

    it('retry reemplaza el mensaje fallido sin duplicar el usuario', async () => {
        const userMessage: Message = { id: 'u1', role: 'user', content: 'prompt', timestamp: new Date() };
        const failed: Message = {
            id: 'a1',
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            finishReason: 'error',
            error: { type: 'server', message: 'boom', retryable: true }
        };
        const harness = setup([readySession('session-a', { messages: [userMessage, failed] })]);
        harness.reader.readStream.mockImplementation(async (_response: Response, options: { onChunk: (chunk: StreamChunk) => void }) => {
            options.onChunk({ content: 'ok', reasoning: '', finishReason: 'stop' });
        });

        await harness.orchestrator.retry('session-a', 'a1');

        const messages = sessionMessages(harness.store, 'session-a');
        expect(messages.map(message => message.role)).toEqual(['user', 'assistant']);
        expect(messages[0].id).toBe('u1');
        expect(messages[1].content).toBe('ok');
    });
});
