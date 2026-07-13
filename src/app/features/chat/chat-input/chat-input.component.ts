// src/app/features/chat/chat-input/chat-input.component.ts

import { Component, signal, viewChild, ElementRef, afterNextRender, effect, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LlmOrchestratorService } from '../../../core/services/llm-orchestrator.service';
import { SessionStore } from '../../../core/stores/session.store';
import { GlobalConfigStore } from '../../../core/stores/global-config.store';
import { ToastService } from '../../../core/services/toast.service';
import { QUICK_PROMPTS } from '../../../constants/prompts.constants';
import { ModalService } from '../../../core/services/modal.service';
import { estimateTokens, estimateContextTokens } from '../../../utils/token.utils';

import { LucideTrash, LucideRotateCcw, LucideSquare, LucideX, LucideSendHorizontal, LucideZap } from '@lucide/angular';

@Component({
    selector: 'app-chat-input',
    imports: [CommonModule, LucideTrash, LucideRotateCcw, LucideSquare, LucideX, LucideSendHorizontal, LucideZap],
    templateUrl: './chat-input.component.html'
})
export class ChatInputComponent {

    userInput = signal('');
    showPromptsModal = signal(false);

    private orchestrator = inject(LlmOrchestratorService);
    private sessionStore = inject(SessionStore);
    private configStore = inject(GlobalConfigStore);
    private modalService = inject(ModalService);
    private toast = inject(ToastService);
    private textareaRef = viewChild<ElementRef<HTMLTextAreaElement>>('messageInput');
    private readonly DRAFT_KEY = 'llm-draft';

    readonly isLoading = this.orchestrator.isLoading;
    readonly canRegenerate = computed(() => this.orchestrator.canRegenerate());
    readonly quickPrompts = QUICK_PROMPTS;

    readonly estimatedTokens = computed(() => estimateTokens(this.userInput()));
    readonly contextTokens = computed(() => {
        // Usamos la primera sesión activa como referencia para el cálculo de contexto
        const firstSession = this.sessionStore.sessions()[0];
        const history = firstSession?.messages.filter(m => !m.isStreaming && !m.error && m.role !== 'system') || [];
        return estimateContextTokens(history, '') + this.estimatedTokens();
    });

    readonly hasMessages = computed(() => {
        return this.sessionStore.sessions().some(s => s.messages.length > 0);
    });

    constructor() {
        const savedDraft = localStorage.getItem(this.DRAFT_KEY);
        if (savedDraft) this.userInput.set(savedDraft);

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
            if (input.trim()) localStorage.setItem(this.DRAFT_KEY, input);
            else localStorage.removeItem(this.DRAFT_KEY);
        });
    }

    adjustHeight(el: HTMLTextAreaElement) {
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
    }

    private resetTextareaHeight() {
        const el = this.textareaRef()?.nativeElement;
        if (el) {
            el.style.height = 'auto';
            el.value = '';
        }
    }

    setPrompt(text: string) {
        this.userInput.set(text);
        this.showPromptsModal.set(false);
        setTimeout(() => {
            const el = this.textareaRef()?.nativeElement;
            if (el) {
                this.adjustHeight(el);
                el.focus();
            }
        }, 50);
    }

    async sendMessage() {
        const text = this.userInput().trim();
        if (!text || this.isLoading()) return;

        this.userInput.set('');
        this.resetTextareaHeight();
        localStorage.removeItem(this.DRAFT_KEY);

        await this.orchestrator.sendMessage(text);
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

    async clearMessages() {
        const isCompare = this.configStore.state().isCompareMode;
        const confirmed = await this.modalService.confirm({
            title: isCompare ? 'Limpiar chats' : 'Limpiar historial',
            message: '¿Estás seguro de que querés borrar el historial? Esta acción no se puede deshacer.',
            confirmText: 'Sí, borrar',
            cancelText: 'Cancelar',
            isDanger: true
        });

        if (confirmed) {
            this.sessionStore.clearMessages();
            this.toast.info('Historial borrado');
        }
    }

    async regenerateLast() {
        const confirmed = await this.modalService.confirm({
            title: 'Regenerar respuesta',
            message: '¿Estás seguro de que querés regenerar la última respuesta?',
            confirmText: 'Sí, regenerar',
            cancelText: 'Cancelar',
            isDanger: true
        });

        if (confirmed) {
            await this.orchestrator.regenerateLast();
        }
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
