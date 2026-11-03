// src/app/features/chat/chat-layout/chat-layout.component.ts

import { ChangeDetectionStrategy, Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { ChatColumnComponent } from '../chat-column/chat-column.component';
import { ConfigStore } from '../../../core/stores/config.store';
import { ProviderStore } from '../../../core/stores/provider.store';
import { SessionStore } from '../../../core/stores/session.store';
import { activeSessions } from '../../../core/state/session.selectors';

const MIN_WIDTH = 20;
const MAX_WIDTH = 80;

@Component({
    selector: 'app-chat-layout',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ChatColumnComponent],
    templateUrl: './chat-layout.component.html'
})
export class ChatLayoutComponent {

    sessionStore = inject(SessionStore);
    configStore = inject(ConfigStore);
    private providerStore = inject(ProviderStore);

    readonly dragging = signal(false);
    private readonly dragWidth = signal<number | null>(null);
    readonly activeMobileTab = signal(0);

    readonly activeSessions = computed(() => activeSessions(
        this.sessionStore.sessions(),
        this.configStore.state(),
        this.providerStore.providers()
    ));

    readonly leftColumnWidth = computed(() => this.dragWidth() ?? this.configStore.state().splitWidth);

    readonly compareNotice = computed(() => {
        const config = this.configStore.state();
        if (!config.isCompareMode) return null;
        const sessions = this.sessionStore.sessions();
        if (sessions.length < 2) return null;
        const active = this.activeSessions();
        if (active.length >= 2) return null;
        if (active.length === 0) return 'Ninguna ventana tiene proveedor, token y modelo configurados.';
        const missing = sessions.find(session => session.id !== active[0].id);
        return `${missing?.name ?? 'La otra ventana'} no está configurada. Se muestra sólo ${active[0].name}.`;
    });

    constructor() {
        effect(() => {
            const count = this.activeSessions().length;
            if (count > 0 && this.activeMobileTab() >= count) this.activeMobileTab.set(0);
        });
    }

    onDragStart(event: PointerEvent): void {
        event.preventDefault();
        this.dragging.set(true);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }

    @HostListener('window:pointermove', ['$event'])
    onDrag(event: PointerEvent): void {
        if (!this.dragging()) return;
        const container = document.getElementById('compare-container');
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const percent = ((event.clientX - rect.left) / rect.width) * 100;
        this.dragWidth.set(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, percent)));
    }

    @HostListener('window:pointerup')
    onDragEnd(): void {
        if (!this.dragging()) return;
        this.dragging.set(false);
        const width = this.dragWidth();
        if (width !== null) this.configStore.update('splitWidth', Math.round(width));
        this.dragWidth.set(null);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }

    onSeparatorKeydown(event: KeyboardEvent): void {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        const delta = event.key === 'ArrowLeft' ? -2 : 2;
        const next = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, this.configStore.state().splitWidth + delta));
        this.configStore.update('splitWidth', next);
    }
}
