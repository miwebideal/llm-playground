// src/app/core/services/storage.service.ts

import { Injectable, inject, signal } from '@angular/core';
import { ToastService } from './toast.service';

export const STORAGE_KEYS = {
    config: 'llm-global-config',
    sessions: 'llm-sessions',
    providers: 'llm-providers',
    draft: 'llm-draft',
} as const;

const SCHEMA_VERSION = 1;

interface Envelope<T> {
    v: number;
    data: T;
}

function hasLocalStorage(): boolean {
    return typeof localStorage !== 'undefined';
}

@Injectable({ providedIn: 'root' })
export class StorageService {

    private toast = inject(ToastService);
    private timers = new Map<string, ReturnType<typeof setTimeout>>();
    readonly lastError = signal<string | null>(null);

    load<T>(key: string, validate?: (data: unknown) => boolean): T | null {
        if (!hasLocalStorage()) return null;
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            const parsed: unknown = JSON.parse(raw);
            const data = this.unwrap(parsed);
            if (validate && !validate(data)) {
                this.remove(key);
                this.report('Se descartaron datos corruptos guardados en este navegador.');
                return null;
            }
            return data as T;
        } catch {
            this.remove(key);
            this.report('No se pudieron leer datos guardados. Se reinició esa sección.');
            return null;
        }
    }

    saveNow<T>(key: string, value: T): void {
        this.cancelPending(key);
        this.write(key, value);
    }

    save<T>(key: string, value: T, debounceMs = 600): void {
        this.cancelPending(key);
        const timer = setTimeout(() => {
            this.timers.delete(key);
            this.write(key, value);
        }, debounceMs);
        this.timers.set(key, timer);
    }

    remove(key: string): void {
        this.cancelPending(key);
        if (!hasLocalStorage()) return;
        try {
            localStorage.removeItem(key);
        } catch {
            // ignore
        }
    }

    flush(): void {
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers.clear();
    }

    private write<T>(key: string, value: T): void {
        if (!hasLocalStorage()) return;
        try {
            const envelope: Envelope<T> = { v: SCHEMA_VERSION, data: value };
            localStorage.setItem(key, JSON.stringify(envelope));
        } catch (error) {
            const quota = error instanceof DOMException
                && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');
            this.report(quota
                ? 'No hay espacio para guardar. Exportá y borrá chats viejos.'
                : 'No se pudo guardar en este navegador.');
        }
    }

    private unwrap(parsed: unknown): unknown {
        if (parsed && typeof parsed === 'object' && 'v' in parsed && 'data' in parsed) {
            return (parsed as Envelope<unknown>).data;
        }
        return parsed; // formato legado sin envelope
    }

    private cancelPending(key: string): void {
        const timer = this.timers.get(key);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(key);
        }
    }

    private report(message: string): void {
        this.lastError.set(message);
        this.toast.error(message);
    }
}
