// src/app/components/chat-message/chat-message.component.ts

import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../../models/llm.models';
import { SafeMarkdownService } from '../../services/safe-markdown.service';
import { ToastService } from '../../services/toast.service';
import { CodeCopyDirective } from '../../directives/code-copy.directive';
import {
    LucideCircleAlert, LucideCopy, LucideTrash2,
    LucideBrain, LucideChevronDown
} from '@lucide/angular';

@Component({
    selector: 'app-chat-message',
    imports: [
        CommonModule, CodeCopyDirective,
        LucideCircleAlert, LucideCopy, LucideTrash2, LucideBrain, LucideChevronDown
    ],
    templateUrl: './chat-message.component.html'
})
export class ChatMessageComponent {

    markdown = inject(SafeMarkdownService);
    private toast = inject(ToastService);

    msg = input.required<Message>();
    onDelete = output<string>();

    // Getter para limpiar el HTML
    get isUser(): boolean {
        return this.msg().role === 'user';
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
}
