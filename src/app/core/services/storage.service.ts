// src/app/core/services/storage.service.ts

import { Injectable } from '@angular/core';
import { Subject, concatMap, debounceTime, from } from 'rxjs';
import { ChatSession, ProviderConfig } from '../../models/chat.models';
import { encrypt, decrypt } from '../../utils/crypto.utils';

const SESSIONS_KEY = 'llm-sessions-v3';
const PROVIDERS_KEY = 'llm-providers-v3';

@Injectable({ providedIn: 'root' })
export class StorageService {

    // Subjects para encolar los guardados
    private saveSessions$ = new Subject<ChatSession[]>();
    private saveProviders$ = new Subject<ProviderConfig[]>();

    constructor() {
        // Pipeline reactivo para Sesiones: Espera 500ms sin cambios, luego guarda en orden
        this.saveSessions$.pipe(
            debounceTime(500),
            concatMap(sessions => from(this.performSaveSessions(sessions)))
        ).subscribe();

        // Pipeline reactivo para Proveedores: Igual, pero encriptando tokens
        this.saveProviders$.pipe(
            debounceTime(500),
            concatMap(providers => from(this.performSaveProviders(providers)))
        ).subscribe();
    }

    // --- MÉTODOS PÚBLICOS PARA ENCOLAR GUARDADOS ---

    dispatchSaveSessions(sessions: ChatSession[]) {
        // Clonamos para evitar mutaciones por referencia
        this.saveSessions$.next(JSON.parse(JSON.stringify(sessions)));
    }

    dispatchSaveProviders(providers: ProviderConfig[]) {
        this.saveProviders$.next(JSON.parse(JSON.stringify(providers)));
    }

    async loadSessions(): Promise<ChatSession[]> {
        try {
            const raw = localStorage.getItem(SESSIONS_KEY);
            if (!raw) return [];
            const parsed: ChatSession[] = JSON.parse(raw);
            // Restaurar objetos Date y asegurar parámetros por defecto
            return parsed.map(s => ({
                ...s,
                useParams: s.useParams ?? true,
                temperature: s.temperature ?? 0.7,
                maxTokens: s.maxTokens ?? 8192,
                systemPrompt: s.systemPrompt ?? 'You are a helpful assistant.',
                messages: s.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) }))
            }));
        } catch (e) {
            console.error('Error cargando sesiones:', e);
            return [];
        }
    }

    async loadProviders(): Promise<ProviderConfig[]> {
        try {
            const raw = localStorage.getItem(PROVIDERS_KEY);
            if (!raw) return [];
            const parsed: ProviderConfig[] = JSON.parse(raw);
            // Desencriptar tokens
            for (const p of parsed) {
                if (p.apiToken) p.apiToken = await decrypt(p.apiToken);
            }
            return parsed;
        } catch (e) {
            console.error('Error cargando proveedores:', e);
            return [];
        }
    }

    // --- LÓGICA INTERNA DE GUARDADO (Ejecutada por RxJS) ---

    private async performSaveSessions(sessions: ChatSession[]) {
        try {
            localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
        } catch (e) {
            console.error('Error en performSaveSessions:', e);
        }
    }

    private async performSaveProviders(providers: ProviderConfig[]) {
        try {
            for (const p of providers) {
                if (p.apiToken) p.apiToken = await encrypt(p.apiToken);
            }
            localStorage.setItem(PROVIDERS_KEY, JSON.stringify(providers));
        } catch (e) {
            console.error('Error en performSaveProviders:', e);
        }
    }
}
