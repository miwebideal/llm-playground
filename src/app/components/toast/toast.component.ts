// src/app/components/toast/toast.component.ts

import { Component, inject } from '@angular/core';
import { ToastService, ToastType } from '../../services/toast.service';
import { LucideCircleAlert, LucideTriangleAlert, LucideInfo, LucideX, LucideCheckCheck } from '@lucide/angular';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-toast',
    imports: [CommonModule, LucideCheckCheck, LucideCircleAlert, LucideTriangleAlert, LucideInfo, LucideX, LucideCheckCheck],
    templateUrl: './toast.component.html'
})
export class ToastComponent {

    toastService = inject(ToastService);

    getToastClasses(type: ToastType): string {
        switch (type) {
            case 'success': return 'bg-emerald-300 dark:bg-emerald-900 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400';
            case 'error': return 'bg-red-300 dark:bg-red-900 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400';
            case 'warning': return 'bg-amber-300 dark:bg-amber-900 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400';
            case 'info': return 'bg-blue-300 dark:bg-blue-900 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400';
            default: return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300';
        }
    }

}