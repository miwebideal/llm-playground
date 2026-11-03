// src/app/home/home.component.ts

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HeaderComponent } from '../components/header/header.component';
import { SidebarComponent } from '../features/sidebar/sidebar.component';
import { ChatLayoutComponent } from '../features/chat/chat-layout/chat-layout.component';
import { ChatInputComponent } from '../features/chat/chat-input/chat-input.component';
import { CompareSummaryComponent } from '../features/chat/compare-summary/compare-summary.component';
import { ExportService } from '../core/services/export.service';
import { ConfigStore } from '../core/stores/config.store';
import { ProviderStore } from '../core/stores/provider.store';
import { SessionStore } from '../core/stores/session.store';

@Component({
    selector: 'app-home',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [HeaderComponent, SidebarComponent, ChatLayoutComponent, CompareSummaryComponent, ChatInputComponent],
    templateUrl: './home.component.html',
})
export class HomeComponent {

    readonly configOpenMobile = signal(false);

    private exportService = inject(ExportService);
    private configStore = inject(ConfigStore);
    sessionStore = inject(SessionStore);
    providerStore = inject(ProviderStore);

    onExportJson(includeReasoning: boolean): void {
        this.exportService.exportChat(
            this.sessionStore.sessions(), this.configStore.state(), this.providerStore.providers(), includeReasoning
        );
    }

    onExportMd(includeReasoning: boolean): void {
        this.exportService.exportMarkdown(
            this.sessionStore.sessions(), this.configStore.state(), this.providerStore.providers(), includeReasoning
        );
    }

    onCopyChat(includeReasoning: boolean): void {
        void this.exportService.copyChat(
            this.sessionStore.sessions(), this.configStore.state(), this.providerStore.providers(), includeReasoning
        );
    }
}
