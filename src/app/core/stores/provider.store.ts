// src/app/core/stores/provider.store.ts

import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { ProviderConfig } from '../../models/chat.models';
import { StorageService } from '../services/storage.service';
import { API_PRESETS } from '../../constants/models.constants';

@Injectable({ providedIn: 'root' })
export class ProviderStore {
    private storage = inject(StorageService);

    private _providers = signal<ProviderConfig[]>([]);
    private _isLoaded = signal(false);

    readonly providers = computed(() => this._providers());
    readonly isLoaded = computed(() => this._isLoaded());

    constructor() {
        this.load();
        effect(() => {
            if (this._isLoaded()) {
                this.storage.dispatchSaveProviders(this._providers());
            }
        });
    }

    private async load() {
        let loaded = await this.storage.loadProviders();
        
        if (loaded.length === 0) {
            loaded = Object.entries(API_PRESETS).map(([key, val]) => ({
                id: key,
                name: key.charAt(0).toUpperCase() + key.slice(1),
                apiUrl: val.apiUrl,
                apiToken: ''
            }));
        }
        
        if (!loaded.some(p => p.id === 'custom')) {
            loaded.push({ id: 'custom', name: 'Personalizado', apiUrl: '', apiToken: '' });
        }
        
        this._providers.set(loaded);
        this._isLoaded.set(true);
    }

    updateProvider(id: string, partial: Partial<ProviderConfig>) {
        this._providers.update(provs =>
            provs.map(p => p.id === id ? { ...p, ...partial } : p)
        );
    }
}
