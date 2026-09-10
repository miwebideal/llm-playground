// src/app/core/services/draft.service.ts

import { Injectable, inject, signal } from '@angular/core';
import { PersistenceService, STORAGE_KEYS } from './persistence.service';

function isDraft(data: unknown): boolean {
    return typeof data === 'string';
}

@Injectable({ providedIn: 'root' })
export class DraftService {

    private persist = inject(PersistenceService);

    readonly text = signal('');

    constructor() {
        const saved = this.persist.load<string>(STORAGE_KEYS.draft, isDraft);
        this.text.set(saved ?? '');
    }

    set(value: string): void {
        this.text.set(value);
        if (!value.trim()) {
            this.persist.remove(STORAGE_KEYS.draft);
            return;
        }
        this.persist.save(STORAGE_KEYS.draft, value, 400);
    }

    clear(): void {
        this.text.set('');
        this.persist.remove(STORAGE_KEYS.draft);
    }
}