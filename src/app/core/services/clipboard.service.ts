// src/app/core/services/clipboard.service.ts

import { Injectable, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class ClipboardService {

    private toast = inject(ToastService);

    async copy(text: string, okMsg = 'Copiado al portapapeles', errMsg = 'No se pudo copiar'): Promise<boolean> {
        const value = text ?? '';
        if (!value) {
            this.toast.warning('Nada para copiar');
            return false;
        }

        const ok = await this.write(value);
        if (ok) this.toast.success(okMsg);
        else this.toast.error(errMsg);
        return ok;
    }

    private async write(text: string): Promise<boolean> {
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }
        } catch {
            // fallback
        }
        return this.fallback(text);
    }

    private fallback(text: string): boolean {
        try {
            const el = document.createElement('textarea');
            el.value = text;
            el.setAttribute('readonly', '');
            el.style.position = 'fixed';
            el.style.left = '-9999px';
            document.body.appendChild(el);
            el.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(el);
            return ok;
        } catch {
            return false;
        }
    }
}