// src/app/features/sidebar/sidebar-connection/sidebar-connection.component.ts

import { Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionStore } from '../../../core/stores/session.store';
import { ProviderStore } from '../../../core/stores/provider.store';
import { AI_MODELS } from '../../../constants/models.constants';

import { LucideEye, LucideEyeOff } from '@lucide/angular';

@Component({
    selector: 'app-sidebar-connection',
    imports: [CommonModule, LucideEye, LucideEyeOff],
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

    // Mapeo simple para conectar el ID del proveedor con la lista de modelos
    private modelKeys: Record<string, string> = {
        'openai': 'OpenAI', 'deepinfra': 'DeepInfra', 'fireworks': 'Fireworks AI',
        'gemini': 'Gemini', 'openrouter': 'OpenRouter', 'groq': 'Groq', 'together': 'Together AI'
    };

    availableModels = computed(() => {
        const provId = this.session().providerId;
        const key = this.modelKeys[provId];
        return key ? AI_MODELS[key] || [] : [];
    });

    modelSelectValue = computed(() => {
        if (this.forceManualModel()) return 'manual';
        const currentModel = this.session().model;
        const exists = this.availableModels().some(m => m.id === currentModel);
        return exists ? currentModel : 'manual';
    });

    onProviderSelect(event: Event) {
        const val = (event.target as HTMLSelectElement).value;
        this.sessionStore.updateSession(this.sessionId(), { providerId: val, model: '' });
        this.forceManualModel.set(false);
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

    updateProviderToken(value: string) {
        const provId = this.session().providerId;
        this.providerStore.updateProvider(provId, { apiToken: value });
    }

    updateProviderUrl(value: string) {
        const provId = this.session().providerId;
        this.providerStore.updateProvider(provId, { apiUrl: value });
    }

    updateSessionModel(value: string) {
        this.sessionStore.updateSession(this.sessionId(), { model: value });
    }
}
