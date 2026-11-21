// src/app/components/chat-message/chat-message.component.ts

import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { Message } from '../../core/models';
import { ClipboardService } from '../../core/services/clipboard.service';
import { MetricsService } from '../../core/services/metrics.service';
import { MarkdownComponent } from '../../shared/components/markdown/markdown.component';
import { ErrorBannerComponent } from '../../shared/components/error-banner/error-banner.component';
import { CodeCopyDirective } from '../../directives/code-copy.directive';
import { formatMs } from '../../utils/format.utils';
import { LucideBrain, LucideChevronDown, LucideCopy, LucidePlay, LucideTrash } from '@lucide/angular';

@Component({
    selector: 'app-chat-message',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MarkdownComponent, ErrorBannerComponent, CodeCopyDirective,
        LucideCopy, LucideTrash, LucideBrain, LucideChevronDown, LucidePlay
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

    readonly showDetail = signal(false);
    private detail = viewChild<ElementRef<HTMLElement>>('detail');
    readonly fmtMs = formatMs;

    readonly isUser = computed(() => this.msg().role === 'user');
    readonly isInterrupted = computed(() => {
        const reason = this.msg().finishReason?.toLowerCase();
        return reason === 'length' || reason === 'max_tokens';
    });
    readonly tps = computed(() => this.metrics.formatTPS(this.msg().metrics));
    readonly cost = computed(() => this.metrics.formatCost(this.msg().metrics, this.msg().provider, this.msg().model));
    readonly generationMs = computed(() => {
        const m = this.msg().metrics;
        return m?.totalTime != null && m.ttft != null ? m.totalTime - m.ttft : null;
    });

    /** Abre el detalle y, si quedó fuera de vista, desplaza lo justo para mostrarlo. */
    toggleDetail(): void {
        this.showDetail.update(open => !open);
        if (!this.showDetail()) return;
        requestAnimationFrame(() => this.detail()?.nativeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
    }

    async copyToClipboard(): Promise<void> {
        const message = this.msg();
        const text = message.reasoning
            ? `Razonamiento:\n${message.reasoning}\n\nRespuesta:\n${message.content}`
            : message.content;
        await this.clipboard.copy(text, 'Mensaje copiado');
    }
}
