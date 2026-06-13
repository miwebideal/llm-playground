// src/app/utils/crypto.utils.ts

const PASSPHRASE = 'llm-playground-2026-miwebideal';
const SALT = new TextEncoder().encode('fixed-salt-v1');

async function getKey(): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(PASSPHRASE),
        'PBKDF2',
        false,
        ['deriveKey']
    );
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: SALT, iterations: 100000, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

export async function encrypt(text: string): Promise<string> {
    if (!text) return '';
    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new TextEncoder().encode(text)
    );
    const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    return btoa(String.fromCharCode(...combined));
}

export async function decrypt(encrypted: string): Promise<string> {
    if (!encrypted) return '';
    try {
        const key = await getKey();
        const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
        const iv = combined.slice(0, 12);
        const data = combined.slice(12);
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            data
        );
        return new TextDecoder().decode(decrypted);
    } catch {
        return '';
    }
}