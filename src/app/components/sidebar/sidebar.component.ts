// src/app/components/sidebar/sidebar.component.ts

import { Component, output, signal, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigStore } from '../../stores/config.store';
import { ToastService } from '../../services/toast.service';
import { LucideEye, LucideEyeOff, LucideHistory, LucideActivity, LucideX, LucideRotateCcw } from '@lucide/angular';

@Component({
    selector: 'app-sidebar',
    imports: [CommonModule, LucideEye, LucideEyeOff, LucideHistory, LucideActivity, LucideX, LucideRotateCcw],
    templateUrl: './sidebar.component.html'
})
export class SidebarComponent {

    private configStore = inject(ConfigStore);
    toast = inject(ToastService);

    isOpen = input<boolean>(false);
    closeSidebar = output<void>();
    showToken = signal(false);

    readonly config = this.configStore.state;

    onTokenFocus(event: FocusEvent) {
        const input = event.target as HTMLInputElement;
        input.setAttribute('readonly', 'readonly');
        setTimeout(() => input.removeAttribute('readonly'), 100);
    }

    hasConfig(): boolean {
        return this.configStore.isReady();
    }

    updateApiUrl(value: string) {
        this.configStore.update({ apiUrl: value.trim() });
    }

    updateApiToken(value: string) {
        this.configStore.update({ apiToken: value });
    }

    updateModel(value: string) {
        this.configStore.update({ model: value.trim() });
    }

    updateTemperature(value: number) {
        const num = isNaN(value) ? 0.7 : Math.max(0, Math.min(2, value));
        this.configStore.update({ temperature: num });
    }

    updateMaxTokens(value: number) {
        const num = isNaN(value) ? 2048 : Math.max(1, Math.floor(value));
        this.configStore.update({ maxTokens: num });
    }

    updateSystemPrompt(value: string) {
        this.configStore.update({ systemPrompt: value });
    }

    updateIncludeHistory(value: boolean) {
        this.configStore.update({ includeHistory: value });
    }

    updateStreamMode(value: boolean) {
        this.configStore.update({ streamMode: value });
    }

    setPreset(provider: string) {
        const presets: Record<string, { apiUrl: string }> = {
            deepinfra: { apiUrl: 'https://api.deepinfra.com/v1/openai/chat/completions' },
            fireworks: { apiUrl: 'https://api.fireworks.ai/inference/v1/chat/completions' },
            gemini: { apiUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions' },
            openrouter: { apiUrl: 'https://openrouter.ai/api/v1/chat/completions' },
            groq: { apiUrl: 'https://api.groq.com/openai/v1/chat/completions' },
            together: { apiUrl: 'https://api.together.xyz/v1/chat/completions' },
        };

        if (presets[provider]) {
            this.configStore.update(presets[provider]);
            this.toast.info(`Preset ${provider} cargado`);
        }
    }

    resetSettings() {
        if (confirm('¿Restablecer parámetros a sus valores por defecto?')) {
            this.configStore.resetParams();
            this.toast.success('Parámetros restablecidos');
        }
    }
    
}