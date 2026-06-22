// src/app/components/toggle/toggle.component.ts

import { Component, input, output } from '@angular/core';

@Component({
    selector: 'app-toggle',
    templateUrl: './toggle.component.html'
})
export class ToggleComponent {

    checked = input<boolean>(false);

    checkedChange = output<boolean>();

    onToggle(event: Event) {
        const isChecked = (event.target as HTMLInputElement).checked;
        this.checkedChange.emit(isChecked);
    }

}
