// src/app/features/sidebar/sidebar-connection/sidebar-connection.component.ts

import { Component, computed, inject, input, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SessionStore } from '../../../core/stores/session.store';
import { ProviderStore } from '../../../core/stores/provider.store';
import { AI_MODELS } from '../../../constants/models.constants';

import { LucideEye, LucideEyeOff } from '@lucide/angular';

@Component({
    selector: 'app-sidebar-connection',
    imports: [CommonModule, FormsModule, LucideEye, LucideEyeOff],
    templateUrl: './sidebar-connection.component.html'
})
export class SidebarConnectionComponent {

    sessionId = input.required<string>();

    private sessionStore = inject(SessionStore);
    private providerStore = inject(ProviderStore);

    session = computed(() => this.sessionStore.sessions().find(s => s.id === this.sessionId())!);
    providers = this.providerStore.providers;
    activeProvider = computed(() => this.providers().find(p => p.id === this.session().providerId));

    showToken = signal(false);
    forceManualModel = signal(false);

    constructor() {
        effect(() => {
            this.sessionId();
            this.forceManualModel.set(false);
        }, { allowSignalWrites: true });
    }

    private modelKeys: Record<string, string> = {
        'openai': 'OpenAI', 'deepinfra': 'DeepInfra', 'fireworks': 'Fireworks AI',
        'gemini': 'Gemini', 'openrouter': 'OpenRouter', 'groq': 'Groq', 'together': 'Together AI'
    };

    availableModels = computed(() => {
        const provId = this.session().providerId;
        const key = this.modelKeys[provId];
        return key ? AI_MODELS[key] || [] : [];
    });

    get modelSelectValue(): string {
        if (this.forceManualModel()) return 'manual';
        const currentModel = this.session().model;
        if (!currentModel) return '';
        const exists = this.availableModels().some(m => m.id === currentModel);
        return exists ? currentModel : 'manual';
    }

    set modelSelectValue(val: string) {
        if (val === 'manual') {
            this.forceManualModel.set(true);
        } else {
            this.forceManualModel.set(false);
            this.sessionStore.updateSession(this.sessionId(), { model: val });
        }
    }

    onProviderChange(val: string) {
        this.sessionStore.updateSession(this.sessionId(), { providerId: val, model: '' });
        this.forceManualModel.set(false);
    }

    updateProviderToken(value: string) {
        this.providerStore.updateProvider(this.session().providerId, { apiToken: value });
    }

    updateProviderUrl(value: string) {
        this.providerStore.updateProvider(this.session().providerId, { apiUrl: value });
    }

    updateSessionModel(value: string) {
        this.sessionStore.updateSession(this.sessionId(), { model: value });
    }

}
