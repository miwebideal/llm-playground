// src/app/components/chat-message/chat-message.component.ts

import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../../models/chat.models';
import { SafeMarkdownService } from '../../core/services/safe-markdown.service';
import { ClipboardService } from '../../core/services/clipboard.service';
import { CodeCopyDirective } from '../../directives/code-copy.directive';

import {
    LucideCircleAlert, LucideCopy, LucideTrash2,
    LucideBrain, LucideChevronDown, LucideBot, LucidePlay
} from '@lucide/angular';
import { MetricsService } from '../../core/services/metrics.service';

@Component({
    selector: 'app-chat-message',
    imports: [
        CommonModule, CodeCopyDirective,
        LucideCircleAlert, LucideCopy, LucideTrash2, LucideBrain, LucideChevronDown, LucideBot, LucidePlay
    ],
    templateUrl: './chat-message.component.html'
})
export class ChatMessageComponent {

    markdown = inject(SafeMarkdownService);
    private clipboard = inject(ClipboardService);
    private metrics = inject(MetricsService);

    msg = input.required<Message>();
    onDelete = output<string>();
    onContinue = output<string>();

    get isUser(): boolean {
        return this.msg().role === 'user';
    }

    get isInterrupted(): boolean {
        const fr = this.msg().finishReason?.toLowerCase();
        return fr === 'length' || fr === 'max_tokens';
    }

    formatTime(date: Date): string {
        return new Date(date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    }

    async copyToClipboard() {
        const m = this.msg();
        const textToCopy = m.reasoning
            ? `🧠 Proceso de pensamiento:\n${m.reasoning}\n\nRespuesta:\n${m.content}`
            : m.content;

        await this.clipboard.copy(textToCopy, 'Mensaje copiado al portapapeles');
    }

    getTPS(metrics: Message['metrics']): string | null {
        return this.metrics.formatTPS(metrics);
    }

    getCost(metrics: Message['metrics'], model?: string): string | null {
        return this.metrics.formatCost(metrics, model);
    }

}