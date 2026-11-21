// src/app/features/pages/models.page.ts

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LucideRefreshCw, LucideSearch } from '@lucide/angular';
import { keySource } from '../../core/models';
import { ModelRegistryService } from '../../core/registry/model-registry.service';
import { ModelDiscoveryService } from '../../core/services/model-discovery.service';
import { ToastService } from '../../core/services/toast.service';
import { ProviderStore } from '../../core/stores/provider.store';
import { PROVIDER_PRESETS, providerName } from '../../constants/providers.constants';
import { formatContext } from '../../utils/format.utils';

@Component({
    selector: 'app-models-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [LucideSearch, LucideRefreshCw],
    templateUrl: './models.page.html',
    host: { class: 'page' }
})
export class ModelsPage {

    private registry = inject(ModelRegistryService);
    private discovery = inject(ModelDiscoveryService);
    private providers = inject(ProviderStore);
    private toast = inject(ToastService);

    readonly presets = PROVIDER_PRESETS;
    readonly query = signal('');
    readonly provider = signal('all');
    readonly showDeprecated = signal(false);
    readonly refreshing = signal(false);

    providerName = providerName;
    ctx = formatContext;

    readonly models = computed(() => {
        const q = this.query().trim().toLowerCase();
        const provider = this.provider();
        return this.registry.catalog()
            .filter(m => provider === 'all' || m.providerId === provider)
            .filter(m => this.showDeprecated() || (m.status !== 'deprecated' && !m.legacy))
            .filter(m => !q || m.label.toLowerCase().includes(q) || m.id.toLowerCase().includes(q));
    });

    readonly hiddenCount = computed(() =>
        this.registry.catalog().filter(m => m.status === 'deprecated' || m.legacy).length
    );

    readonly verifiedProviders = computed(() => Object.keys(this.registry.remote()).length);

    async refreshAll(): Promise<void> {
        const ready = this.providers.providers().filter(p => keySource(p) !== 'none' && !p.isCustom);
        if (!ready.length) {
            this.toast.warning('Cargá al menos una key en Claves para verificar disponibilidad.');
            return;
        }
        this.refreshing.set(true);
        const results = await Promise.allSettled(ready.map(p => this.discovery.refresh(p)));
        this.refreshing.set(false);
        const ok = results.filter(r => r.status === 'fulfilled').length;
        this.toast.info(`Verificados ${ok} de ${ready.length} proveedores`);
    }
}
