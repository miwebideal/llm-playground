// src/app/features/pages/keys.page.ts

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LucideEye, LucideEyeOff, LucideLock, LucideRefreshCw, LucideTrash2 } from '@lucide/angular';
import { ProviderConfig, keySource } from '../../core/models';
import { ModelDiscoveryService } from '../../core/services/model-discovery.service';
import { ModalService } from '../../core/services/modal.service';
import { SecretStoreService } from '../../core/services/secret-store.service';
import { ToastService } from '../../core/services/toast.service';
import { ProviderStore } from '../../core/stores/provider.store';
import { CUSTOM_PROVIDER_ID } from '../../constants/providers.constants';
import { maskSecret } from '../../utils/format.utils';

@Component({
    selector: 'app-keys-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [LucideTrash2, LucideRefreshCw, LucideEye, LucideEyeOff, LucideLock],
    templateUrl: './keys.page.html',
    host: { class: 'page' }
})
export class KeysPage {

    readonly store = inject(ProviderStore);
    private discovery = inject(ModelDiscoveryService);
    private modal = inject(ModalService);
    private toast = inject(ToastService);
    readonly canPersist = inject(SecretStoreService).canPersist();

    readonly customId = CUSTOM_PROVIDER_ID;
    readonly editing = signal<string | null>(null);
    readonly draft = signal('');
    readonly reveal = signal(false);
    readonly configured = computed(() => this.store.providers().filter(p => keySource(p) !== 'none').length);

    source = keySource;
    mask = maskSecret;

    isTesting(id: string): boolean {
        return this.discovery.loading().has(id);
    }

    startEdit(provider: ProviderConfig): void {
        this.editing.set(provider.id);
        this.draft.set('');
        this.reveal.set(false);
    }

    save(provider: ProviderConfig): void {
        const value = this.draft().trim();
        if (!value) return;
        this.store.updateProvider(provider.id, { apiToken: value });
        this.draft.set('');
        this.editing.set(null);
        this.toast.success(`Key de ${provider.name} guardada cifrada`);
    }

    async remove(provider: ProviderConfig): Promise<void> {
        const ok = await this.modal.confirm({
            title: `Borrar key de ${provider.name}`,
            message: 'Se elimina de este navegador. No se puede deshacer.',
            confirmText: 'Borrar',
            isDanger: true
        });
        if (ok) this.store.updateProvider(provider.id, { apiToken: '' });
    }

    updateUrl(event: Event): void {
        this.store.updateProvider(CUSTOM_PROVIDER_ID, { apiUrl: (event.target as HTMLInputElement).value.trim() });
    }

    async test(provider: ProviderConfig): Promise<void> {
        try {
            const count = await this.discovery.refresh(provider);
            this.toast.success(`${provider.name} responde: ${count} modelos disponibles`);
        } catch (error) {
            this.toast.error(`${provider.name}: ${error instanceof Error ? error.message : 'sin respuesta'}`);
        }
    }
}
