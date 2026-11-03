// src/tests/core/services/metrics.service.spec.ts

import { TestBed } from '@angular/core/testing';
import { MetricsService } from '../../../app/core/services/metrics.service';
import { ModelRegistryService } from '../../../app/core/registry/model-registry.service';
import { ChatSession, Message, createSession } from '../../../app/core/models';

function assistant(partial: Partial<Message>): Message {
    return {
        id: partial.id ?? 'm1',
        role: 'assistant',
        content: partial.content ?? 'ok',
        timestamp: new Date(),
        ...partial
    };
}

function session(partial: Partial<ChatSession> & { messages: Message[] }): ChatSession {
    return { ...createSession('session-a', 'Modelo A'), ...partial };
}

describe('MetricsService', () => {
    let service: MetricsService;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [ModelRegistryService, MetricsService] });
        service = TestBed.inject(MetricsService);
    });

    it('TPS = tokensOut / (total - ttft) en segundos', () => {
        expect(service.getTPS({ ttft: 1000, totalTime: 3000, tokensOut: 400 })).toBe(200);
        expect(service.formatTPS({ ttft: 1000, totalTime: 3000, tokensOut: 400 })).toBe('200.0');
    });

    it('TPS null si falta tiempo de generación', () => {
        expect(service.getTPS({ ttft: 1000, totalTime: 1000, tokensOut: 10 })).toBeNull();
        expect(service.getTPS(undefined)).toBeNull();
    });

    it('costo usa el precio del proveedor correcto', () => {
        const metrics = { tokensIn: 1_000_000, tokensOut: 1_000_000, ttft: 1, totalTime: 2 };
        expect(service.getCostValue(metrics, 'openai', 'gpt-4o-mini')).toBeCloseTo(0.75);
        expect(service.formatCost(metrics, 'openai', 'gpt-4o-mini')).toContain('$');
    });

    it('costo null cuando el proveedor no tiene ese modelo', () => {
        const metrics = { tokensIn: 100, tokensOut: 100 };
        expect(service.getCostValue(metrics, 'groq', 'gpt-4o-mini')).toBeNull();
        expect(service.getCostValue(metrics, 'openai', 'modelo-inexistente')).toBeNull();
    });

    it('costo con 0 tokens no se descarta', () => {
        expect(service.getCostValue({ tokensIn: 0, tokensOut: 0 }, 'openai', 'gpt-4o')).toBe(0);
    });

    it('lastValidAssistant ignora streaming y toma el último assistant', () => {
        const value = session({
            messages: [
                assistant({ id: '1', role: 'user', content: 'q' }),
                assistant({ id: '2', content: 'viejo' }),
                assistant({ id: '3', content: 'nuevo' }),
                assistant({ id: '4', content: '', isStreaming: true })
            ]
        });
        expect(service.lastValidAssistant(value)?.id).toBe('3');
    });

    it('winner: menor tiempo / menor costo / mayor tps', () => {
        const a = service.statsFor(session({
            id: 'session-a',
            name: 'A',
            messages: [assistant({
                metrics: { ttft: 200, totalTime: 2000, tokensIn: 100, tokensOut: 200 },
                model: 'gpt-4o-mini'
            })]
        }))!;
        const b = service.statsFor(session({
            id: 'session-b',
            name: 'B',
            messages: [assistant({
                metrics: { ttft: 80, totalTime: 800, tokensIn: 100, tokensOut: 400 },
                model: 'gpt-4o-mini'
            })]
        }))!;

        expect(service.winner(a, b, 'totalTime')).toBe('b');
        expect(service.winner(a, b, 'ttft')).toBe('b');
        expect(service.winner(a, b, 'tps')).toBe('b');
    });

    it('winner empate si los valores son iguales', () => {
        const stats = service.statsFor(session({
            messages: [assistant({ metrics: { ttft: 100, totalTime: 1000, tokensOut: 50 } })]
        }))!;
        expect(service.winner(stats, { ...stats, sessionId: 'x', name: 'B' }, 'totalTime')).toBe('tie');
    });
});
