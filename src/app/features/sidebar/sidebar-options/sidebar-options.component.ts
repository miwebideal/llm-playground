// src/app/features/sidebar/sidebar-options/sidebar-options.component.ts

import { Component, inject } from '@angular/core';
import { GlobalConfigStore } from '../../../core/stores/global-config.store';
import { ToggleComponent } from '../../../components/toggle/toggle.component';

@Component({
    selector: 'app-sidebar-options',
    imports: [ToggleComponent],
    templateUrl: './sidebar-options.component.html'
})
export class SidebarOptionsComponent {

    private configStore = inject(GlobalConfigStore);
    readonly config = this.configStore.state;

    update(key: keyof ReturnType<typeof this.configStore.state>, value: any) {
        this.configStore.update({ [key]: value });
    }

}
