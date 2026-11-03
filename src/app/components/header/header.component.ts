// src/app/components/header/header.component.ts

import { ChangeDetectionStrategy, Component, HostListener, computed, inject, output, signal } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';
import { ConfigStore } from '../../core/stores/config.store';
import { ToggleComponent } from '../toggle/toggle.component';
import {
    LucideZap, LucideMenu, LucideSun, LucideMoon, LucideDownload, LucideCopy, LucideFileBraces,
    LucideFileText, LucideChevronDown
} from '@lucide/angular';

@Component({
    selector: 'app-header',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ToggleComponent,
        LucideZap, LucideMenu, LucideSun, LucideMoon,
        LucideDownload, LucideCopy, LucideFileBraces, LucideFileText, LucideChevronDown
    ],
    templateUrl: './header.component.html'
})
export class HeaderComponent {

    theme = inject(ThemeService);
    private configStore = inject(ConfigStore);

    toggleConfig = output<void>();
    exportJson = output<boolean>();
    exportMd = output<boolean>();
    copyChat = output<boolean>();

    readonly isExportMenuOpen = signal(false);
    readonly includeReasoning = computed(() => this.configStore.state().includeReasoningExport);

    toggleExportMenu(): void {
        this.isExportMenuOpen.update(value => !value);
    }

    closeExportMenu(): void {
        this.isExportMenuOpen.set(false);
    }

    setIncludeReasoning(value: boolean): void {
        this.configStore.update('includeReasoningExport', value);
    }

    onExportJson(): void {
        this.exportJson.emit(this.includeReasoning());
        this.closeExportMenu();
    }

    onExportMd(): void {
        this.exportMd.emit(this.includeReasoning());
        this.closeExportMenu();
    }

    onCopyChat(): void {
        this.copyChat.emit(this.includeReasoning());
        this.closeExportMenu();
    }

    @HostListener('document:keydown.escape')
    onEscape(): void {
        this.closeExportMenu();
    }
}
