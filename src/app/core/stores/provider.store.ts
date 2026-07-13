// src/app/core/stores/provider.store.ts

import { Injectable, signal, computed } from '@angular/core';
import { Subject, debounceTime, switchMap, from } from 'rxjs';
import { ProviderConfig } from '../../models/chat.models';
import { API_PRESETS } from '../../constants/models.constants';
import { encrypt, decrypt } from '../../utils/crypto.utils';

const PROVIDERS_KEY = 'llm-providers-v1';

@Injectable({ providedIn: 'root' })
export class ProviderStore {

    private _providers = signal<ProviderConfig[]>([]);
    readonly providers = computed(() => this._providers());
    readonly isLoaded = signal(false);

    private save$ = new Subject<ProviderConfig[]>();

    constructor() {
        this.load();
        // Backup diferido: espera 1 seg, encripta y guarda
        this.save$.pipe(
            debounceTime(1000),
            switchMap(data => from(this.performSave(data)))
        ).subscribe();
    }

    private async load() {
        try {
            const raw = localStorage.getItem(PROVIDERS_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                // Validación estricta
                if (!Array.isArray(parsed) || (parsed.length > 0 && !parsed[0].id)) {
                    throw new Error('Backup corrupto');
                }
                for (const p of parsed) {
                    if (p.apiToken) p.apiToken = await decrypt(p.apiToken);
                }
                this._providers.set(parsed);
            } else {
                throw new Error('No hay backup');
            }
        } catch (e) {
            console.warn('Proveedores corruptos o vacíos. Restaurando defaults.');
            const defaults = Object.entries(API_PRESETS).map(([key, val]) => ({
                id: key, name: key.charAt(0).toUpperCase() + key.slice(1), apiUrl: val.apiUrl, apiToken: ''
            }));
            defaults.push({ id: 'custom', name: 'Personalizado', apiUrl: '', apiToken: '' });
            this._providers.set(defaults);
            localStorage.removeItem(PROVIDERS_KEY);
        }
        this.isLoaded.set(true);
    }

    private async performSave(data: ProviderConfig[]) {
        try {
            const toStore = JSON.parse(JSON.stringify(data));
            for (const p of toStore) {
                if (p.apiToken) p.apiToken = await encrypt(p.apiToken);
            }
            localStorage.setItem(PROVIDERS_KEY, JSON.stringify(toStore));
        } catch (e) {
            console.error('Error en backup de proveedores', e);
        }
    }

    updateProvider(id: string, partial: Partial<ProviderConfig>) {
        this._providers.update(provs => provs.map(p => p.id === id ? { ...p, ...partial } : p));
        this.save$.next(this._providers());
    }

}
