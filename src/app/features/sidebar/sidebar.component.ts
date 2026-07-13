// src/app/features/sidebar/sidebar.component.ts

import { Component, signal, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalConfigStore } from '../../core/stores/global-config.store';
import { SessionStore } from '../../core/stores/session.store';
import { ToastService } from '../../core/services/toast.service';
import { ToggleComponent } from '../../components/toggle/toggle.component';
import { API_PRESET_KEYS, API_PRESETS, AI_MODELS } from '../../constants/models.constants';
import { ModalService } from '../../core/services/modal.service';

import { LucideEye, LucideEyeOff, LucideX, LucideRotateCcw, LucideSettings, LucideChevronRight, LucideChevronLeft } from '@lucide/angular';

@Component({
    selector: 'app-sidebar',
    imports: [CommonModule, ToggleComponent, LucideEye, LucideEyeOff, LucideX, LucideRotateCcw, LucideSettings, LucideChevronRight, LucideChevronLeft],
    templateUrl: './sidebar.component.html'
})
export class SidebarComponent {

    isOpenMobile = input<boolean>(false);
    closeMobile = output<void>();

    isCollapsedDesktop = signal<boolean>(false);
    showToken = signal(false);
    activeSessionId = signal<string>('session-a');

    private configStore = inject(GlobalConfigStore);
    private sessionStore = inject(SessionStore);
    private toast = inject(ToastService);
    private modalService = inject(ModalService);

    readonly globalConfig = this.configStore.state;
    readonly sessions = this.sessionStore.sessions;

    readonly activeSession = computed(() =>
        this.sessions().find(s => s.id === this.activeSessionId()) || this.sessions()[0]
    );

    readonly presetKeys = API_PRESET_KEYS;
    readonly aiModels = AI_MODELS;
    readonly modelGroups = Object.keys(AI_MODELS);

    readonly currentModels = computed(() => this.aiModels[this.activeSession().provider] || []);

    toggleDesktop() {
        this.isCollapsedDesktop.update(v => !v);
    }

    updateGlobal(key: keyof ReturnType<typeof this.configStore.state>, value: any) {
        this.configStore.update({ [key]: value });
    }

    updateSession(key: keyof ReturnType<typeof this.activeSession>, value: any) {
        this.sessionStore.updateSession(this.activeSessionId(), { [key]: value });
    }

    onProviderSelect(event: Event) {
        const val = (event.target as HTMLSelectElement).value;
        this.updateSession('provider', val);
        this.updateSession('model', this.aiModels[val][0]);
    }

    onModelSelect(event: Event) {
        const val = (event.target as HTMLSelectElement).value;
        this.updateSession('model', val);
    }

    setPreset(provider: string) {
        const preset = API_PRESETS[provider];
        if (preset) {
            this.updateSession('apiUrl', preset.apiUrl);
            this.toast.info(`Preset ${provider} cargado`);
        }
    }

    async resetSettings() {
        const confirmed = await this.modalService.confirm({
            title: 'Restablecer parámetros',
            message: '¿Volver a los valores por defecto?',
            confirmText: 'Restablecer'
        });
        if (confirmed) {
            this.configStore.resetParams();
            this.toast.success('Parámetros restablecidos');
        }
    }

}
