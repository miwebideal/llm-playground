// src/app/features/playground/chat/chat-column/chat-column.component.ts

import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { ChatSession } from '../../../../core/models';
import { ChatMessageComponent } from '../../../../components/chat-message/chat-message.component';
import { LlmOrchestratorService } from '../../../../core/services/llm-orchestrator.service';
import { ModelRegistryService } from '../../../../core/registry/model-registry.service';
import { ConfigStore } from '../../../../core/stores/config.store';
import { ProviderStore } from '../../../../core/stores/provider.store';
import { SessionStore } from '../../../../core/stores/session.store';
import { UiStore } from '../../../../core/stores/ui.store';
import { sessionReadiness } from '../../../../core/state/session.selectors';
import { providerName } from '../../../../constants/providers.constants';
import { LucideMessageSquare, LucideArrowDown, LucideChevronDown } from '@lucide/angular';

const PIN_THRESHOLD_PX = 48;

@Component({
    selector: 'app-chat-column',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ChatMessageComponent, LucideMessageSquare, LucideArrowDown, LucideChevronDown],
    templateUrl: './chat-column.component.html'
})
export class ChatColumnComponent {

    session = input.required<ChatSession>();
    /** Posición de la columna: define el color de identidad (A violeta, B coral). */
    index = input<number>(0);

    private messagesContainer = viewChild<ElementRef<HTMLDivElement>>('messagesContainer');
    private orchestrator = inject(LlmOrchestratorService);
    private sessionStore = inject(SessionStore);
    private providerStore = inject(ProviderStore);
    private configStore = inject(ConfigStore);
    private registry = inject(ModelRegistryService);
    private ui = inject(UiStore);

    readonly color = computed(() => this.index() === 0 ? 'var(--model-a)' : 'var(--model-b)');
    readonly label = computed(() => this.session().model ? this.registry.resolve(this.session()).label : 'Elegí un modelo');
    readonly providerLabel = computed(() => providerName(this.session().providerId));
    readonly ready = computed(() => sessionReadiness(this.session(), this.providerStore.providers()));

    readonly pinnedToBottom = signal(true);
    private lastSessionId = '';

    constructor() {
        effect(onCleanup => {
            const element = this.messagesContainer()?.nativeElement;
            if (!element) return;

            const onScroll = () => {
                const distance = element.scrollHeight - element.scrollTop - element.clientHeight;
                this.pinnedToBottom.set(distance < PIN_THRESHOLD_PX);
            };
            element.addEventListener('scroll', onScroll, { passive: true });

            const observer = typeof ResizeObserver !== 'undefined'
                ? new ResizeObserver(() => { if (this.pinnedToBottom()) this.scrollToBottom(); })
                : null;
            observer?.observe(element);

            onCleanup(() => {
                element.removeEventListener('scroll', onScroll);
                observer?.disconnect();
            });
        });

        effect(() => {
            const session = this.session();
            const last = session.messages[session.messages.length - 1];
            const tick = session.messages.length
                + (last?.content.length ?? 0)
                + (last?.reasoning?.length ?? 0);
            void tick;

            if (!this.pinnedToBottom()) return;
            requestAnimationFrame(() => {
                if (this.pinnedToBottom()) this.scrollToBottom();
            });
        });

        effect(() => {
            const sessionId = this.session().id;
            if (sessionId === this.lastSessionId) return;
            this.lastSessionId = sessionId;
            this.pinnedToBottom.set(true);
            requestAnimationFrame(() => this.scrollToBottom());
        });
    }

    scrollToBottom(): void {
        const element = this.messagesContainer()?.nativeElement;
        if (!element) return;
        this.pinnedToBottom.set(true);
        element.scrollTop = element.scrollHeight;
    }

    openSettings(): void {
        this.configStore.update('activeSessionId', this.session().id);
        this.ui.set('drawerOpen', true);
    }

    deleteMessage(messageId: string): void {
        this.sessionStore.deleteMessage(this.session().id, messageId);
    }

    continueMessage(messageId: string): void {
        void this.orchestrator.continueMessage(this.session().id, messageId);
    }

    retryMessage(messageId: string): void {
        void this.orchestrator.retry(this.session().id, messageId);
    }
}
