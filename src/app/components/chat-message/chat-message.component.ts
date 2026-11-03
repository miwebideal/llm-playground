// src/app/components/chat-message/chat-message.component.ts

import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Message } from '../../core/models';
import { ClipboardService } from '../../core/services/clipboard.service';
import { MetricsService } from '../../core/services/metrics.service';
import { MarkdownComponent } from '../../shared/components/markdown/markdown.component';
import { ErrorBannerComponent } from '../../shared/components/error-banner/error-banner.component';
import { CodeCopyDirective } from '../../directives/code-copy.directive';
import {
    LucideCopy, LucideTrash2,
    LucideBrain, LucideChevronDown, LucideBot, LucidePlay
} from '@lucide/angular';

@Component({
    selector: 'app-chat-message',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MarkdownComponent, ErrorBannerComponent, CodeCopyDirective,
        LucideCopy, LucideTrash2, LucideBrain, LucideChevronDown, LucideBot, LucidePlay
    ],
    templateUrl: './chat-message.component.html'
})
export class ChatMessageComponent {

    private clipboard = inject(ClipboardService);
    private metrics = inject(MetricsService);

    msg = input.required<Message>();
    onDelete = output<string>();
    onContinue = output<string>();
    onRetry = output<string>();

    readonly isUser = computed(() => this.msg().role === 'user');
    readonly isInterrupted = computed(() => {
        const reason = this.msg().finishReason?.toLowerCase();
        return reason === 'length' || reason === 'max_tokens';
    });
    readonly tps = computed(() => this.metrics.formatTPS(this.msg().metrics));
    readonly cost = computed(() => this.metrics.formatCost(this.msg().metrics, this.msg().provider, this.msg().model));

    formatTime(date: Date): string {
        return new Date(date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    }

    async copyToClipboard(): Promise<void> {
        const message = this.msg();
        const text = message.reasoning
            ? `🧠 Proceso de pensamiento:\n${message.reasoning}\n\nRespuesta:\n${message.content}`
            : message.content;
        await this.clipboard.copy(text, 'Mensaje copiado al portapapeles');
    }
}
