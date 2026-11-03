// src/app/features/chat/chat-input/chat-input.component.ts

import {
    ChangeDetectionStrategy, Component, afterNextRender, computed, effect, inject, signal, viewChild
} from '@angular/core';
import { TextareaAutosizeDirective } from '../../../directives/textarea-autosize.directive';
import { QUICK_PROMPTS } from '../../../constants/prompts.constants';
import { DraftService } from '../../../core/services/draft.service';
import { LlmOrchestratorService } from '../../../core/services/llm-orchestrator.service';
import { ModalService } from '../../../core/services/modal.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfigStore } from '../../../core/stores/config.store';
import { ProviderStore } from '../../../core/stores/provider.store';
import { SessionStore } from '../../../core/stores/session.store';
import { activeSessions } from '../../../core/state/session.selectors';
import { estimateContextTokens, estimateTokens } from '../../../utils/token.utils';
import {
    LucideTrash, LucideRotateCcw, LucideSquare, LucideX,
    LucideSendHorizontal, LucideZap, LucideMaximize, LucideMinimize
} from '@lucide/angular';

@Component({
    selector: 'app-chat-input',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        TextareaAutosizeDirective,
        LucideTrash, LucideRotateCcw, LucideSquare, LucideX,
        LucideSendHorizontal, LucideZap, LucideMaximize, LucideMinimize
    ],
    templateUrl: './chat-input.component.html'
})
export class ChatInputComponent {

    private orchestrator = inject(LlmOrchestratorService);
    private sessionStore = inject(SessionStore);
    private configStore = inject(ConfigStore);
    private providerStore = inject(ProviderStore);
    private modalService = inject(ModalService);
    private toast = inject(ToastService);
    private draft = inject(DraftService);

    private autosize = viewChild(TextareaAutosizeDirective);

    readonly userInput = this.draft.text;
    readonly showPromptsModal = signal(false);
    readonly isExpanded = signal(false);

    readonly isLoading = this.orchestrator.isLoading;
    readonly canRegenerate = this.orchestrator.canRegenerate;
    readonly quickPrompts = QUICK_PROMPTS;

    readonly activeSessions = computed(() => activeSessions(
        this.sessionStore.sessions(),
        this.configStore.state(),
        this.providerStore.providers()
    ));

    readonly isCompare = computed(() => this.configStore.state().isCompareMode);

    readonly estimatedTokens = computed(() => estimateTokens(this.userInput()));

    readonly contextTokens = computed(() => {
        const input = this.estimatedTokens();
        const sessions = this.activeSessions();
        if (!sessions.length) return input;
        return Math.max(...sessions.map(session => {
            const history = session.messages.filter(message =>
                !message.isStreaming && !message.error
            );
            return estimateContextTokens(history, '');
        })) + input;
    });

    readonly hasMessages = computed(() =>
        this.activeSessions().some(session => session.messages.length > 0)
    );

    constructor() {
        afterNextRender(() => this.autosize()?.fit());

        effect(() => {
            this.userInput();
            this.isExpanded();
            queueMicrotask(() => this.autosize()?.fit());
        });
    }

    onInput(event: Event): void {
        const value = (event.target as HTMLTextAreaElement).value;
        this.draft.set(value);
        this.autosize()?.fit();
    }

    toggleExpand(): void {
        this.isExpanded.update(value => !value);
    }

    setPrompt(text: string): void {
        this.draft.set(text);
        this.showPromptsModal.set(false);
        queueMicrotask(() => this.autosize()?.fit());
    }

    async sendMessage(): Promise<void> {
        const text = this.userInput().trim();
        if (!text || this.isLoading()) return;

        if (!this.orchestrator.canSend()) {
            await this.orchestrator.sendMessage(text);
            return;
        }

        this.draft.clear();
        this.isExpanded.set(false);
        this.autosize()?.reset();

        await this.orchestrator.sendMessage(text);
    }

    onKeydown(event: KeyboardEvent): void {
        if (event.key === 'k' && event.ctrlKey) {
            event.preventDefault();
            this.draft.clear();
            this.isExpanded.set(false);
            this.autosize()?.reset();
            return;
        }
        if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
            event.preventDefault();
            void this.sendMessage();
        }
    }

    async clearMessages(): Promise<void> {
        const ids = this.activeSessions().map(session => session.id);
        const confirmed = await this.modalService.confirm({
            title: this.isCompare() ? 'Borrar chats visibles' : 'Borrar historial',
            message: '¿Estás seguro de que querés borrar el historial? Esta acción no se puede deshacer.',
            confirmText: 'Sí, borrar',
            cancelText: 'Cancelar',
            isDanger: true
        });

        if (!confirmed) return;
        this.sessionStore.clearMessages(ids);
        this.toast.info('Historial borrado');
    }

    async regenerateLast(): Promise<void> {
        const confirmed = await this.modalService.confirm({
            title: 'Regenerar respuesta',
            message: '¿Estás seguro de que querés regenerar la última respuesta?',
            confirmText: 'Sí, regenerar',
            cancelText: 'Cancelar',
            isDanger: true
        });

        if (confirmed) await this.orchestrator.regenerateLast();
    }

    stopGenerating(): void {
        this.orchestrator.stopGenerating();
        this.toast.info('Generación detenida');
    }

    cancelAll(): void {
        this.orchestrator.cancelAll();
        this.toast.warning('Peticiones canceladas');
    }
}
