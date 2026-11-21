// src/app/core/models/model-definition.ts

export type TokenLimitPolicy = 'max_tokens' | 'max_completion_tokens' | 'none';

export interface ModelCapabilities {
    systemPrompt: boolean;
    temperature: boolean;
    topP: boolean;
    jsonMode: boolean;
    vision: boolean;
    reasoning: boolean;
    streaming: boolean;
    usage: boolean;
    tokenLimit: TokenLimitPolicy;
}

export interface ModelPricing {
    input: number;
    output: number;
    unit: 'per_1M';
    verifiedAt: string;
}

/**
 * - catalog: está en el catálogo local, sin verificar contra el proveedor.
 * - available: el proveedor lo lista en /models.
 * - deprecated: está en el catálogo pero el proveedor ya no lo lista.
 * - discovered: lo lista el proveedor pero no tenemos metadata.
 */
export type ModelStatus = 'catalog' | 'available' | 'deprecated' | 'discovered';

export interface ModelDefinition {
    id: string;
    label: string;
    providerId: string;
    capabilities: ModelCapabilities;
    contextWindow?: number;
    maxOutput?: number;
    pricing?: ModelPricing;
    /** Parámetros, ej. { total: '1.4T', active: '48B' } para MoE. */
    params?: { total?: string; active?: string };
    /** Modelos viejos que se mantienen por compatibilidad pero no se recomiendan. */
    legacy?: boolean;
    status?: ModelStatus;
}
