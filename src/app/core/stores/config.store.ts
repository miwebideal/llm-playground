// src/app/core/stores/config.store.ts

import { Injectable, inject, signal } from '@angular/core';
import { DEFAULT_CONFIG, GlobalConfig } from '../models';
import { StorageService, STORAGE_KEYS } from '../services/storage.service';

function isConfig(data: unknown): boolean {
    if (!data || typeof data !== 'object') return false;
    const value = data as Partial<GlobalConfig>;
    return typeof value.includeHistory === 'boolean'
        && typeof value.streamMode === 'boolean'
        && typeof value.isCompareMode === 'boolean';
}

@Injectable({ providedIn: 'root' })
export class ConfigStore {

    private storage = inject(StorageService);

    private readonly _state = signal<GlobalConfig>({ ...DEFAULT_CONFIG });
    readonly state = this._state.asReadonly();

    constructor() {
        const saved = this.storage.load<GlobalConfig>(STORAGE_KEYS.config, isConfig);
        const merged = { ...DEFAULT_CONFIG, ...(saved ?? {}) };
        this._state.set({
            includeHistory: merged.includeHistory,
            streamMode: merged.streamMode,
            isCompareMode: merged.isCompareMode,
            includeReasoningExport: merged.includeReasoningExport,
            activeSessionId: merged.activeSessionId,
            splitWidth: merged.splitWidth
        });
    }

    update<K extends keyof GlobalConfig>(key: K, value: GlobalConfig[K]): void {
        this._state.update(current => ({ ...current, [key]: value } as GlobalConfig));
        this.persist();
    }

    patch(partial: Partial<GlobalConfig>): void {
        this._state.update(current => ({ ...current, ...partial }));
        this.persist();
    }

    private persist(): void {
        this.storage.save(STORAGE_KEYS.config, this._state());
    }
}
