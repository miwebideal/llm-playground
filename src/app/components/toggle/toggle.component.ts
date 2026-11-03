// src/app/components/toggle/toggle.component.ts

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
    selector: 'app-toggle',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './toggle.component.html'
})
export class ToggleComponent {

    checked = input<boolean>(false);
    disabled = input<boolean>(false);

    checkedChange = output<boolean>();

    onToggle(event: Event): void {
        const target = event.target as HTMLInputElement;
        this.checkedChange.emit(target.checked);
    }
}
