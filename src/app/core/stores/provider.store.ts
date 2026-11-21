// src/app/core/stores/provider.store.ts

import { Injectable, inject, signal } from '@angular/core';
import { ProviderConfig } from '../models';
import { CUSTOM_PROVIDER_ID, PROVIDER_PRESETS } from '../../constants/providers.constants';
import { SecretStoreService } from '../services/secret-store.service';
import { StorageService, STORAGE_KEYS } from '../services/storage.service';
import { ToastService } from '../services/toast.service';

function defaultProviders(): ProviderConfig[] {
    const list: ProviderConfig[] = PROVIDER_PRESETS.map(preset => ({
        id: preset.id,
        name: preset.name,
        apiUrl: preset.apiUrl,
        apiToken: ''
    }));
    list.push({ id: CUSTOM_PROVIDER_ID, name: 'Personalizado', apiUrl: '', apiToken: '', isCustom: true });
    return list;
}

function isProviders(data: unknown): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every(item => {
        const provider = item as Partial<ProviderConfig>;
        return typeof provider.id === 'string'
            && typeof provider.apiUrl === 'string'
            && typeof provider.apiToken === 'string';
    });
}

/** Agrega presets nuevos y actualiza URLs/nombres de presets existentes. */
function mergeWithPresets(saved: ProviderConfig[]): ProviderConfig[] {
    const byId = new Map(saved.map(p => [p.id, p]));
    return defaultProviders().map(base => {
        const existing = byId.get(base.id);
        if (!existing) return base;
        return base.isCustom
            ? { ...base, apiUrl: existing.apiUrl, apiToken: existing.apiToken }
            : { ...base, apiToken: existing.apiToken };
    });
}

@Injectable({ providedIn: 'root' })
export class ProviderStore {

    private storage = inject(StorageService);
    private secrets = inject(SecretStoreService);
    private toast = inject(ToastService);

    private readonly _providers = signal<ProviderConfig[]>([]);
    readonly providers = this._providers.asReadonly();
    readonly isLoaded = signal(false);

    private saveTimer: ReturnType<typeof setTimeout> | null = null;
    private saveGeneration = 0;

    constructor() {
        void this.load();
    }

    private async load(): Promise<void> {
        const saved = this.storage.load<ProviderConfig[]>(STORAGE_KEYS.providers, isProviders);
        if (!saved) {
            this._providers.set(defaultProviders());
            this.isLoaded.set(true);
            return;
        }

        const hydrated = await Promise.all(saved.map(async provider => ({
            ...provider,
            apiToken: provider.apiToken ? await this.secrets.decrypt(provider.apiToken) : ''
        })));
        this._providers.set(mergeWithPresets(hydrated));
        this.isLoaded.set(true);
    }

    updateProvider(id: string, partial: Partial<ProviderConfig>): void {
        this._providers.update(providers =>
            providers.map(provider => provider.id === id ? { ...provider, ...partial } : provider)
        );
        this.scheduleSave();
    }

    clearAllTokens(): void {
        this._providers.update(providers => providers.map(p => ({ ...p, apiToken: '' })));
        this.scheduleSave();
    }

    private scheduleSave(): void {
        if (this.saveTimer) clearTimeout(this.saveTimer);
        const generation = ++this.saveGeneration;
        this.saveTimer = setTimeout(() => {
            this.saveTimer = null;
            void this.save(generation);
        }, 600);
    }

    /** Cifra y persiste; la generación evita que un guardado viejo pise uno nuevo. */
    private async save(generation: number): Promise<void> {
        if (!this.secrets.canPersist() && this._providers().some(p => p.apiToken)) {
            this.toast.warning('Este navegador no permite cifrar: las keys quedan sólo en memoria hasta cerrar la pestaña.');
        }
        const snapshot = await Promise.all(this._providers().map(async provider => ({
            ...provider,
            apiToken: provider.apiToken ? await this.secrets.encrypt(provider.apiToken) : ''
        })));
        if (generation !== this.saveGeneration) return;
        this.storage.saveNow(STORAGE_KEYS.providers, snapshot);
    }
}
