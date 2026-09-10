// src/app/core/stores/provider.store.ts

import { Injectable, signal, computed, inject } from '@angular/core';
import { ProviderConfig } from '../../models/chat.models';
import { API_PRESETS } from '../../constants/models.constants';
import { encrypt, decrypt } from '../../utils/crypto.utils';
import { PersistenceService, STORAGE_KEYS } from '../services/persistence.service';

function defaultProviders(): ProviderConfig[] {
    const list = Object.entries(API_PRESETS).map(([key, val]) => ({
        id: key,
        name: key.charAt(0).toUpperCase() + key.slice(1),
        apiUrl: val.apiUrl,
        apiToken: ''
    }));
    list.push({ id: 'custom', name: 'Personalizado', apiUrl: '', apiToken: '' });
    return list;
}

function isProviders(data: unknown): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every((item) => {
        const p = item as Partial<ProviderConfig>;
        return typeof p.id === 'string'
            && typeof p.apiUrl === 'string'
            && typeof p.apiToken === 'string';
    });
}

@Injectable({ providedIn: 'root' })
export class ProviderStore {

    private persist = inject(PersistenceService);

    private _providers = signal<ProviderConfig[]>([]);
    readonly providers = computed(() => this._providers());
    readonly isLoaded = signal(false);

    private saveGen = 0;

    constructor() {
        void this.load();
    }

    private async load() {
        const saved = this.persist.load<ProviderConfig[]>(STORAGE_KEYS.providers, isProviders);
        if (!saved) {
            this._providers.set(defaultProviders());
            this.isLoaded.set(true);
            return;
        }

        for (const p of saved) {
            if (p.apiToken) p.apiToken = await decrypt(p.apiToken);
        }
        this._providers.set(saved);
        this.isLoaded.set(true);
    }

    private async queueSave() {
        const gen = ++this.saveGen;
        const snapshot = this._providers().map(p => ({ ...p }));

        try {
            for (const p of snapshot) {
                if (p.apiToken) p.apiToken = await encrypt(p.apiToken);
            }
            if (gen !== this.saveGen) return;
            this.persist.save(STORAGE_KEYS.providers, snapshot);
        } catch (e) {
            console.error('[providers] no se pudo guardar', e);
        }
    }

    updateProvider(id: string, partial: Partial<ProviderConfig>) {
        this._providers.update(provs =>
            provs.map(p => p.id === id ? { ...p, ...partial } : p)
        );
        void this.queueSave();
    }
}