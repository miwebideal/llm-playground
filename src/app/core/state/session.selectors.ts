// src/app/core/state/session.selectors.ts

import { ChatSession, GlobalConfig, ProviderConfig } from '../models';

export interface SessionReadiness {
    ready: boolean;
    reason?: string;
}

export function sessionReadiness(session: ChatSession, providers: ProviderConfig[]): SessionReadiness {
    const provider = providers.find(p => p.id === session.providerId);
    if (!provider) return { ready: false, reason: 'Proveedor no encontrado' };
    if (!provider.apiUrl) return { ready: false, reason: 'Falta la API URL' };
    if (!provider.apiToken) return { ready: false, reason: 'Falta el API token' };
    if (!session.model) return { ready: false, reason: 'Falta seleccionar un modelo' };
    return { ready: true };
}

export function validSessions(sessions: ChatSession[], providers: ProviderConfig[]): ChatSession[] {
    return sessions.filter(s => sessionReadiness(s, providers).ready);
}

export function activeSessions(
    sessions: ChatSession[],
    config: GlobalConfig,
    providers: ProviderConfig[]
): ChatSession[] {
    if (!config.isCompareMode) return sessions.slice(0, 1);

    const valid = validSessions(sessions, providers);
    if (valid.length >= 2) return valid.slice(0, 2);
    if (valid.length === 1) return valid;
    return sessions.slice(0, 2);
}

export function activeSessionIds(
    sessions: ChatSession[],
    config: GlobalConfig,
    providers: ProviderConfig[]
): string[] {
    return activeSessions(sessions, config, providers).map(s => s.id);
}
