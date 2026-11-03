// src/app/constants/model-catalog.constants.ts

import { ModelCapabilities, ModelDefinition, ModelPricing } from '../core/models';

const BASE: ModelCapabilities = {
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

function caps(overrides: Partial<ModelCapabilities> = {}): ModelCapabilities {
    return { ...BASE, ...overrides };
}

const FULL = caps();
const REASONING = caps({ reasoning: true });
const COMPLETION = caps({
    tokenLimit: 'max_completion_tokens',
    temperature: false,
    topP: false,
    jsonMode: false,
    reasoning: true
});

const VERIFIED_AT = '2026-11-03';

function price(input: number, output: number): ModelPricing {
    return { input, output, unit: 'per_1M', verifiedAt: VERIFIED_AT };
}

interface CatalogOptions {
    pricing?: [number, number];
    contextWindow?: number;
    maxOutput?: number;
}

function model(
    providerId: string,
    id: string,
    label: string,
    capabilities: ModelCapabilities,
    options: CatalogOptions = {}
): ModelDefinition {
    return {
        id,
        label,
        providerId,
        capabilities,
        contextWindow: options.contextWindow,
        maxOutput: options.maxOutput,
        pricing: options.pricing ? price(...options.pricing) : undefined
    };
}

export const MODEL_CATALOG: ModelDefinition[] = [
    // OPENAI
    model('openai', 'gpt-6-astra', 'GPT-6 Astra', COMPLETION, { pricing: [10, 30] }),
    model('openai', 'gpt-5.6-sol', 'Sol (Frontier)', COMPLETION, { pricing: [4, 12] }),
    model('openai', 'gpt-5.6-terra', 'Terra (GPT-5.6)', COMPLETION, { pricing: [2, 6] }),
    model('openai', 'gpt-5.6-luna', 'Luna (GPT-5.6 Fast)', COMPLETION, { pricing: [0.2, 1.2] }),
    model('openai', 'gpt-5.4-mini', 'GPT-5.4 Mini', COMPLETION, { pricing: [0.75, 4.5] }),
    model('openai', 'gpt-5.4-nano', 'GPT-5.4 Nano', COMPLETION, { pricing: [0.2, 1.25] }),
    model('openai', 'gpt-5-nano', 'GPT-5 Nano', COMPLETION, { pricing: [0.05, 0.4] }),
    model('openai', 'gpt-4.1-mini', 'GPT-4.1 Mini', FULL, { pricing: [0.4, 1.6] }),
    model('openai', 'gpt-4.1-nano', 'GPT-4.1 Nano', FULL, { pricing: [0.1, 0.4] }),
    model('openai', 'gpt-4o', 'GPT-4o', FULL, { pricing: [2.5, 10] }),
    model('openai', 'gpt-4o-mini', 'GPT-4o Mini', FULL, { pricing: [0.15, 0.6] }),

    // DEEPINFRA
    model('deepinfra', 'deepseek-ai/DeepSeek-V4.1-Flash', 'DeepSeek V4.1 Flash', REASONING, { pricing: [0.3, 1.2] }),
    model('deepinfra', 'zai-org/GLM-5.3', 'GLM 5.3', REASONING, { pricing: [0.9, 3] }),
    model('deepinfra', 'zai-org/GLM-5.3-Flash', 'GLM 5.3 Flash', REASONING, { pricing: [0.075, 0.25] }),
    model('deepinfra', 'Qwen/Qwen3.8-2.4T-A95B', 'Qwen 3.8 (2.4T)', REASONING, { pricing: [2, 6] }),
    model('deepinfra', 'deepseek-ai/DeepSeek-V4-Pro', 'DeepSeek V4 Pro', REASONING, { pricing: [1.3, 2.6] }),
    model('deepinfra', 'tencent/Hy4-preview', 'Tencent Hy4 (preview)', REASONING),
    model('deepinfra', 'moonshotai/Kimi-K3', 'Kimi K3', REASONING, { pricing: [2.85, 14.25] }),
    model('deepinfra', 'nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B', 'Nemotron 3 Ultra (550B)', REASONING, { pricing: [0.5, 2.2] }),
    model('deepinfra', 'XiaomiMiMo/MiMo-V2.5-Pro', 'MiMo V2.5 Pro', REASONING, { pricing: [1, 3] }),
    model('deepinfra', 'Qwen/Qwen3.6-35B-A3B', 'Qwen 3.6 (35B)', REASONING, { pricing: [0.1, 0.95] }),
    model('deepinfra', 'Qwen/Qwen3.5-397B-A17B', 'Qwen 3.5 (397B)', REASONING, { pricing: [0.45, 3] }),
    model('deepinfra', 'google/gemma-4-26B-A4B-it', 'Gemma 4 (26B)', FULL, { pricing: [0.28, 0.86] }),
    model('deepinfra', 'deepseek-ai/DeepSeek-V3.2', 'DeepSeek V3.2', REASONING, { pricing: [0.287, 0.431] }),
    model('deepinfra', 'google/gemma-4-31B-it', 'Gemma 4 (31B)', FULL, { pricing: [0.28, 0.86] }),

    // GROQ
    model('groq', 'qwen/qwen3.8-27b', 'Qwen 3.8 (27B)', REASONING, { pricing: [0.6, 3] }),
    model('groq', 'openai/gpt-oss-120b', 'GPT-OSS (120B)', REASONING, { pricing: [0.15, 0.6] }),
    model('groq', 'openai/gpt-oss-20b', 'GPT-OSS (20B)', REASONING, { pricing: [0.075, 0.3] }),

    // FIREWORKS AI
    model('fireworks', 'accounts/fireworks/models/deepseek-v4p1-flash', 'DeepSeek V4.1 Flash', REASONING, { pricing: [0.22, 0.66] }),
    model('fireworks', 'accounts/fireworks/models/glm-5p3', 'GLM 5.3', REASONING, { pricing: [1.4, 4.4] }),
    model('fireworks', 'accounts/fireworks/models/glm-5p3-flash', 'GLM 5.3 Flash', REASONING, { pricing: [0.15, 0.5] }),
    model('fireworks', 'accounts/fireworks/models/qwen3p8-max', 'Qwen 3.8 Max', REASONING, { pricing: [2, 6] }),
    model('fireworks', 'accounts/fireworks/models/kimi-k3', 'Kimi K3', REASONING, { pricing: [3, 15] }),
    model('fireworks', 'accounts/fireworks/models/glm-5p1', 'GLM 5.1', REASONING, { pricing: [1.4, 4.4] }),
    model('fireworks', 'accounts/fireworks/models/nemotron-lightning-3p5-30b-a3b', 'Nemotron Lightning 3.5', FULL, { pricing: [0.05, 0.2] }),
    model('fireworks', 'accounts/fireworks/models/minimax-m3', 'MiniMax M3', REASONING, { pricing: [0.3, 1.2] }),
    model('fireworks', 'accounts/fireworks/models/gpt-oss-120b', 'GPT-OSS (120B)', REASONING, { pricing: [0.15, 0.6] }),
    model('fireworks', 'accounts/fireworks/models/qwen3p7-plus', 'Qwen 3.7 Plus', REASONING, { pricing: [0.4, 1.6] }),

    // GEMINI
    model('gemini', 'gemini-1.5-pro', 'Gemini 1.5 Pro', FULL, { pricing: [1.25, 5] }),
    model('gemini', 'gemini-1.5-flash', 'Gemini 1.5 Flash', FULL, { pricing: [0.35, 1.05] }),
    model('gemini', 'gemini-1.5-flash-8b', 'Gemini 1.5 Flash 8B', FULL, { pricing: [0.2, 0.8] }),

    // OPENROUTER
    model('openrouter', 'deepseek/deepseek-coder', 'DeepSeek Coder', FULL, { pricing: [0.14, 0.28] }),
    model('openrouter', 'qwen/qwen-2-72b-instruct', 'Qwen 2 (72B)', FULL, { pricing: [1.2, 1.2] }),
    model('openrouter', 'anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet', FULL, { pricing: [3, 15] }),
    model('openrouter', 'openai/gpt-4o', 'GPT-4o', FULL, { pricing: [2.5, 10] }),

    // TOGETHER AI
    model('together', 'Qwen/Qwen2-72B-Instruct', 'Qwen 2 (72B)', FULL, { pricing: [1.2, 1.2] }),
    model('together', 'deepseek-ai/deepseek-coder-33b-instruct', 'DeepSeek Coder (33B)', FULL, { pricing: [0.2, 0.2] }),
    model('together', 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', 'Llama 3.1 (70B) Turbo', FULL, { pricing: [1.04, 1.04] }),
];
