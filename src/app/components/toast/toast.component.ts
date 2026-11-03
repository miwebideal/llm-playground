// src/app/components/toast/toast.component.ts

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService, ToastType } from '../../core/services/toast.service';
import { LucideCircleAlert, LucideTriangleAlert, LucideInfo, LucideX, LucideCheckCheck } from '@lucide/angular';

@Component({
    selector: 'app-toast',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [LucideCircleAlert, LucideTriangleAlert, LucideInfo, LucideX, LucideCheckCheck],
    templateUrl: './toast.component.html'
})
export class ToastComponent {

    toastService = inject(ToastService);

    toneClasses(type: ToastType): string {
        switch (type) {
            case 'success': return 'border-success/50';
            case 'error': return 'border-error/50 text-error';
            case 'warning': return 'border-warning/60';
            default: return 'border-info/50';
        }
    }
}
