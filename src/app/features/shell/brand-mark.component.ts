// src/app/features/shell/brand-mark.component.ts

import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
    selector: 'app-brand-mark',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `<img src="icon.svg" alt="" [width]="size()" [height]="size()" class="shrink-0 block">`,
    host: { class: 'inline-flex shrink-0' }
})
export class BrandMarkComponent {
    size = input(34);
}
