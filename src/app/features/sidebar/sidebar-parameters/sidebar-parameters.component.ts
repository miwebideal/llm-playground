// src/app/features/sidebar/sidebar-parameters/sidebar-parameters.component.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalConfigStore } from '../../../core/stores/global-config.store';
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

    private configStore = inject(GlobalConfigStore);
    private modalService = inject(ModalService);
    private toast = inject(ToastService);

    readonly config = this.configStore.state;

    update(key: keyof ReturnType<typeof this.configStore.state>, value: any) {
        this.configStore.update({ [key]: value });
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
