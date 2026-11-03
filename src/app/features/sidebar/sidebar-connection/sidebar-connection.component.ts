// src/app/features/sidebar/sidebar-connection/sidebar-connection.component.ts

import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProviderStore } from '../../../core/stores/provider.store';
import { SessionStore } from '../../../core/stores/session.store';
import { ModelRegistryService } from '../../../core/registry/model-registry.service';
import { LucideEye, LucideEyeOff, LucideTriangleAlert } from '@lucide/angular';

type TokenOverride = 'max_tokens' | 'max_completion_tokens' | '';

@Component({
    selector: 'app-sidebar-connection',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, LucideEye, LucideEyeOff, LucideTriangleAlert],
    templateUrl: './sidebar-connection.component.html'
})
export class SidebarConnectionComponent {

    sessionId = input.required<string>();

    private sessionStore = inject(SessionStore);
    private providerStore = inject(ProviderStore);
    private registry = inject(ModelRegistryService);

    readonly session = computed(() => {
        const id = this.sessionId();
        return this.sessionStore.sessions().find(session => session.id === id)
            ?? this.sessionStore.sessions()[0];
    });

    readonly providers = this.providerStore.providers;
    readonly activeProvider = computed(() =>
        this.providers().find(provider => provider.id === this.session()?.providerId)
    );

    readonly showToken = signal(false);
    readonly forceManualModel = signal(false);

    readonly availableModels = computed(() => {
        const session = this.session();
        if (!session) return [];
        return this.registry.list(session.providerId);
    });

    readonly definition = computed(() => {
        const session = this.session();
        return session ? this.registry.find(session.providerId, session.model) : undefined;
    });

    readonly capabilities = computed(() => {
        const session = this.session();
        return session ? this.registry.capabilities(session) : null;
    });

    readonly restrictedLabels = computed(() => {
        const caps = this.capabilities();
        return caps ? this.registry.restrictedParamLabels(caps) : [];
    });

    readonly tokenLimitLabel = computed(() => {
        const caps = this.capabilities();
        return caps ? this.registry.tokenLimitLabel(caps.tokenLimit) : 'Max tokens';
    });

    readonly priceLabel = computed(() => {
        const pricing = this.definition()?.pricing;
        if (!pricing) return null;
        return `$${pricing.input} / $${pricing.output} por 1M`;
    });

    readonly tokenOverride = computed<TokenOverride>(() =>
        this.session()?.tokenLimitOverride ?? ''
    );

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
        this.sessionStore.updateSession(this.sessionId(), {
            providerId,
            model: '',
            tokenLimitOverride: undefined
        });
        this.forceManualModel.set(false);
    }

    updateProviderToken(value: string): void {
        const providerId = this.session()?.providerId;
        if (providerId) this.providerStore.updateProvider(providerId, { apiToken: value });
    }

    updateProviderUrl(value: string): void {
        const providerId = this.session()?.providerId;
        if (providerId) this.providerStore.updateProvider(providerId, { apiUrl: value });
    }

    updateSessionModel(value: string): void {
        this.sessionStore.updateSession(this.sessionId(), { model: value, tokenLimitOverride: undefined });
    }

    setTokenOverride(value: TokenOverride): void {
        this.sessionStore.updateSession(this.sessionId(), {
            tokenLimitOverride: value === '' ? undefined : value
        });
    }
}
