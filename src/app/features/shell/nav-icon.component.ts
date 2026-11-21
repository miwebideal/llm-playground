// src/app/features/shell/nav-icon.component.ts

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideBox, LucideChartColumn, LucideInfo, LucideKeyRound, LucideMessageSquare, LucideSettings } from '@lucide/angular';
import { NavItem } from './nav.constants';

@Component({
    selector: 'app-nav-icon',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [LucideMessageSquare, LucideBox, LucideChartColumn, LucideKeyRound, LucideSettings, LucideInfo],
    template: `
        @switch (icon()) {
            @case ('chat') { <svg lucideMessageSquare class="w-4.5 h-4.5"></svg> }
            @case ('models') { <svg lucideBox class="w-4.5 h-4.5"></svg> }
            @case ('usage') { <svg lucideChartColumn class="w-4.5 h-4.5"></svg> }
            @case ('keys') { <svg lucideKeyRound class="w-4.5 h-4.5"></svg> }
            @case ('settings') { <svg lucideSettings class="w-4.5 h-4.5"></svg> }
            @case ('about') { <svg lucideInfo class="w-4.5 h-4.5"></svg> }
        }
    `,
    host: { class: 'inline-flex shrink-0' }
})
export class NavIconComponent {
    icon = input.required<NavItem['icon']>();
}
