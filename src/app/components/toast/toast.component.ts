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
            case 'success': return 'bg-success text-white border-success';
            case 'error': return 'bg-error text-white border-error';
            case 'warning': return 'bg-warning text-white border-warning';
            case 'info': return 'bg-info text-white border-info';
            default: return 'bg-surface border-border-strong text-text-main';
        }
    }

}