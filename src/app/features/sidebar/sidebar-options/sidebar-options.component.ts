// src/app/features/sidebar/sidebar-options/sidebar-options.component.ts

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GlobalConfig } from '../../../core/models';
import { ConfigStore } from '../../../core/stores/config.store';
import { ToggleComponent } from '../../../components/toggle/toggle.component';

@Component({
    selector: 'app-sidebar-options',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ToggleComponent],
    templateUrl: './sidebar-options.component.html'
})
export class SidebarOptionsComponent {

    private configStore = inject(ConfigStore);
    readonly config = this.configStore.state;

    update<K extends keyof GlobalConfig>(key: K, value: GlobalConfig[K]): void {
        this.configStore.update(key, value);
    }
}
