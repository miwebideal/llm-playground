// src/app/core/stores/global-config.store.ts

import { Injectable, signal, computed } from '@angular/core';
import { Subject, debounceTime } from 'rxjs';
import { GlobalConfig } from '../../models/chat.models';

const CONFIG_KEY = 'llm-global-config-v1';

const DEFAULT_CONFIG: GlobalConfig = {
    includeHistory: true,
    streamMode: false,
    isCompareMode: false,
};

@Injectable({ providedIn: 'root' })
export class GlobalConfigStore {
    private _state = signal<GlobalConfig>(DEFAULT_CONFIG);
    readonly state = computed(() => this._state());

    private save$ = new Subject<GlobalConfig>();

    constructor() {
        this.load();
        // Backup diferido: guarda 1 segundo después del último cambio
        this.save$.pipe(debounceTime(1000)).subscribe(data => {
            localStorage.setItem(CONFIG_KEY, JSON.stringify(data));
        });
    }

    private load() {
        try {
            const raw = localStorage.getItem(CONFIG_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                // Validación estricta: si no es un objeto válido, tira error y usa default
                if (typeof parsed !== 'object' || parsed === null || !('isCompareMode' in parsed)) {
                    throw new Error('Backup corrupto');
                }
                this._state.set({ ...DEFAULT_CONFIG, ...parsed });
            }
        } catch (e) {
            console.warn('Configuración corrupta o vacía. Restaurando defaults.');
            this._state.set(DEFAULT_CONFIG);
            localStorage.removeItem(CONFIG_KEY);
        }
    }

    update(partial: Partial<GlobalConfig>) {
        this._state.update(current => ({ ...current, ...partial }));
        this.save$.next(this._state()); // Dispara el backup diferido
    }
}
