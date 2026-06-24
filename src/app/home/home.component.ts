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
import { ModalService } from '../services/modal.service';
import { guessProvider } from '../utils/provider.utils';
import { QUICK_PROMPTS } from '../utils/chat.constants';

import {
    LucideMessageSquare, LucideCircleAlert, LucideTrash, LucideX, LucideSendHorizontal, LucideRotateCcw,
    LucideSquare
} from '@lucide/angular';

@Component({
    selector: 'app-home',
    imports: [
        CommonModule, HeaderComponent, SidebarComponent, ChatMessageComponent,
        LucideMessageSquare, LucideCircleAlert, LucideTrash, LucideX, LucideSendHorizontal, LucideRotateCcw,
        LucideSquare
    ],
    templateUrl: './home.component.html',
})
export class HomeComponent {

    userInput = signal('');
    configOpen = signal(false);
    activeTab = signal<'a' | 'b'>('a');

    private orchestrator = inject(LlmOrchestratorService);
    private exportService = inject(ExportService);
    private toast = inject(ToastService);
    private configStore = inject(ConfigStore);
    private textareaRef = viewChild<ElementRef<HTMLTextAreaElement>>('messageInput');
    private messagesContainerRef = viewChild<ElementRef<HTMLDivElement>>('messagesContainer');
    private messagesContainerBRef = viewChild<ElementRef<HTMLDivElement>>('messagesContainerB');
    private messagesStore = inject(MessagesStore);
    private modalService = inject(ModalService);
    private readonly DRAFT_KEY = 'llm-draft';

    readonly canRegenerate = computed(() => this.orchestrator.canRegenerate());
    readonly isLoading = this.orchestrator.isLoading;
    readonly config = this.configStore.state;
    readonly providerA = computed(() => guessProvider(this.config().apiUrl));
    readonly providerB = computed(() => guessProvider(this.config().apiUrlB));
    readonly messagesA = this.messagesStore.stateA;
    readonly messagesB = this.messagesStore.stateB;
    readonly hasConfig = computed(() => this.configStore.isReady());
    readonly contextTokens = computed(() => this.historyTokens() + this.estimatedTokens());
    readonly quickPrompts = QUICK_PROMPTS;
    readonly estimatedTokens = computed(() => estimateTokens(this.userInput()));
    readonly historyTokens = computed(() => {
        const history = this.activeTab() === 'a' ? this.messagesStore.validHistory('a') : this.messagesStore.validHistory('b');
        return estimateContextTokens(history, '');
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

        effect((onCleanup) => {
            const el = this.messagesContainerRef()?.nativeElement;
            if (el) {
                const obs = new MutationObserver(() => {
                    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
                    if (isNearBottom) {
                        requestAnimationFrame(() => el.scrollTop = el.scrollHeight);
                    }
                });
                obs.observe(el, { childList: true, subtree: true, characterData: true });
                onCleanup(() => obs.disconnect());
            }
        });

        effect((onCleanup) => {
            const el = this.messagesContainerBRef()?.nativeElement;
            if (el) {
                const obs = new MutationObserver(() => {
                    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
                    if (isNearBottom) {
                        requestAnimationFrame(() => el.scrollTop = el.scrollHeight);
                    }
                });
                obs.observe(el, { childList: true, subtree: true, characterData: true });
                onCleanup(() => obs.disconnect());
            }
        });

    }

    onExportJson() { this.exportService.exportChat(this.messagesA(), this.messagesB(), this.configStore.state()); }
    onExportMd() { this.exportService.exportMarkdown(this.messagesA(), this.messagesB(), this.configStore.state()); }
    onCopyChat() { this.exportService.copyChat(this.messagesA(), this.messagesB(), this.configStore.state()); }

    async regenerateLast() {
        const confirmed = await this.modalService.confirm({
            title: 'Regenerar respuesta',
            message: '¿Estás seguro de que querés regenerar la última respuesta? Se eliminará la respuesta actual de la IA y se generará una nueva.',
            confirmText: 'Sí, regenerar',
            cancelText: 'Cancelar',
            isDanger: true
        });

        if (confirmed) {
            await this.orchestrator.regenerateLast();
        }
    }

    toggleHistory() {
        const newState = !this.config().includeHistory;
        this.configStore.update({ includeHistory: newState });
        this.toast.info(`Historial ${newState ? 'activado' : 'desactivado'}`);
    }

    toggleStream() {
        const newState = !this.config().streamMode;
        this.configStore.update({ streamMode: newState });
        this.toast.info(`Modo Stream ${newState ? 'activado' : 'desactivado'}`);
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

        if (!this.hasConfig()) {
            this.toast.warning('Falta configurar la API URL, Token o Modelo.');
            this.configOpen.set(true);
            return;
        }

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
            message: isCompare
                ? '¿Estás seguro de que querés borrar ambos historiales de chat? Esta acción no se puede deshacer.'
                : '¿Estás seguro de que querés borrar todo el historial? Esta acción no se puede deshacer.',
            confirmText: 'Sí, borrar',
            cancelText: 'Cancelar',
            isDanger: true
        });

        if (confirmed) {
            this.messagesStore.clear();
            this.toast.info(isCompare ? 'Chats limpiados' : 'Historial borrado');
        }
    }

    deleteMessage(id: string) {
        this.messagesStore.deleteById(id);
        this.toast.success('Mensaje eliminado');
    }

    async continueMessage(id: string) {
        await this.orchestrator.continueMessage(id);
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
