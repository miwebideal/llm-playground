// src/app/core/registry/model-registry.service.ts

import { Injectable } from '@angular/core';
import {
    ChatSession,
    ModelCapabilities,
    ModelDefinition,
    ModelPricing,
    TokenLimitPolicy
} from '../models';
import { MODEL_CATALOG } from '../../constants/model-catalog.constants';

const FALLBACK_CAPS: ModelCapabilities = {
    systemPrompt: true,
    temperature: true,
    topP: true,
    jsonMode: true,
    vision: false,
    reasoning: false,
    streaming: true,
    usage: true,
    tokenLimit: 'max_tokens'
};

// Fallback sólo para IDs manuales que no están en el catálogo.
const COMPLETION_PATTERNS = [/^o\d/, /^gpt-5/, /^gpt-6/, /^codex/, /-sol$/, /-terra$/, /-luna$/];

@Injectable({ providedIn: 'root' })
export class ModelRegistryService {

    private readonly byKey = new Map<string, ModelDefinition>();
    private readonly byProvider = new Map<string, ModelDefinition[]>();

    constructor() {
        for (const definition of MODEL_CATALOG) {
            this.byKey.set(this.key(definition.providerId, definition.id), definition);
            const list = this.byProvider.get(definition.providerId) ?? [];
            list.push(definition);
            this.byProvider.set(definition.providerId, list);
        }
    }

    list(providerId: string): ModelDefinition[] {
        return [...(this.byProvider.get(providerId) ?? [])];
    }

    find(providerId: string, modelId: string): ModelDefinition | undefined {
        return this.byKey.get(this.key(providerId, modelId));
    }

    resolve(session: Pick<ChatSession, 'providerId' | 'model' | 'tokenLimitOverride'>): ModelDefinition {
        const exact = this.find(session.providerId, session.model);
        if (exact) {
            return session.tokenLimitOverride
                ? { ...exact, capabilities: { ...exact.capabilities, tokenLimit: session.tokenLimitOverride } }
                : exact;
        }
        const capabilities = this.heuristicCapabilities(session.model);
        return {
            id: session.model,
            label: session.model || 'Sin modelo',
            providerId: session.providerId,
            capabilities: session.tokenLimitOverride
                ? { ...capabilities, tokenLimit: session.tokenLimitOverride }
                : capabilities
        };
    }

    capabilities(session: Pick<ChatSession, 'providerId' | 'model' | 'tokenLimitOverride'>): ModelCapabilities {
        return this.resolve(session).capabilities;
    }

    tokenPolicy(session: Pick<ChatSession, 'providerId' | 'model' | 'tokenLimitOverride'>): TokenLimitPolicy {
        return this.capabilities(session).tokenLimit;
    }

    pricing(providerId: string, modelId: string): ModelPricing | undefined {
        return this.find(providerId, modelId)?.pricing;
    }

    tokenLimitLabel(policy: TokenLimitPolicy): string {
        if (policy === 'max_completion_tokens') return 'Max completion tokens';
        if (policy === 'none') return 'Sin límite de tokens';
        return 'Max tokens';
    }

    hasRestrictedParams(capabilities: ModelCapabilities): boolean {
        return !capabilities.temperature || !capabilities.topP || !capabilities.jsonMode || !capabilities.systemPrompt;
    }

    restrictedParamLabels(capabilities: ModelCapabilities): string[] {
        const labels: string[] = [];
        if (!capabilities.temperature) labels.push('temperature');
        if (!capabilities.topP) labels.push('top_p');
        if (!capabilities.jsonMode) labels.push('JSON mode');
        if (!capabilities.systemPrompt) labels.push('system prompt');
        return labels;
    }

    private heuristicCapabilities(modelId: string): ModelCapabilities {
        const lower = (modelId || '').toLowerCase();
        const completion = COMPLETION_PATTERNS.some(pattern => pattern.test(lower));
        return completion
            ? { ...FALLBACK_CAPS, tokenLimit: 'max_completion_tokens', temperature: false, topP: false, reasoning: true }
            : { ...FALLBACK_CAPS };
    }

    private key(providerId: string, modelId: string): string {
        return `${providerId}::${modelId}`;
    }
}
