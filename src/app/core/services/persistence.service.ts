// src/app/core/services/persistence.service.ts

import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Subscription, debounceTime } from 'rxjs';

export const STORAGE_KEYS = {
    config: 'llm-global-config',
    sessions: 'llm-sessions',
    providers: 'llm-providers',
    draft: 'llm-draft',
} as const;

@Injectable({ providedIn: 'root' })
export class PersistenceService implements OnDestroy {

    private writers = new Map<string, Subject<string>>();
    private subs: Subscription[] = [];

    // Lee JSON. Si está roto o validate da false, borra la key y devuelve null.
    load<T>(key: string, validate?: (data: unknown) => boolean): T | null {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return null;

            const parsed: unknown = JSON.parse(raw);
            if (validate && !validate(parsed)) {
                this.remove(key);
                return null;
            }
            return parsed as T;
        } catch {
            this.remove(key);
            return null;
        }
    }

    saveNow<T>(key: string, value: T): void {
        try {
            if (value === null || value === undefined) {
                localStorage.removeItem(key);
                return;
            }
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`[persistence] no se pudo guardar ${key}`, e);
        }
    }

    save<T>(key: string, value: T, debounceMs = 1000): void {
        let writer = this.writers.get(key);
        if (!writer) {
            writer = new Subject<string>();
            const sub = writer.pipe(debounceTime(debounceMs)).subscribe(raw => {
                try {
                    if (!raw) localStorage.removeItem(key);
                    else localStorage.setItem(key, raw);
                } catch (e) {
                    console.error(`[persistence] no se pudo guardar ${key}`, e);
                }
            });
            this.subs.push(sub);
            this.writers.set(key, writer);
        }

        if (value === null || value === undefined) {
            writer.next('');
            return;
        }
        writer.next(JSON.stringify(value));
    }

    remove(key: string): void {
        try {
            localStorage.removeItem(key);
        } catch {
            // ignore
        }
    }

    ngOnDestroy(): void {
        this.subs.forEach(s => s.unsubscribe());
        this.writers.clear();
    }
}