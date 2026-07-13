// src/app/features/chat/chat-column/chat-column.component.ts

import { Component, input, viewChild, ElementRef, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatSession } from '../../../models/chat.models';
import { ChatMessageComponent } from '../../../components/chat-message/chat-message.component';
import { LlmOrchestratorService } from '../../../core/services/llm-orchestrator.service';
import { SessionStore } from '../../../core/stores/session.store';

import { LucideMessageSquare } from '@lucide/angular';

@Component({
    selector: 'app-chat-column',
    imports: [CommonModule, ChatMessageComponent, LucideMessageSquare],
    templateUrl: './chat-column.component.html'
})
export class ChatColumnComponent {

    session = input.required<ChatSession>();
    isCompareMode = input<boolean>(false);

    private messagesContainerRef = viewChild<ElementRef<HTMLDivElement>>('messagesContainer');
    private orchestrator = inject(LlmOrchestratorService);
    private sessionStore = inject(SessionStore);

    constructor() {

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

    }

    deleteMessage(msgId: string) {
        this.sessionStore.deleteMessage(this.session().id, msgId);
    }

    continueMessage(msgId: string) {
        this.orchestrator.continueMessage(this.session().id, msgId);
    }

}
