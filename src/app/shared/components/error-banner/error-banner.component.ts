// src/app/shared/components/error-banner/error-banner.component.ts

import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { APP_ERROR_META, AppError } from '../../../core/models';
import { ClipboardService } from '../../../core/services/clipboard.service';
import { LucideCircleAlert, LucideLightbulb, LucideRefreshCw, LucideCopy } from '@lucide/angular';

@Component({
    selector: 'app-error-banner',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [LucideCircleAlert, LucideLightbulb, LucideRefreshCw, LucideCopy],
    templateUrl: './error-banner.component.html'
})
export class ErrorBannerComponent {

    error = input.required<AppError>();
    retry = output<void>();

    private clipboard = inject(ClipboardService);

    readonly meta = computed(() => APP_ERROR_META[this.error().type] ?? APP_ERROR_META.unknown);

    readonly details = computed(() => {
        const error = this.error();
        return [error.message, error.providerMessage, error.hint, error.code ? `code: ${error.code}` : '']
            .filter(Boolean)
            .join('\n');
    });

    copyDetails(): void {
        void this.clipboard.copy(this.details(), 'Detalle copiado');
    }
}
