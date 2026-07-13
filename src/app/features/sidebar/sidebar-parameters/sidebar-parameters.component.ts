// src/app/features/sidebar/sidebar-parameters/sidebar-parameters.component.ts

import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionStore } from '../../../core/stores/session.store';
import { ModalService } from '../../../core/services/modal.service';
import { ToastService } from '../../../core/services/toast.service';
import { ToggleComponent } from '../../../components/toggle/toggle.component';

import { LucideRotateCcw } from '@lucide/angular';

@Component({
    selector: 'app-sidebar-parameters',
    imports: [CommonModule, ToggleComponent, LucideRotateCcw],
    templateUrl: './sidebar-parameters.component.html'
})
export class SidebarParametersComponent {

    sessionId = input.required<string>();

    private sessionStore = inject(SessionStore);
    private modalService = inject(ModalService);
    private toast = inject(ToastService);

    session = computed(() => this.sessionStore.sessions().find(s => s.id === this.sessionId())!);

    update(key: 'useParams' | 'temperature' | 'maxTokens' | 'systemPrompt', value: any) {
        this.sessionStore.updateSession(this.sessionId(), { [key]: value });
    }

    async resetSettings() {
        const confirmed = await this.modalService.confirm({
            title: 'Restablecer parámetros',
            message: '¿Volver a los valores por defecto para esta sesión?',
            confirmText: 'Restablecer'
        });
        if (confirmed) {
            this.sessionStore.updateSession(this.sessionId(), {
                useParams: true,
                temperature: 0.7,
                maxTokens: 8192,
                systemPrompt: 'You are a helpful assistant.'
            });
            this.toast.success('Parámetros restablecidos');
        }
    }

}
