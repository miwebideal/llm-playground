// src/app/features/shell/shell.component.ts

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideMoon, LucidePin, LucidePinOff, LucideSun } from '@lucide/angular';
import { ThemeService } from '../../core/services/theme.service';
import { UiStore } from '../../core/stores/ui.store';
import { BrandMarkComponent } from './brand-mark.component';
import { GithubIconComponent } from './github-icon.component';
import { NavIconComponent } from './nav-icon.component';
import { NAV_ITEMS, REPO_URL } from './nav.constants';

@Component({
    selector: 'app-shell',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        RouterOutlet, RouterLink, RouterLinkActive,
        BrandMarkComponent, GithubIconComponent, NavIconComponent,
        LucideSun, LucideMoon, LucidePin, LucidePinOff
    ],
    templateUrl: './shell.component.html',
    host: { class: 'block h-dvh' }
})
export class ShellComponent {

    readonly theme = inject(ThemeService);
    private ui = inject(UiStore);

    readonly nav = NAV_ITEMS;
    readonly repoUrl = REPO_URL;
    readonly pinned = computed(() => this.ui.state().railPinned);
    readonly hovered = signal(false);
    readonly expanded = computed(() => this.pinned() || this.hovered());

    togglePin(): void {
        this.ui.toggle('railPinned');
        this.hovered.set(false);
    }
}
