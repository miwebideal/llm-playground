// src/app/components/header/header.component.ts

import { Component, inject, output, signal } from '@angular/core';
import { ThemeService } from '../../services/theme.service';

import {
    LucideZap, LucideMenu, LucideSun, LucideMoon,
    LucideDownload, LucideCopy, LucideFileBraces, LucideFileText, LucideChevronDown
} from '@lucide/angular';

@Component({
    selector: 'app-header',
    imports: [
        LucideZap, LucideMenu, LucideSun, LucideMoon,
        LucideDownload, LucideCopy, LucideFileBraces, LucideFileText, LucideChevronDown
    ],
    templateUrl: './header.component.html'
})
export class HeaderComponent {

    theme = inject(ThemeService);

    toggleConfig = output<void>();
    exportJson = output<void>();
    exportMd = output<void>();
    copyChat = output<void>();

    isExportMenuOpen = signal(false);

    toggleExportMenu() {
        this.isExportMenuOpen.update(v => !v);
    }

    closeExportMenu() {
        this.isExportMenuOpen.set(false);
    }

    onExportJson() { this.exportJson.emit(); this.closeExportMenu(); }
    onExportMd() { this.exportMd.emit(); this.closeExportMenu(); }
    onCopyChat() { this.copyChat.emit(); this.closeExportMenu(); }

}
