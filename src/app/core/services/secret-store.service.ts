// src/app/core/services/secret-store.service.ts

import { Injectable } from '@angular/core';

const DB_NAME = 'llm-playground-secrets';
const DB_VERSION = 1;
const KEY_STORE = 'keys';
const KEY_ID = 'provider-tokens';
const IV_BYTES = 12;

@Injectable({ providedIn: 'root' })
export class SecretStoreService {

    private keyPromise: Promise<CryptoKey> | null = null;

    async encrypt(text: string): Promise<string> {
        if (!text) return '';
        if (!this.available()) return btoa(text);
        const key = await this.getKey();
        const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
        const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text));
        return this.pack(iv, new Uint8Array(encrypted));
    }

    async decrypt(payload: string): Promise<string> {
        if (!payload) return '';
        if (!this.available()) {
            try { return atob(payload); } catch { return ''; }
        }
        const parsed = this.unpack(payload);
        if (!parsed) return '';

        try {
            const key = await this.getKey();
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: parsed.iv },
                key,
                parsed.data
            );
            return new TextDecoder().decode(decrypted);
        } catch {
            return '';
        }
    }

    private getKey(): Promise<CryptoKey> {
        if (!this.keyPromise) this.keyPromise = this.loadOrCreateKey();
        return this.keyPromise;
    }

    private async loadOrCreateKey(): Promise<CryptoKey> {
        const existing = await this.readKey();
        if (existing) return existing;
        const key = await crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        ) as CryptoKey;
        await this.writeKey(key);
        return key;
    }

    private available(): boolean {
        return typeof crypto !== 'undefined' && !!crypto.subtle;
    }

    private pack(iv: Uint8Array, data: Uint8Array): string {
        const combined = new Uint8Array(iv.length + data.length);
        combined.set(iv);
        combined.set(data, iv.length);
        let binary = '';
        for (const byte of combined) binary += String.fromCharCode(byte);
        return btoa(binary);
    }

    private unpack(payload: string): { iv: Uint8Array<ArrayBuffer>; data: Uint8Array<ArrayBuffer> } | null {
        try {
            const raw = Uint8Array.from(atob(payload), c => c.charCodeAt(0));
            if (raw.length <= IV_BYTES) return null;

            const buffer = new ArrayBuffer(raw.length);
            new Uint8Array(buffer).set(raw);

            const iv = new Uint8Array(buffer.slice(0, IV_BYTES));
            const data = new Uint8Array(buffer.slice(IV_BYTES));
            return { iv, data };
        } catch {
            return null;
        }
    }

    private openDb(): Promise<IDBDatabase | null> {
        if (typeof indexedDB === 'undefined') return Promise.resolve(null);
        return new Promise(resolve => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = () => request.result.createObjectStore(KEY_STORE);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(null);
        });
    }

    private async readKey(): Promise<CryptoKey | null> {
        const db = await this.openDb();
        if (!db) return null;
        return new Promise(resolve => {
            const tx = db.transaction(KEY_STORE, 'readonly');
            const request = tx.objectStore(KEY_STORE).get(KEY_ID);
            request.onsuccess = () => resolve((request.result as CryptoKey) ?? null);
            request.onerror = () => resolve(null);
            tx.oncomplete = () => db.close();
        });
    }

    private async writeKey(key: CryptoKey): Promise<void> {
        const db = await this.openDb();
        if (!db) return;
        return new Promise(resolve => {
            const tx = db.transaction(KEY_STORE, 'readwrite');
            tx.objectStore(KEY_STORE).put(key, KEY_ID);
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = () => { db.close(); resolve(); };
        });
    }
}
