// src/app/features/playground/settings-connection/settings-connection.component.ts

import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideRefreshCw, LucideTriangleExclamationPoint } from '@lucide/angular';
import { keySource } from '../../../core/models';
import { ModelRegistryService } from '../../../core/registry/model-registry.service';
import { ModelDiscoveryService } from '../../../core/services/model-discovery.service';
import { ToastService } from '../../../core/services/toast.service';
import { ProviderStore } from '../../../core/stores/provider.store';
import { SessionStore } from '../../../core/stores/session.store';
import { CUSTOM_PROVIDER_ID } from '../../../constants/providers.constants';
import { formatContext } from '../../../utils/format.utils';

type TokenOverride = 'max_tokens' | 'max_completion_tokens' | '';

@Component({
    selector: 'app-settings-connection',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, RouterLink, LucideRefreshCw, LucideTriangleExclamationPoint],
    templateUrl: './settings-connection.component.html'
})
export class SettingsConnectionComponent {

    sessionId = input.required<string>();

    private sessionStore = inject(SessionStore);
    private providerStore = inject(ProviderStore);
    private registry = inject(ModelRegistryService);
    private discovery = inject(ModelDiscoveryService);
    private toast = inject(ToastService);

    readonly customId = CUSTOM_PROVIDER_ID;

    readonly session = computed(() => {
        const id = this.sessionId();
        return this.sessionStore.sessions().find(session => session.id === id) ?? this.sessionStore.sessions()[0];
    });

    readonly providers = this.providerStore.providers;
    readonly activeProvider = computed(() => this.providers().find(p => p.id === this.session()?.providerId));
    readonly keyState = computed(() => keySource(this.activeProvider()));
    readonly refreshing = computed(() => this.discovery.loading().has(this.session()?.providerId ?? ''));
    readonly lastFetch = computed(() => this.registry.remote()[this.session()?.providerId ?? '']?.fetchedAt ?? null);

    readonly forceManualModel = signal(false);

    readonly availableModels = computed(() => {
        const session = this.session();
        return session ? this.registry.list(session.providerId) : [];
    });

    readonly definition = computed(() => {
        const session = this.session();
        return session ? this.registry.resolve(session) : undefined;
    });

    readonly restrictedLabels = computed(() => {
        const def = this.definition();
        return def ? this.registry.restrictedParamLabels(def.capabilities) : [];
    });

    readonly contextLabel = computed(() => formatContext(this.definition()?.contextWindow));
    readonly tokenOverride = computed<TokenOverride>(() => this.session()?.tokenLimitOverride ?? '');

    get modelSelectValue(): string {
        const session = this.session();
        if (!session) return '';
        if (this.forceManualModel()) return 'manual';
        if (!session.model) return '';
        return this.availableModels().some(model => model.id === session.model) ? session.model : 'manual';
    }

    set modelSelectValue(value: string) {
        if (value === 'manual') {
            this.forceManualModel.set(true);
            return;
        }
        this.forceManualModel.set(false);
        this.sessionStore.updateSession(this.sessionId(), { model: value, tokenLimitOverride: undefined });
    }

    constructor() {
        effect(() => {
            this.sessionId();
            this.forceManualModel.set(false);
        });
    }

    onProviderChange(providerId: string): void {
        this.sessionStore.updateSession(this.sessionId(), { providerId, model: '', tokenLimitOverride: undefined });
        this.forceManualModel.set(false);
    }

    updateProviderUrl(value: string): void {
        this.providerStore.updateProvider(CUSTOM_PROVIDER_ID, { apiUrl: value });
    }

    updateSessionModel(value: string): void {
        this.sessionStore.updateSession(this.sessionId(), { model: value, tokenLimitOverride: undefined });
    }

    setTokenOverride(value: TokenOverride): void {
        this.sessionStore.updateSession(this.sessionId(), { tokenLimitOverride: value === '' ? undefined : value });
    }

    async refreshModels(): Promise<void> {
        const provider = this.activeProvider();
        if (!provider) return;
        try {
            const count = await this.discovery.refresh(provider);
            this.toast.success(`${provider.name}: ${count} modelos disponibles`);
        } catch (error) {
            this.toast.error(error instanceof Error ? error.message : 'No se pudo consultar /models');
        }
    }
}
