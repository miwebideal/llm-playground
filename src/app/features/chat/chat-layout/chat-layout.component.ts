// src/app/features/chat/chat-layout/chat-layout.component.ts

import { Component, HostListener, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionStore } from '../../../core/stores/session.store';
import { GlobalConfigStore } from '../../../core/stores/global-config.store';
import { ChatColumnComponent } from '../chat-column/chat-column.component';

@Component({
    selector: 'app-chat-layout',
    imports: [CommonModule, ChatColumnComponent],
    templateUrl: './chat-layout.component.html'
})
export class ChatLayoutComponent {

    sessionStore = inject(SessionStore);
    configStore = inject(GlobalConfigStore);

    leftColumnWidth = signal<number>(50);
    isDragging = signal(false);
    activeMobileTab = signal<number>(0);

    get activeSessions() {
        const all = this.sessionStore.sessions();
        return this.configStore.state().isCompareMode ? all.slice(0, 2) : [all[0]];
    }

    onDragStart(event: MouseEvent) {
        this.isDragging.set(true);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }

    @HostListener('window:mousemove', ['$event'])
    onDrag(event: MouseEvent) {
        if (!this.isDragging()) return;
        const container = document.getElementById('compare-container');
        if (!container) return;
        const rect = container.getBoundingClientRect();
        let newWidth = ((event.clientX - rect.left) / rect.width) * 100;
        this.leftColumnWidth.set(Math.max(20, Math.min(80, newWidth)));
    }

    @HostListener('window:mouseup')
    onDragEnd() {
        if (this.isDragging()) {
            this.isDragging.set(false);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    }

}
