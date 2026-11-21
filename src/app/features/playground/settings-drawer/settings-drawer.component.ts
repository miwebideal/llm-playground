// src/app/features/playground/settings-drawer/settings-drawer.component.ts

import { ChangeDetectionStrategy, Component, HostListener, computed, effect, inject } from '@angular/core';
import { LucideX } from '@lucide/angular';
import { GlobalConfig } from '../../../core/models';
import { ModelRegistryService } from '../../../core/registry/model-registry.service';
import { ConfigStore } from '../../../core/stores/config.store';
import { SessionStore } from '../../../core/stores/session.store';
import { UiStore } from '../../../core/stores/ui.store';
import { ToggleComponent } from '../../../components/toggle/toggle.component';
import { SettingsConnectionComponent } from '../settings-connection/settings-connection.component';
import { SettingsParamsComponent } from '../settings-params/settings-params.component';

@Component({
    selector: 'app-settings-drawer',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ToggleComponent, SettingsConnectionComponent, SettingsParamsComponent, LucideX],
    templateUrl: './settings-drawer.component.html'
})
export class SettingsDrawerComponent {

    private configStore = inject(ConfigStore);
    private sessionStore = inject(SessionStore);
    private registry = inject(ModelRegistryService);
    readonly ui = inject(UiStore);

    readonly config = this.configStore.state;
    readonly columns = computed(() => this.sessionStore.sessions().slice(0, this.config().isCompareMode ? 2 : 1));
    readonly activeId = computed(() => {
        const id = this.config().activeSessionId;
        return this.columns().some(s => s.id === id) ? id : this.columns()[0]?.id ?? '';
    });

    constructor() {
        effect(() => {
            const id = this.activeId();
            if (id && id !== this.config().activeSessionId) this.configStore.update('activeSessionId', id);
        });
    }

    tabLabel(index: number): string {
        const session = this.columns()[index];
        const name = session?.model ? this.registry.resolve(session).label : 'sin modelo';
        return `${index === 0 ? 'A' : 'B'} · ${name}`;
    }

    select(id: string): void {
        this.configStore.update('activeSessionId', id);
    }

    setOption<K extends keyof GlobalConfig>(key: K, value: GlobalConfig[K]): void {
        this.configStore.update(key, value);
    }

    close(): void {
        this.ui.set('drawerOpen', false);
    }

    @HostListener('document:keydown.escape')
    onEscape(): void {
        if (this.ui.state().drawerOpen) this.close();
    }
}
