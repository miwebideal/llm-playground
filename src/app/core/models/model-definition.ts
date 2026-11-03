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

export interface ModelDefinition {
    id: string;
    label: string;
    providerId: string;
    capabilities: ModelCapabilities;
    contextWindow?: number;
    maxOutput?: number;
    pricing?: ModelPricing;
}
