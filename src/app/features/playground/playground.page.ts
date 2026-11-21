// src/app/features/playground/playground.page.ts

import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { LucideColumns2, LucideCopy, LucideDownload, LucideFileBraces, LucideFileText, LucideSlidersHorizontal, LucideSquare } from '@lucide/angular';
import { ExportService } from '../../core/services/export.service';
import { ConfigStore } from '../../core/stores/config.store';
import { ProviderStore } from '../../core/stores/provider.store';
import { SessionStore } from '../../core/stores/session.store';
import { UiStore } from '../../core/stores/ui.store';
import { ChatInputComponent } from './chat/chat-input/chat-input.component';
import { ChatLayoutComponent } from './chat/chat-layout/chat-layout.component';
import { SettingsDrawerComponent } from './settings-drawer/settings-drawer.component';

@Component({
    selector: 'app-playground-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ChatLayoutComponent, ChatInputComponent, SettingsDrawerComponent, LucideSquare, LucideColumns2, LucideSlidersHorizontal,
        LucideDownload, LucideFileBraces, LucideFileText, LucideCopy
    ],
    templateUrl: './playground.page.html',
    host: { class: 'flex-1 flex min-h-0' }
})
export class PlaygroundPage {

    private configStore = inject(ConfigStore);
    private exportService = inject(ExportService);
    readonly sessionStore = inject(SessionStore);
    readonly providerStore = inject(ProviderStore);
    readonly ui = inject(UiStore);

    readonly split = computed(() => this.configStore.state().isCompareMode);
    readonly drawerOpen = computed(() => this.ui.state().drawerOpen);
    readonly exportOpen = signal(false);
    readonly includeReasoning = computed(() => this.configStore.state().includeReasoningExport);

    setSplit(value: boolean): void {
        this.configStore.update('isCompareMode', value);
    }

    toggleReasoning(): void {
        this.configStore.update('includeReasoningExport', !this.includeReasoning());
    }

    export(kind: 'json' | 'md' | 'copy'): void {
        const args = [this.sessionStore.sessions(), this.configStore.state(), this.providerStore.providers(), this.includeReasoning()] as const;
        if (kind === 'json') this.exportService.exportChat(...args);
        else if (kind === 'md') this.exportService.exportMarkdown(...args);
        else void this.exportService.copyChat(...args);
        this.exportOpen.set(false);
    }

    @HostListener('document:keydown.escape')
    closeMenus(): void {
        this.exportOpen.set(false);
    }
}
