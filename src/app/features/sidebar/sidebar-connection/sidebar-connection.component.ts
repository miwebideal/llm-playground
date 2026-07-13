// src/app/features/sidebar/sidebar-connection/sidebar-connection.component.ts

import { Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionStore } from '../../../core/stores/session.store';
import { API_PRESETS, API_PRESET_KEYS, AI_MODELS } from '../../../constants/models.constants';

import { LucideEye, LucideEyeOff } from '@lucide/angular';

@Component({
    selector: 'app-sidebar-connection',
    imports: [CommonModule, LucideEye, LucideEyeOff],
    templateUrl: './sidebar-connection.component.html'
})
export class SidebarConnectionComponent {

    sessionId = input.required<string>();
    private sessionStore = inject(SessionStore);

    session = computed(() => this.sessionStore.sessions().find(s => s.id === this.sessionId())!);

    presetKeys = API_PRESET_KEYS;
    modelGroups = Object.keys(AI_MODELS);
    aiModels = AI_MODELS;

    showToken = signal(false);
    forceManualApi = signal(false);
    forceManualModel = signal(false);

    apiUrlSelectValue = computed(() => {
        if (this.forceManualApi()) return 'manual';
        const currentUrl = this.session().apiUrl;
        const preset = Object.entries(API_PRESETS).find(([k, v]) => v.apiUrl === currentUrl);
        return preset ? preset[0] : 'manual';
    });

    modelSelectValue = computed(() => {
        if (this.forceManualModel()) return 'manual';
        const currentModel = this.session().model;
        const allModels = Object.values(AI_MODELS).flat();
        return allModels.includes(currentModel) ? currentModel : 'manual';
    });

    onApiUrlSelect(event: Event) {
        const val = (event.target as HTMLSelectElement).value;
        if (val === 'manual') {
            this.forceManualApi.set(true);
        } else {
            this.forceManualApi.set(false);
            this.sessionStore.updateSession(this.sessionId(), { apiUrl: API_PRESETS[val].apiUrl, provider: val });
        }
    }

    onModelSelect(event: Event) {
        const val = (event.target as HTMLSelectElement).value;
        if (val === 'manual') {
            this.forceManualModel.set(true);
        } else {
            this.forceManualModel.set(false);
            this.sessionStore.updateSession(this.sessionId(), { model: val });
        }
    }

    updateSession(key: 'apiUrl' | 'apiToken' | 'model', value: string) {
        this.sessionStore.updateSession(this.sessionId(), { [key]: value });
    }

}
