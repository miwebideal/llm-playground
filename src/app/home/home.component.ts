// src/app/home/home.component.ts

import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../components/header/header.component';
import { SidebarComponent } from '../features/sidebar/sidebar.component';
import { ChatLayoutComponent } from '../features/chat/chat-layout/chat-layout.component';
import { ChatInputComponent } from '../features/chat/chat-input/chat-input.component';
import { ExportService } from '../core/services/export.service';
import { SessionStore } from '../core/stores/session.store';
import { GlobalConfigStore } from '../core/stores/global-config.store';
import { ProviderStore } from '../core/stores/provider.store';

@Component({
    selector: 'app-home',
    imports: [CommonModule, HeaderComponent, SidebarComponent, ChatLayoutComponent, ChatInputComponent],
    templateUrl: './home.component.html',
})
export class HomeComponent {

    configOpenMobile = signal(false);

    private exportService = inject(ExportService);
    private configStore = inject(GlobalConfigStore);
    sessionStore = inject(SessionStore);
    providerStore = inject(ProviderStore);

    onExportJson() {
        this.exportService.exportChat(this.sessionStore.sessions(), this.configStore.state());
    }
    onExportMd() {
        this.exportService.exportMarkdown(this.sessionStore.sessions(), this.configStore.state());
    }
    onCopyChat() {
        this.exportService.copyChat(this.sessionStore.sessions(), this.configStore.state());
    }

}
