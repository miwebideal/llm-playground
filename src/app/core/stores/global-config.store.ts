// src/app/core/stores/global-config.store.ts

import { Injectable, signal, computed, inject } from '@angular/core';
import { GlobalConfig } from '../../models/chat.models';
import { PersistenceService, STORAGE_KEYS } from '../services/persistence.service';

const DEFAULT_CONFIG: GlobalConfig = {
    includeHistory: true,
    streamMode: false,
    isCompareMode: false,
};

function isConfig(data: unknown): boolean {
    if (!data || typeof data !== 'object') return false;
    const o = data as Partial<GlobalConfig>;
    return typeof o.includeHistory === 'boolean'
        && typeof o.streamMode === 'boolean'
        && typeof o.isCompareMode === 'boolean';
}

@Injectable({ providedIn: 'root' })
export class GlobalConfigStore {

    private persist = inject(PersistenceService);

    private _state = signal<GlobalConfig>(DEFAULT_CONFIG);
    readonly state = computed(() => this._state());

    constructor() {
        const saved = this.persist.load<GlobalConfig>(STORAGE_KEYS.config, isConfig);
        this._state.set(saved ?? DEFAULT_CONFIG);
    }

    update(partial: Partial<GlobalConfig>) {
        this._state.update(current => ({ ...current, ...partial }));
        this.persist.save(STORAGE_KEYS.config, this._state());
    }
}