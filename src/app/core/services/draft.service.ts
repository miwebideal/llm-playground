// src/app/core/services/draft.service.ts

import { Injectable, inject, signal } from '@angular/core';
import { StorageService, STORAGE_KEYS } from './storage.service';

function isDraft(data: unknown): boolean {
    return typeof data === 'string';
}

@Injectable({ providedIn: 'root' })
export class DraftService {

    private storage = inject(StorageService);

    readonly text = signal('');

    constructor() {
        this.text.set(this.storage.load<string>(STORAGE_KEYS.draft, isDraft) ?? '');
    }

    set(value: string): void {
        this.text.set(value);
        if (!value.trim()) {
            this.storage.remove(STORAGE_KEYS.draft);
            return;
        }
        this.storage.save(STORAGE_KEYS.draft, value, 400);
    }

    clear(): void {
        this.text.set('');
        this.storage.remove(STORAGE_KEYS.draft);
    }
}
