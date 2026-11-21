// src/app/core/services/model-discovery.service.ts

import { Injectable, inject, signal } from '@angular/core';
import { ProviderConfig, keySource } from '../models';
import { ModelRegistryService } from '../registry/model-registry.service';
import { providerEndpoint, providerHeaders } from './provider-endpoint';

/** Modelos que no son de chat y no tiene sentido ofrecer en el playground. */
const NON_CHAT = /(embed|embedding|whisper|tts|transcri|dall-e|image|imagen|audio|speech|moderation|rerank|realtime|search-preview|sora|veo|clip|vision-encoder|guard)/i;

/** Acepta `{data}`, `{models}` o un array y normaliza los ids de chat. */
export function parseModelIds(data: unknown): string[] {
    const list = (data as { data?: unknown; models?: unknown })?.data
        ?? (data as { models?: unknown })?.models
        ?? data;
    if (!Array.isArray(list)) return [];
    return list
        .map(item => typeof item === 'string' ? item : (item as { id?: unknown; name?: unknown })?.id ?? (item as { name?: unknown })?.name)
        .filter((id): id is string => typeof id === 'string' && !!id)
        .map(id => id.replace(/^models\//, ''))
        .filter(id => !NON_CHAT.test(id));
}

@Injectable({ providedIn: 'root' })
export class ModelDiscoveryService {

    private registry = inject(ModelRegistryService);
    readonly loading = signal<ReadonlySet<string>>(new Set());

    /** Consulta /models. Devuelve la cantidad de modelos o lanza un Error legible. */
    async refresh(provider: ProviderConfig): Promise<number> {
        if (keySource(provider) === 'none') throw new Error('Falta la key de este proveedor.');
        if (!provider.apiUrl) throw new Error('Falta la URL del proveedor.');

        this.loading.update(set => new Set(set).add(provider.id));
        try {
            const response = await fetch(providerEndpoint(provider, 'models'), {
                headers: providerHeaders(provider)
            });
            if (!response.ok) {
                throw new Error(response.status === 401 || response.status === 403
                    ? 'Key inválida o sin permisos.'
                    : `El proveedor respondió ${response.status}.`);
            }
            const ids = parseModelIds(await response.json());
            if (!ids.length) throw new Error('El proveedor no devolvió modelos de chat.');
            this.registry.setRemote(provider.id, ids);
            return ids.length;
        } finally {
            this.loading.update(set => {
                const next = new Set(set);
                next.delete(provider.id);
                return next;
            });
        }
    }
}
