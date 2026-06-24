// src/app/components/chat-message/chat-message.component.ts

import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../../models/llm.models';
import { SafeMarkdownService } from '../../services/safe-markdown.service';
import { ToastService } from '../../services/toast.service';
import { CodeCopyDirective } from '../../directives/code-copy.directive';
import { MODEL_PRICING } from '../../utils/chat.constants';

import {
    LucideCircleAlert, LucideCopy, LucideTrash2,
    LucideBrain, LucideChevronDown, LucideBot, LucidePlay
} from '@lucide/angular';

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
    private toast = inject(ToastService);

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

        try {
            await navigator.clipboard.writeText(textToCopy);
            this.toast.success('Mensaje copiado al portapapeles');
        } catch (err) {
            this.toast.error('No se pudo copiar al portapapeles');
            console.error('Clipboard error:', err);
        }
    }

    // Calcula los Tokens por Segundo (TPS) basados en el tiempo real de generación
    getTPS(metrics: Message['metrics']): string | null {
        if (!metrics || !metrics.tokensOut || !metrics.totalTime || !metrics.ttft) return null;

        const genTimeSec = (metrics.totalTime - metrics.ttft) / 1000;
        if (genTimeSec <= 0) return null;

        return (metrics.tokensOut / genTimeSec).toFixed(1);
    }

    // Calcula el costo estimado del prompt basado en los precios del modelo
    getCost(metrics: Message['metrics'], model?: string): string | null {
        if (!metrics || !metrics.tokensIn || !metrics.tokensOut || !model) return null;

        const pricing = MODEL_PRICING[model];
        if (!pricing) return null;

        const costIn = (metrics.tokensIn / 1000000) * pricing.input;
        const costOut = (metrics.tokensOut / 1000000) * pricing.output;
        const totalCost = costIn + costOut;

        if (totalCost === 0) return null;
        if (totalCost < 0.0001) return '< $0.0001';

        return '$' + totalCost.toFixed(4);
    }

}
