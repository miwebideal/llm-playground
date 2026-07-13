// src/app/features/sidebar/sidebar.component.ts

import { Component, signal, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalConfigStore } from '../../core/stores/global-config.store';
import { SessionStore } from '../../core/stores/session.store';
import { ToggleComponent } from '../../components/toggle/toggle.component';
import { SidebarConnectionComponent } from './sidebar-connection/sidebar-connection.component';
import { SidebarParametersComponent } from './sidebar-parameters/sidebar-parameters.component';
import { SidebarOptionsComponent } from './sidebar-options/sidebar-options.component';

import { LucideX, LucideSettings, LucideChevronRight, LucideChevronLeft, LucideExternalLink } from '@lucide/angular';

@Component({
    selector: 'app-sidebar',
    imports: [
        CommonModule, ToggleComponent,
        SidebarConnectionComponent, SidebarParametersComponent, SidebarOptionsComponent,
        LucideX, LucideSettings, LucideChevronRight, LucideChevronLeft, LucideExternalLink
    ],
    templateUrl: './sidebar.component.html'
})
export class SidebarComponent {

    isOpenMobile = input<boolean>(false);
    closeMobile = output<void>();

    isCollapsedDesktop = signal<boolean>(false);
    activeSessionId = signal<string>('session-a');

    private configStore = inject(GlobalConfigStore);
    private sessionStore = inject(SessionStore);

    readonly globalConfig = this.configStore.state;
    readonly sessions = this.sessionStore.sessions;

    toggleDesktop() {
        this.isCollapsedDesktop.update(v => !v);
    }

    updateGlobal(key: keyof ReturnType<typeof this.configStore.state>, value: any) {
        this.configStore.update({ [key]: value });
    }

}
