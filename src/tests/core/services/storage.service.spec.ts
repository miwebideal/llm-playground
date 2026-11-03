// src/tests/core/services/persistence.service.spec.ts

import { TestBed } from '@angular/core/testing';
import { StorageService, STORAGE_KEYS } from '../../../app/core/services/storage.service';
import { ToastService } from '../../../app/core/services/toast.service';

describe('StorageService', () => {
    let service: StorageService;

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({ providers: [ToastService, StorageService] });
        service = TestBed.inject(StorageService);
    });

    afterEach(() => localStorage.clear());

    it('devuelve null si no hay key', () => {
        expect(service.load(STORAGE_KEYS.draft)).toBeNull();
    });

    it('guarda con envelope y lee el dato', () => {
        service.saveNow(STORAGE_KEYS.config, { includeHistory: true });
        const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.config)!);
        expect(raw.v).toBe(1);

        const data = service.load<{ includeHistory: boolean }>(STORAGE_KEYS.config);
        expect(data?.includeHistory).toBe(true);
    });

    it('lee el formato legado sin envelope', () => {
        localStorage.setItem(STORAGE_KEYS.draft, JSON.stringify('borrador'));
        expect(service.load<string>(STORAGE_KEYS.draft)).toBe('borrador');
    });

    it('borra la key si el JSON está roto', () => {
        localStorage.setItem(STORAGE_KEYS.draft, '{no-json');
        expect(service.load(STORAGE_KEYS.draft)).toBeNull();
        expect(localStorage.getItem(STORAGE_KEYS.draft)).toBeNull();
    });

    it('borra la key si validate falla', () => {
        localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify({ nope: true }));
        expect(service.load(STORAGE_KEYS.sessions, data => Array.isArray(data))).toBeNull();
        expect(localStorage.getItem(STORAGE_KEYS.sessions)).toBeNull();
    });

    it('save espera el debounce', async () => {
        service.save(STORAGE_KEYS.draft, 'hola', 50);
        expect(localStorage.getItem(STORAGE_KEYS.draft)).toBeNull();
        await new Promise(resolve => setTimeout(resolve, 80));
        const envelope = JSON.parse(localStorage.getItem(STORAGE_KEYS.draft)!);
        expect(envelope.data).toBe('hola');
    });

    it('remove cancela una escritura pendiente', async () => {
        service.save(STORAGE_KEYS.draft, 'hola', 50);
        service.remove(STORAGE_KEYS.draft);
        await new Promise(resolve => setTimeout(resolve, 80));
        expect(localStorage.getItem(STORAGE_KEYS.draft)).toBeNull();
    });
});
