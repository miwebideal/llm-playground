// src/app/features/chat/chat-input/chat-input.component.ts

import { Component, signal, viewChild, afterNextRender, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LlmOrchestratorService } from '../../../core/services/llm-orchestrator.service';
import { SessionStore } from '../../../core/stores/session.store';
import { GlobalConfigStore } from '../../../core/stores/global-config.store';
import { ToastService } from '../../../core/services/toast.service';
import { DraftService } from '../../../core/services/draft.service';
import { QUICK_PROMPTS } from '../../../constants/prompts.constants';
import { ModalService } from '../../../core/services/modal.service';
import { estimateTokens, estimateContextTokens } from '../../../utils/token.utils';
import { TextareaAutosizeDirective } from '../../../directives/textarea-autosize.directive';

import { LucideTrash, LucideRotateCcw, LucideSquare, LucideX, LucideSendHorizontal, LucideZap, LucideMaximize, LucideMinimize } from '@lucide/angular';

@Component({
    selector: 'app-chat-input',
    imports: [
        CommonModule, TextareaAutosizeDirective,
        LucideTrash, LucideRotateCcw, LucideSquare, LucideX,
        LucideSendHorizontal, LucideZap, LucideMaximize, LucideMinimize
    ],
    templateUrl: './chat-input.component.html'
})
export class ChatInputComponent {

    private orchestrator = inject(LlmOrchestratorService);
    private sessionStore = inject(SessionStore);
    private configStore = inject(GlobalConfigStore);
    private modalService = inject(ModalService);
    private toast = inject(ToastService);
    private draft = inject(DraftService);

    private autosize = viewChild(TextareaAutosizeDirective);

    readonly userInput = this.draft.text;
    showPromptsModal = signal(false);
    isExpanded = signal(false);

    readonly isLoading = this.orchestrator.isLoading;
    readonly canRegenerate = computed(() => this.orchestrator.canRegenerate());
    readonly quickPrompts = QUICK_PROMPTS;

    readonly estimatedTokens = computed(() => estimateTokens(this.userInput()));
    readonly contextTokens = computed(() => {
        const firstSession = this.sessionStore.sessions()[0];
        const history = firstSession?.messages.filter(m => !m.isStreaming && !m.error && m.role !== 'system') || [];
        return estimateContextTokens(history, '') + this.estimatedTokens();
    });

    readonly hasMessages = computed(() => {
        const all = this.sessionStore.sessions();
        const active = this.configStore.state().isCompareMode ? all.slice(0, 2) : [all[0]];
        return active.some(s => s?.messages.length > 0);
    });

    constructor() {
        afterNextRender(() => this.autosize()?.fit());

        effect(() => {
            this.userInput();
            this.isExpanded();
            queueMicrotask(() => this.autosize()?.fit());
        });
    }

    onInput(value: string) {
        this.draft.set(value);
        this.autosize()?.fit();
    }

    toggleExpand() {
        this.isExpanded.update(v => !v);
    }

    setPrompt(text: string) {
        this.draft.set(text);
        this.showPromptsModal.set(false);
        queueMicrotask(() => this.autosize()?.fit());
    }

    async sendMessage() {
        const text = this.userInput().trim();
        if (!text || this.isLoading()) return;

        this.draft.clear();
        this.isExpanded.set(false);
        this.autosize()?.reset();

        await this.orchestrator.sendMessage(text);
    }

    onKeydown(event: KeyboardEvent) {
        if (event.key === 'k' && event.ctrlKey) {
            event.preventDefault();
            this.draft.clear();
            this.isExpanded.set(false);
            this.autosize()?.reset();
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
            title: isCompare ? 'Borrar chats' : 'Borrar historial',
            message: '¿Estás seguro de que querés borrar el historial? Esta acción no se puede deshacer.',
            confirmText: 'Sí, borrar',
            cancelText: 'Cancelar',
            isDanger: true
        });

        if (confirmed) {
            if (isCompare) {
                this.sessionStore.clearMessages();
            } else {
                const first = this.sessionStore.sessions()[0];
                if (first) this.sessionStore.clearMessages(first.id);
            }
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