// src/tests/core/state/session.selectors.spec.ts

import { ChatSession, GlobalConfig, ProviderConfig, createSession } from '../../../app/core/models';
import { activeSessions, sessionReadiness, validSessions } from '../../../app/core/state/session.selectors';

const config = (partial: Partial<GlobalConfig> = {}): GlobalConfig => ({
    includeHistory: true,
    streamMode: false,
    isCompareMode: false,
    includeReasoningExport: true,
    activeSessionId: 'session-a',
    splitWidth: 50,
    ...partial
});

const providers: ProviderConfig[] = [
    { id: 'openai', name: 'OpenAI', apiUrl: 'https://api.openai.com/v1', apiToken: 'sk-test' }
];

function session(id: string, partial: Partial<ChatSession> = {}): ChatSession {
    return { ...createSession(id, id), ...partial };
}

describe('session selectors', () => {
    it('single mode devuelve sólo la primera', () => {
        const sessions = [session('a'), session('b')];
        expect(activeSessions(sessions, config(), providers).map(s => s.id)).toEqual(['a']);
    });

    it('compare muestra las dos válidas', () => {
        const sessions = [session('a'), session('b')];
        expect(activeSessions(sessions, config({ isCompareMode: true }), providers).map(s => s.id)).toEqual(['a', 'b']);
    });

    it('compare con una sola válida devuelve esa (no fuerza A)', () => {
        const sessions = [
            session('a', { model: '' }),
            session('b', { model: 'gpt-4o' })
        ];
        expect(activeSessions(sessions, config({ isCompareMode: true }), providers).map(s => s.id)).toEqual(['b']);
    });

    it('compare sin válidas devuelve las dos candidatas para configurar', () => {
        const sessions = [session('a', { model: '' }), session('b', { model: '' })];
        expect(activeSessions(sessions, config({ isCompareMode: true }), providers).map(s => s.id)).toEqual(['a', 'b']);
    });

    it('readiness explica qué falta', () => {
        expect(sessionReadiness(session('a', { model: '' }), providers).reason).toContain('modelo');
        expect(sessionReadiness(session('a'), []).reason).toContain('Proveedor');
        expect(sessionReadiness(session('a'), providers).ready).toBe(true);
    });

    it('validSessions filtra por configuración completa', () => {
        const sessions = [session('a'), session('b', { model: '' })];
        expect(validSessions(sessions, providers).map(s => s.id)).toEqual(['a']);
    });
});
