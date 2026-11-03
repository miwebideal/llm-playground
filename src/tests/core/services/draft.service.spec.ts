// src/tests/core/services/draft.service.spec.ts

import { TestBed } from '@angular/core/testing';
import { DraftService } from '../../../app/core/services/draft.service';
import { StorageService, STORAGE_KEYS } from '../../../app/core/services/storage.service';
import { ToastService } from '../../../app/core/services/toast.service';

describe('DraftService', () => {

    afterEach(() => localStorage.clear());

    function create(): DraftService {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            providers: [ToastService, StorageService, DraftService]
        });
        return TestBed.inject(DraftService);
    }

    it('arranca vacío si no hay draft', () => {
        localStorage.clear();
        expect(create().text()).toBe('');
    });

    it('hidrata un string guardado en formato legado', () => {
        localStorage.setItem(STORAGE_KEYS.draft, JSON.stringify('borrador'));
        expect(create().text()).toBe('borrador');
    });

    it('si el valor no es string, borra la key', () => {
        localStorage.setItem(STORAGE_KEYS.draft, JSON.stringify({ text: 'no' }));
        const draft = create();
        expect(draft.text()).toBe('');
        expect(localStorage.getItem(STORAGE_KEYS.draft)).toBeNull();
    });

    it('set persiste y clear borra sin resucitar', async () => {
        const draft = create();
        draft.set('hola');
        expect(draft.text()).toBe('hola');
        await new Promise(resolve => setTimeout(resolve, 450));
        const envelope = JSON.parse(localStorage.getItem(STORAGE_KEYS.draft)!);
        expect(envelope.data).toBe('hola');

        draft.clear();
        expect(draft.text()).toBe('');
        await new Promise(resolve => setTimeout(resolve, 450));
        expect(localStorage.getItem(STORAGE_KEYS.draft)).toBeNull();
    });

    it('set con solo espacios no deja key', () => {
        const draft = create();
        draft.set('   ');
        expect(localStorage.getItem(STORAGE_KEYS.draft)).toBeNull();
    });
});
