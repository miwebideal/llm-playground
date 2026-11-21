// src/app/features/playground/settings-params/settings-params.component.ts

import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { LucideRotateCcw } from '@lucide/angular';
import { ChatSession, DEFAULT_SESSION_SETTINGS } from '../../../core/models';
import { ModelRegistryService } from '../../../core/registry/model-registry.service';
import { ConfigStore } from '../../../core/stores/config.store';
import { SessionStore } from '../../../core/stores/session.store';
import { UiStore } from '../../../core/stores/ui.store';
import { ToastService } from '../../../core/services/toast.service';
import { ToggleComponent } from '../../../components/toggle/toggle.component';

type ParamKey = 'useParams' | 'temperature' | 'topP' | 'maxTokens' | 'jsonMode' | 'systemPrompt';

@Component({
    selector: 'app-settings-params',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ToggleComponent, LucideRotateCcw],
    templateUrl: './settings-params.component.html'
})
export class SettingsParamsComponent {

    sessionId = input.required<string>();

    private sessionStore = inject(SessionStore);
    private configStore = inject(ConfigStore);
    private ui = inject(UiStore);
    private registry = inject(ModelRegistryService);
    private toast = inject(ToastService);

    readonly session = computed(() => {
        const id = this.sessionId();
        return this.sessionStore.sessions().find(session => session.id === id) ?? this.sessionStore.sessions()[0];
    });

    readonly capabilities = computed(() => {
        const session = this.session();
        return session ? this.registry.capabilities(session) : null;
    });

    readonly tokenLabel = computed(() => {
        const caps = this.capabilities();
        return caps ? this.registry.tokenLimitLabel(caps.tokenLimit) : 'Max tokens';
    });

    private targets(): string[] {
        const sessions = this.sessionStore.sessions();
        const synced = this.configStore.state().isCompareMode && this.ui.state().syncParams;
        return synced ? sessions.slice(0, 2).map(s => s.id) : [this.sessionId()];
    }

    update<K extends ParamKey>(key: K, value: ChatSession[K]): void {
        for (const id of this.targets()) {
            this.sessionStore.updateSession(id, { [key]: value } as Partial<ChatSession>);
        }
    }

    onNumber(key: 'temperature' | 'topP' | 'maxTokens', event: Event): void {
        const value = (event.target as HTMLInputElement).valueAsNumber;
        if (Number.isFinite(value)) this.update(key, value);
    }

    onSystemPrompt(event: Event): void {
        this.update('systemPrompt', (event.target as HTMLTextAreaElement).value);
    }

    reset(): void {
        for (const id of this.targets()) this.sessionStore.updateSession(id, { ...DEFAULT_SESSION_SETTINGS });
        this.toast.success('Parámetros restablecidos');
    }
}
