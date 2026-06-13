// src/app/home/home.component.ts

import { Component, signal, viewChild, ElementRef, afterNextRender, effect, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LlmOrchestratorService } from '../services/llm-orchestrator.service';
import { ConfigStore } from '../stores/config.store';
import { MessagesStore } from '../stores/messages.store';
import { ExportService } from '../services/export.service';
import { ToastService } from '../services/toast.service';
import { estimateTokens, estimateContextTokens } from '../utils/token.utils';
import { HeaderComponent } from '../components/header/header.component';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { ChatMessageComponent } from '../components/chat-message/chat-message.component';
import {
    LucideMessageSquare, LucideCircleAlert, LucideHistory,
    LucideActivity, LucideTrash, LucideX, LucideSendHorizontal, LucideRotateCcw,
    LucideSquare
} from '@lucide/angular';

@Component({
    selector: 'app-home',
    imports: [
        CommonModule, HeaderComponent, SidebarComponent, ChatMessageComponent,
        LucideMessageSquare, LucideCircleAlert, LucideHistory,
        LucideActivity, LucideTrash, LucideX, LucideSendHorizontal, LucideRotateCcw,
        LucideSquare
    ],
    templateUrl: './home.component.html',
})
export class HomeComponent {

    private orchestrator = inject(LlmOrchestratorService);
    private exportService = inject(ExportService);
    private toast = inject(ToastService);
    private configStore = inject(ConfigStore);
    private messagesStore = inject(MessagesStore);

    readonly isLoading = this.orchestrator.isLoading;

    userInput = signal('');
    configOpen = signal(false);

    readonly estimatedTokens = computed(() => estimateTokens(this.userInput()));
    readonly contextTokens = computed(() => estimateContextTokens(this.messagesStore.validHistory(), this.userInput()));
    readonly hasConfig = computed(() => this.configStore.isReady());

    private textareaRef = viewChild<ElementRef<HTMLTextAreaElement>>('messageInput');
    private messagesContainerRef = viewChild<ElementRef<HTMLDivElement>>('messagesContainer');

    private readonly DRAFT_KEY = 'llm-draft';
    private lastMessageCount = 0;

    readonly config = this.configStore.state;
    readonly messages = this.messagesStore.state;

    constructor() {
        const savedDraft = localStorage.getItem(this.DRAFT_KEY);
        if (savedDraft) {
            this.userInput.set(savedDraft);
        }

        afterNextRender(() => {
            const el = this.textareaRef()?.nativeElement;
            if (el) {
                el.value = this.userInput();
                this.adjustHeight(el);
                el.focus();
            }
        });

        effect(() => {
            const input = this.userInput();
            if (input.trim()) {
                localStorage.setItem(this.DRAFT_KEY, input);
            } else {
                localStorage.removeItem(this.DRAFT_KEY);
            }
        });

        effect(() => {
            this.messagesStore.state();
            setTimeout(() => this.scrollToBottom(), 50);
        });
    }

    private scrollToBottom() {
        const container = this.messagesContainerRef()?.nativeElement;
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    adjustHeight(el: HTMLTextAreaElement) {
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
    }

    onExportChat() {
        this.exportService.exportChat(this.messagesStore.state(), this.configStore.state());
    }

    async sendMessage() {
        const text = this.userInput().trim();
        if (!text || this.isLoading()) return;

        if (!this.hasConfig()) {
            this.toast.warning('Falta configurar la API URL, Token o Modelo.');
            this.configOpen.set(true);
            return;
        }

        this.userInput.set('');
        this.resetTextareaHeight();
        localStorage.removeItem(this.DRAFT_KEY);

        if (this.configStore.streamMode()) {
            await this.orchestrator.sendMessageStream(text);
        } else {
            await this.orchestrator.sendMessage(text);
        }
    }

    onKeydown(event: KeyboardEvent) {
        if (event.key === 'k' && event.ctrlKey) {
            event.preventDefault();
            this.userInput.set('');
            this.resetTextareaHeight();
            return;
        }

        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    private resetTextareaHeight() {
        const el = this.textareaRef()?.nativeElement;
        if (el) {
            el.style.height = 'auto';
            el.value = '';
        }
    }

    clearMessages() {
        this.messagesStore.clear();
        this.toast.info('Historial borrado');
    }

    deleteMessage(id: string) {
        this.messagesStore.deleteById(id);
    }

    readonly canRegenerate = computed(() => {
        return this.orchestrator.canRegenerate();
    });

    async regenerateLast() {
        await this.orchestrator.regenerateLast();
    }

    stopGenerating() {
        this.orchestrator.stopGenerating();
        this.toast.info('Generación detenida');
    }

    cancelRequest() {
        this.orchestrator.cancel();
        this.toast.warning('Petición cancelada');
    }

}