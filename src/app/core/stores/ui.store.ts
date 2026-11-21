// src/app/core/stores/ui.store.ts

import { Injectable, inject, signal } from '@angular/core';
import { StorageService, STORAGE_KEYS } from '../services/storage.service';

export interface UiState {
    /** Rail lateral fijado abierto (si no, se expande al pasar el mouse). */
    railPinned: boolean;
    /** Panel de ajustes del playground abierto. */
    drawerOpen: boolean;
    /** En modo dividido, cambiar parámetros afecta a ambas columnas. */
    syncParams: boolean;
}

const DEFAULT_UI: UiState = { railPinned: false, drawerOpen: false, syncParams: true };

@Injectable({ providedIn: 'root' })
export class UiStore {

    private storage = inject(StorageService);
    private readonly _state = signal<UiState>({
        ...DEFAULT_UI,
        ...(this.storage.load<Partial<UiState>>(STORAGE_KEYS.ui, data => !!data && typeof data === 'object') ?? {}),
        drawerOpen: false // siempre arranca cerrado: el chat es lo primero
    });
    readonly state = this._state.asReadonly();

    set<K extends keyof UiState>(key: K, value: UiState[K]): void {
        this._state.update(current => ({ ...current, [key]: value }));
        this.storage.save(STORAGE_KEYS.ui, this._state(), 200);
    }

    toggle(key: 'railPinned' | 'drawerOpen' | 'syncParams'): void {
        this.set(key, !this._state()[key]);
    }
}
