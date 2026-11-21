// src/app/constants/providers.constants.ts

import presets from './provider-presets.json';

export interface ProviderPreset {
    id: string;
    name: string;
    apiUrl: string;
}

export const CUSTOM_PROVIDER_ID = 'custom';

export const PROVIDER_PRESETS: ProviderPreset[] = presets;

export const PROVIDER_BY_ID = new Map(PROVIDER_PRESETS.map(p => [p.id, p]));

export function providerName(id: string): string {
    if (id === CUSTOM_PROVIDER_ID) return 'Personalizado';
    return PROVIDER_BY_ID.get(id)?.name ?? id;
}
