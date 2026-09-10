// src/app/components/toast/toast.component.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastType } from '../../core/services/toast.service';

import { LucideCircleAlert, LucideTriangleAlert, LucideInfo, LucideX, LucideCheckCheck } from '@lucide/angular';

@Component({
    selector: 'app-toast',
    imports: [CommonModule, LucideCheckCheck, LucideCircleAlert, LucideTriangleAlert, LucideInfo, LucideX, LucideCheckCheck],
    templateUrl: './toast.component.html'
})
export class ToastComponent {

    toastService = inject(ToastService);

    getToastClasses(type: ToastType): string {
        switch (type) {
            case 'success': return 'border-border-strong';
            case 'error': return 'border-error/40 text-error';
            case 'warning': return 'border-border-strong';
            case 'info': return 'border-border-strong';
            default: return 'border-border-strong';
        }
    }

}