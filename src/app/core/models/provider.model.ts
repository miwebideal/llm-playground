// src/app/core/models/provider.model.ts

export interface ProviderConfig {
    id: string;
    name: string;
    apiUrl: string;
    apiToken: string;
    isCustom?: boolean;
}
