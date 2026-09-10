// src/tests/core/services/persistence.service.spec.ts

import { TestBed } from '@angular/core/testing';
import { PersistenceService, STORAGE_KEYS } from '../../../app/core/services/persistence.service';

describe('PersistenceService', () => {
    let svc: PersistenceService;

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({ providers: [PersistenceService] });
        svc = TestBed.inject(PersistenceService);
    });

    afterEach(() => localStorage.clear());

    it('devuelve null si no hay key', () => {
        expect(svc.load(STORAGE_KEYS.draft)).toBeNull();
    });

    it('guarda y lee JSON válido', () => {
        svc.saveNow(STORAGE_KEYS.config, { includeHistory: true, streamMode: false, isCompareMode: false });
        const data = svc.load<{ includeHistory: boolean }>(
            STORAGE_KEYS.config,
            d => !!d && typeof d === 'object' && typeof (d as { includeHistory: unknown }).includeHistory === 'boolean'
        );

        expect(data).toBeTruthy();
        expect(data!.includeHistory).toBe(true);
    });

    it('borra la key si el JSON está roto', () => {
        localStorage.setItem(STORAGE_KEYS.draft, '{no-json');
        expect(svc.load(STORAGE_KEYS.draft)).toBeNull();
        expect(localStorage.getItem(STORAGE_KEYS.draft)).toBeNull();
    });

    it('borra la key si validate falla', () => {
        localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify({ nope: true }));
        const data = svc.load(STORAGE_KEYS.sessions, d => Array.isArray(d));
        expect(data).toBeNull();
        expect(localStorage.getItem(STORAGE_KEYS.sessions)).toBeNull();
    });

    it('save acaba escribiendo después del debounce', async () => {
        svc.save(STORAGE_KEYS.draft, 'hola', 50);
        expect(localStorage.getItem(STORAGE_KEYS.draft)).toBeNull();
        await new Promise(r => setTimeout(r, 80));
        expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.draft)!)).toBe('hola');
    });

    it('saveNow escribe ya', () => {
        svc.saveNow(STORAGE_KEYS.draft, 'ya');
        expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.draft)!)).toBe('ya');
    });

    it('remove borra la key', () => {
        svc.saveNow(STORAGE_KEYS.draft, 'x');
        svc.remove(STORAGE_KEYS.draft);
        expect(localStorage.getItem(STORAGE_KEYS.draft)).toBeNull();
    });
});