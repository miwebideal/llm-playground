// src/app/features/playground/chat/chat-layout/chat-layout.component.ts

import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ChatColumnComponent } from '../chat-column/chat-column.component';
import { ModelRegistryService } from '../../../../core/registry/model-registry.service';
import { ConfigStore } from '../../../../core/stores/config.store';
import { SessionStore } from '../../../../core/stores/session.store';

@Component({
    selector: 'app-chat-layout',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ChatColumnComponent],
    templateUrl: './chat-layout.component.html',
    host: { class: 'flex flex-col min-h-0' }
})
export class ChatLayoutComponent {

    private sessionStore = inject(SessionStore);
    private configStore = inject(ConfigStore);
    private registry = inject(ModelRegistryService);

    readonly activeMobileTab = signal(0);

    /** En modo dividido mostramos siempre las dos columnas (aunque una falte configurar). */
    readonly columns = computed(() => {
        const sessions = this.sessionStore.sessions();
        return this.configStore.state().isCompareMode ? sessions.slice(0, 2) : sessions.slice(0, 1);
    });

    label(index: number): string {
        const session = this.columns()[index];
        return session?.model ? this.registry.resolve(session).label : `Modelo ${index === 0 ? 'A' : 'B'}`;
    }

    constructor() {
        effect(() => {
            const count = this.columns().length;
            if (this.activeMobileTab() >= count) this.activeMobileTab.set(0);
        });
    }
}
