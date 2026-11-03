// src/app/features/sidebar/sidebar.component.ts

import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { ConfigStore } from '../../core/stores/config.store';
import { SessionStore } from '../../core/stores/session.store';
import { GlobalConfig } from '../../core/models';
import { ToggleComponent } from '../../components/toggle/toggle.component';
import { SidebarConnectionComponent } from './sidebar-connection/sidebar-connection.component';
import { SidebarParametersComponent } from './sidebar-parameters/sidebar-parameters.component';
import { SidebarOptionsComponent } from './sidebar-options/sidebar-options.component';
import { LucideX, LucideSettings, LucideChevronLeft, LucideExternalLink } from '@lucide/angular';

@Component({
    selector: 'app-sidebar',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ToggleComponent,
        SidebarConnectionComponent, SidebarParametersComponent, SidebarOptionsComponent,
        LucideX, LucideSettings, LucideChevronLeft, LucideExternalLink
    ],
    templateUrl: './sidebar.component.html'
})
export class SidebarComponent {

    isOpenMobile = input<boolean>(false);
    closeMobile = output<void>();

    readonly isCollapsedDesktop = signal(false);

    private configStore = inject(ConfigStore);
    private sessionStore = inject(SessionStore);

    readonly globalConfig = this.configStore.state;
    readonly sessions = this.sessionStore.sessions;
    readonly activeSessionId = computed(() => this.configStore.state().activeSessionId);

    constructor() {
        effect(() => {
            const sessions = this.sessions();
            const current = this.activeSessionId();
            if (sessions.length && !sessions.some(session => session.id === current)) {
                this.configStore.update('activeSessionId', sessions[0].id);
            }
        });
    }

    toggleDesktop(): void {
        this.isCollapsedDesktop.update(value => !value);
    }

    setActiveSession(id: string): void {
        this.configStore.update('activeSessionId', id);
    }

    updateGlobal<K extends keyof GlobalConfig>(key: K, value: GlobalConfig[K]): void {
        this.configStore.update(key, value);
    }
}
