// src/app/core/models/provider.model.ts

export interface ProviderConfig {
    id: string;
    name: string;
    apiUrl: string;
    apiToken: string;
    isCustom?: boolean;
}

export type KeySource = 'browser' | 'none';

export function keySource(provider: ProviderConfig | undefined): KeySource {
    if (!provider) return 'none';
    return provider.apiToken ? 'browser' : 'none';
}
