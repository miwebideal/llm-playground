// src/app/core/services/modal.service.ts

import { Injectable, signal } from '@angular/core';

export interface ModalOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ModalService {

    isOpen = signal(false);
    options = signal<ModalOptions | null>(null);
    private resolvePromise: ((value: boolean) => void) | null = null;

    confirm(options: ModalOptions): Promise<boolean> {
        this.options.set({
            confirmText: 'Confirmar',
            cancelText: 'Cancelar',
            isDanger: false,
            ...options
        });
        this.isOpen.set(true);

        return new Promise((resolve) => {
            this.resolvePromise = resolve;
        });
    }

    close(result: boolean) {
        this.isOpen.set(false);
        if (this.resolvePromise) {
            this.resolvePromise(result);
            this.resolvePromise = null;
        }
    }

}
