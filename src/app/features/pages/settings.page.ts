// src/app/features/pages/settings.page.ts

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GlobalConfig } from '../../core/models';
import { ModalService } from '../../core/services/modal.service';
import { ThemeService } from '../../core/services/theme.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfigStore } from '../../core/stores/config.store';
import { ProviderStore } from '../../core/stores/provider.store';
import { RunLogStore } from '../../core/stores/run-log.store';
import { SessionStore } from '../../core/stores/session.store';
import { ToggleComponent } from '../../components/toggle/toggle.component';

@Component({
    selector: 'app-settings-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ToggleComponent],
    templateUrl: './settings.page.html',
    host: { class: 'page' }
})
export class SettingsPage {

    readonly theme = inject(ThemeService);
    private configStore = inject(ConfigStore);
    private sessions = inject(SessionStore);
    private providers = inject(ProviderStore);
    private runLog = inject(RunLogStore);
    private modal = inject(ModalService);
    private toast = inject(ToastService);

    readonly config = this.configStore.state;

    set<K extends keyof GlobalConfig>(key: K, value: GlobalConfig[K]): void {
        this.configStore.update(key, value);
    }

    async clearChats(): Promise<void> {
        if (await this.confirm('Borrar todos los chats', 'Se borran los mensajes de ambas columnas.')) {
            this.sessions.clearMessages();
            this.toast.info('Chats borrados');
        }
    }

    async clearKeys(): Promise<void> {
        if (await this.confirm('Borrar todas las keys', 'Se eliminan las keys guardadas en este navegador.')) {
            this.providers.clearAllTokens();
            this.toast.info('Keys borradas');
        }
    }

    async clearUsage(): Promise<void> {
        if (await this.confirm('Borrar historial de uso', 'Se borran las métricas de todas las corridas.')) {
            this.runLog.clear();
            this.toast.info('Historial borrado');
        }
    }

    private confirm(title: string, message: string): Promise<boolean> {
        return this.modal.confirm({ title, message: `${message} No se puede deshacer.`, confirmText: 'Borrar', isDanger: true });
    }
}
