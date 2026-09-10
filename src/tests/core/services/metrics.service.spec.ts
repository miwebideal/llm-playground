// src/tests/core/services/metrics.service.spec.ts

import { TestBed } from '@angular/core/testing';
import { MetricsService } from '../../../app/core/services/metrics.service';
import { ChatSession, Message } from '../../../app/models/chat.models';

function msg(partial: Partial<Message>): Message {
    return {
        id: partial.id ?? 'm1',
        role: partial.role ?? 'assistant',
        content: partial.content ?? 'ok',
        timestamp: new Date(),
        ...partial
    };
}

function session(partial: Partial<ChatSession> & { messages: Message[] }): ChatSession {
    return {
        id: 'session-a',
        name: 'Modelo A',
        providerId: 'openai',
        model: 'gpt-4o-mini',
        useParams: true,
        temperature: 0.7,
        topP: 1,
        maxTokens: 8192,
        jsonMode: false,
        systemPrompt: '',
        ...partial
    };
}

describe('MetricsService', () => {
    let svc: MetricsService;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [MetricsService] });
        svc = TestBed.inject(MetricsService);
    });

    it('TPS = tokensOut / (total - ttft) en segundos', () => {
        expect(svc.getTPS({ ttft: 1000, totalTime: 3000, tokensOut: 400 })).toBe(200);
        expect(svc.formatTPS({ ttft: 1000, totalTime: 3000, tokensOut: 400 })).toBe('200.0');
    });

    it('TPS null si falta tiempo de generación', () => {
        expect(svc.getTPS({ ttft: 1000, totalTime: 1000, tokensOut: 10 })).toBeNull();
        expect(svc.getTPS(undefined)).toBeNull();
    });

    it('costo usa MODEL_PRICING y formatea', () => {
        const metrics = { tokensIn: 1_000_000, tokensOut: 1_000_000, ttft: 1, totalTime: 2 };
        const cost = svc.getCostValue(metrics, 'gpt-4o-mini');
        expect(cost).not.toBeNull();
        expect(svc.formatCost(metrics, 'gpt-4o-mini')).toContain('$');
        expect(svc.getCostValue(metrics, 'modelo-que-no-existe')).toBeNull();
    });

    it('lastValidAssistant ignora streaming y toma el último assistant', () => {
        const s = session({
            messages: [
                msg({ id: '1', role: 'user', content: 'q' }),
                msg({ id: '2', role: 'assistant', content: 'viejo' }),
                msg({ id: '3', role: 'assistant', content: 'nuevo' }),
                msg({ id: '4', role: 'assistant', content: '', isStreaming: true })
            ]
        });
        expect(svc.lastValidAssistant(s)?.id).toBe('3');
    });

    it('winner: menor tiempo / menor costo / mayor tps', () => {
        const a = svc.statsFor(session({
            id: 'session-a',
            name: 'A',
            messages: [msg({
                metrics: { ttft: 200, totalTime: 2000, tokensIn: 100, tokensOut: 200 },
                model: 'gpt-4o-mini'
            })]
        }))!;
        const b = svc.statsFor(session({
            id: 'session-b',
            name: 'B',
            model: 'gpt-4o-mini',
            messages: [msg({
                metrics: { ttft: 80, totalTime: 800, tokensIn: 100, tokensOut: 400 },
                model: 'gpt-4o-mini'
            })]
        }))!;

        expect(svc.winner(a, b, 'totalTime')).toBe('b');
        expect(svc.winner(a, b, 'ttft')).toBe('b');
        expect(svc.winner(a, b, 'tps')).toBe('b');
    });

    it('winner empate si los valores son iguales', () => {
        const stats = svc.statsFor(session({
            messages: [msg({ metrics: { ttft: 100, totalTime: 1000, tokensOut: 50 } })]
        }))!;
        expect(svc.winner(stats, { ...stats, sessionId: 'x', name: 'B' }, 'totalTime')).toBe('tie');
    });
});