// src/app/services/toast.service.ts

import { Injectable, signal, OnDestroy } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: number;
    type: ToastType;
    message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService implements OnDestroy {

    toasts = signal<Toast[]>([]);
    private idCounter = 0;
    private timeouts = new Map<number, ReturnType<typeof setTimeout>>();

    show(type: ToastType, message: string, duration = 3000) {
        const id = this.idCounter++;
        this.toasts.update(t => [...t, { id, type, message }]);

        const timeout = setTimeout(() => {
            this.remove(id);
        }, duration);
        this.timeouts.set(id, timeout);
    }

    success(msg: string) { this.show('success', msg); }
    error(msg: string) { this.show('error', msg, 5000); }
    warning(msg: string) { this.show('warning', msg); }
    info(msg: string) { this.show('info', msg); }

    remove(id: number) {
        const timeout = this.timeouts.get(id);
        if (timeout) {
            clearTimeout(timeout);
            this.timeouts.delete(id);
        }
        this.toasts.update(t => t.filter(toast => toast.id !== id));
    }

    ngOnDestroy() {
        this.timeouts.forEach(t => clearTimeout(t));
        this.timeouts.clear();
    }

}