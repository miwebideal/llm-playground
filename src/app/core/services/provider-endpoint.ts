// src/app/core/services/provider-endpoint.ts

import { ProviderConfig } from '../models';

export type EndpointPath = 'chat/completions' | 'models';

/** Base OpenAI-compatible del proveedor (sin `/chat/completions`). */
export function providerBaseUrl(apiUrl: string): string {
    return apiUrl.trim().replace(/\/+$/, '').replace(/\/chat\/completions$/, '');
}

/** URL directa al proveedor; el navegador manda la key del usuario. */
export function providerEndpoint(provider: ProviderConfig, path: EndpointPath): string {
    if (path === 'chat/completions') return provider.apiUrl;
    return `${providerBaseUrl(provider.apiUrl)}/${path}`;
}

export function providerHeaders(provider: ProviderConfig): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (provider.apiToken) headers['Authorization'] = `Bearer ${provider.apiToken}`;
    return headers;
}
