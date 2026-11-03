// src/app/features/sidebar/sidebar-parameters/sidebar-parameters.component.ts

import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ChatSession, DEFAULT_SESSION_SETTINGS } from '../../../core/models';
import { ModelRegistryService } from '../../../core/registry/model-registry.service';
import { SessionStore } from '../../../core/stores/session.store';
import { ModalService } from '../../../core/services/modal.service';
import { ToastService } from '../../../core/services/toast.service';
import { ToggleComponent } from '../../../components/toggle/toggle.component';
import { LucideRotateCcw, LucideTriangleAlert } from '@lucide/angular';

@Component({
    selector: 'app-sidebar-parameters',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ToggleComponent, LucideRotateCcw, LucideTriangleAlert],
    templateUrl: './sidebar-parameters.component.html'
})
export class SidebarParametersComponent {

    sessionId = input.required<string>();

    private sessionStore = inject(SessionStore);
    private registry = inject(ModelRegistryService);
    private modalService = inject(ModalService);
    private toast = inject(ToastService);

    readonly session = computed(() => {
        const id = this.sessionId();
        return this.sessionStore.sessions().find(session => session.id === id)
            ?? this.sessionStore.sessions()[0];
    });

    readonly capabilities = computed(() => {
        const session = this.session();
        return session ? this.registry.capabilities(session) : null;
    });

    readonly tokenLabel = computed(() => {
        const caps = this.capabilities();
        return caps ? this.registry.tokenLimitLabel(caps.tokenLimit) : 'Max tokens';
    });

    readonly restrictedLabels = computed(() => {
        const caps = this.capabilities();
        return caps ? this.registry.restrictedParamLabels(caps) : [];
    });

    update<K extends keyof ChatSession>(key: K, value: ChatSession[K]): void {
        this.sessionStore.updateSession(this.sessionId(), { [key]: value } as Partial<ChatSession>);
    }

    onNumber(key: 'temperature' | 'topP' | 'maxTokens', event: Event): void {
        const value = (event.target as HTMLInputElement).valueAsNumber;
        if (Number.isFinite(value)) this.update(key, value);
    }

    onSystemPrompt(event: Event): void {
        this.update('systemPrompt', (event.target as HTMLTextAreaElement).value);
    }

    async resetSettings(): Promise<void> {
        const confirmed = await this.modalService.confirm({
            title: 'Restablecer parámetros',
            message: '¿Volver a los valores por defecto para esta sesión?',
            confirmText: 'Restablecer'
        });
        if (!confirmed) return;

        this.sessionStore.updateSession(this.sessionId(), { ...DEFAULT_SESSION_SETTINGS });
        this.toast.success('Parámetros restablecidos');
    }
}
