// src/app/core/stores/global-config.store.ts

import { Injectable, signal, computed, effect } from '@angular/core';
import { GlobalConfig } from '../../models/chat.models';

const STORAGE_KEY = 'llm-global-config-v2';

const DEFAULT_CONFIG: GlobalConfig = {
    temperature: 0.7,
    maxTokens: 8192,
    systemPrompt: 'You are a helpful assistant.',
    useParams: true,
    includeHistory: true,
    streamMode: false,
    isCompareMode: false,
};

@Injectable({ providedIn: 'root' })
export class GlobalConfigStore {
    private _state = signal<GlobalConfig>(DEFAULT_CONFIG);
    private initialized = false;

    readonly state = computed(() => this._state());

    constructor() {
        this.load();
        effect(() => {
            if (this.initialized) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this._state()));
            }
        });
    }

    private load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                this._state.update(current => ({ ...current, ...JSON.parse(raw) }));
            }
        } catch (e) {
            console.error('Error cargando config global:', e);
        } finally {
            this.initialized = true;
        }
    }

    update(partial: Partial<GlobalConfig>) {
        this._state.update(current => ({ ...current, ...partial }));
    }

    resetParams() {
        this.update({
            temperature: 0.7,
            maxTokens: 8192,
            systemPrompt: 'You are a helpful assistant.',
            useParams: true,
        });
    }
}
