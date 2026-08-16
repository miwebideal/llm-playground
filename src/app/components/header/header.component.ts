// src/app/components/header/header.component.ts

import { Component, inject, output, signal } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';
import { ToggleComponent } from '../toggle/toggle.component';

import {
    LucideZap, LucideMenu, LucideSun, LucideMoon, LucideDownload, LucideCopy, LucideFileBraces,
    LucideFileText, LucideChevronDown
} from '@lucide/angular';

@Component({
    selector: 'app-header',
    imports: [
        ToggleComponent,
        LucideZap, LucideMenu, LucideSun, LucideMoon,
        LucideDownload, LucideCopy, LucideFileBraces, LucideFileText, LucideChevronDown
    ],
    templateUrl: './header.component.html'
})
export class HeaderComponent {

    theme = inject(ThemeService);

    toggleConfig = output<void>();
    exportJson = output<boolean>();
    exportMd = output<boolean>();
    copyChat = output<boolean>();

    isExportMenuOpen = signal(false);
    includeReasoning = signal(true);

    toggleExportMenu() {
        this.isExportMenuOpen.update(v => !v);
    }

    closeExportMenu() {
        this.isExportMenuOpen.set(false);
    }

    onExportJson() { this.exportJson.emit(this.includeReasoning()); this.closeExportMenu(); }
    onExportMd() { this.exportMd.emit(this.includeReasoning()); this.closeExportMenu(); }
    onCopyChat() { this.copyChat.emit(this.includeReasoning()); this.closeExportMenu(); }

}
