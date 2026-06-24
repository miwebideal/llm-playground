// src/app/components/sidebar/sidebar.component.ts

import { Component, output, signal, computed, inject, OnInit, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigStore } from '../../stores/config.store';
import { ToastService } from '../../services/toast.service';
import { ModalService } from '../../services/modal.service';
import { ToggleComponent } from '../toggle/toggle.component';
import { API_PRESET_KEYS, API_PRESETS, AI_MODELS } from '../../utils/chat.constants';

import { LucideEye, LucideEyeOff, LucideX, LucideRotateCcw } from '@lucide/angular';

@Component({
    selector: 'app-sidebar',
    imports: [CommonModule, ToggleComponent, LucideEye, LucideEyeOff, LucideX, LucideRotateCcw],
    templateUrl: './sidebar.component.html'
})
export class SidebarComponent implements OnInit {

    isOpen = input<boolean>(false);
    closeSidebar = output<void>();
    showToken = signal(false);

    private configStore = inject(ConfigStore);
    toast = inject(ToastService);
    configTab = signal<'a' | 'b'>('a');
    private modalService = inject(ModalService);

    readonly config = this.configStore.state;
    readonly presetKeys = API_PRESET_KEYS;

    readonly aiModels = AI_MODELS;
    readonly modelGroups = Object.keys(AI_MODELS);

    isManualA = signal(false);
    isManualB = signal(false);

    readonly isManualMode = computed(() =>
        this.configTab() === 'a' ? this.isManualA() : this.isManualB()
    );

    readonly dropdownValue = computed(() => {
        if (this.isManualMode()) return 'manual';
        return this.configTab() === 'a' ? this.config().model : this.config().modelB;
    });

    ngOnInit() {
        const allModels = Object.values(this.aiModels).flat();
        this.isManualA.set(!!this.config().model && !allModels.includes(this.config().model));
        this.isManualB.set(!!this.config().modelB && !allModels.includes(this.config().modelB));
    }

    onModelSelect(event: Event) {
        const val = (event.target as HTMLSelectElement).value;
        const isA = this.configTab() === 'a';

        if (val === 'manual') {
            isA ? this.isManualA.set(true) : this.isManualB.set(true);
        } else {
            if (isA) {
                this.isManualA.set(false);
                this.updateModel(val);
            } else {
                this.isManualB.set(false);
                this.updateModelB(val);
            }
        }
    }

    hasConfig(): boolean { return this.configStore.isReady(); }
    updateApiUrl(value: string) { this.configStore.update({ apiUrl: value.trim() }); }
    updateApiToken(value: string) { this.configStore.update({ apiToken: value.trim() }); }
    updateModel(value: string) { this.configStore.update({ model: value.trim() }); }
    updateTemperature(value: number) { const num = isNaN(value) ? 0.7 : Math.max(0, Math.min(2, value)); this.configStore.update({ temperature: num }); }
    updateMaxTokens(value: number) { const num = isNaN(value) ? 2048 : Math.max(1, Math.floor(value)); this.configStore.update({ maxTokens: num }); }
    updateSystemPrompt(value: string) { this.configStore.update({ systemPrompt: value }); }
    updateApiUrlB(value: string) { this.configStore.update({ apiUrlB: value.trim() }); }
    updateApiTokenB(value: string) { this.configStore.update({ apiTokenB: value.trim() }); }
    updateModelB(value: string) { this.configStore.update({ modelB: value.trim() }); }
    updateUseParams(value: boolean) { this.configStore.update({ useParams: value }); }

    onTokenFocus(event: FocusEvent) {
        const input = event.target as HTMLInputElement;
        input.setAttribute('readonly', 'readonly');
        setTimeout(() => input.removeAttribute('readonly'), 100);
    }

    setPreset(provider: string) {
        const preset = API_PRESETS[provider];
        if (preset) {
            if (this.configTab() === 'a') {
                this.configStore.update({ apiUrl: preset.apiUrl });
            } else {
                this.configStore.update({ apiUrlB: preset.apiUrl });
            }
            this.toast.info(`Preset ${provider} cargado en Modelo ${this.configTab().toUpperCase()}`);
        }
    }

    async resetSettings() {
        const confirmed = await this.modalService.confirm({
            title: 'Restablecer parámetros',
            message: '¿Estás seguro de que querés volver a los valores por defecto (Temperatura, Max Tokens, etc)?',
            confirmText: 'Restablecer',
            isDanger: false
        });

        if (confirmed) {
            this.configStore.resetParams();
            this.toast.success('Parámetros restablecidos');
        }
    }

    updateIsCompareMode(value: boolean) {
        this.configStore.update({ isCompareMode: value });
        if (!value) this.configTab.set('a');
    }
}
