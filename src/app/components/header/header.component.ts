// src/app/components/header/header.component.ts

import { Component, inject, output } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { LucideZap, LucideMenu, LucideSun, LucideMoon, LucideDownload } from '@lucide/angular';

@Component({
    selector: 'app-header',
    imports: [LucideZap, LucideMenu, LucideSun, LucideMoon, LucideDownload],
    templateUrl: './header.component.html'
})
export class HeaderComponent {

    theme = inject(ThemeService);
    toggleConfig = output<void>();
    exportChat = output<void>();

}