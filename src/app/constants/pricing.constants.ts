// src/app/constants/pricing.constants.ts

export const MODEL_PRICING: Record<string, { input: number, output: number }> = {

    // OpenAI 
    'gpt-5.6-sol': { input: 5.00, output: 30.00 },
    'gpt-5.6-terra': { input: 2.00, output: 12.00 },
    'gpt-5.6-luna': { input: 0.20, output: 1.20 },
    'gpt-5.4-mini': { input: 0.75, output: 4.50 },
    'gpt-5.4-nano': { input: 0.20, output: 1.25 },
    'gpt-4.1-mini': { input: 0.40, output: 1.60 },
    'gpt-4.1-nano': { input: 0.10, output: 0.40 },
    'gpt-5-nano': { input: 0.05, output: 0.40 },
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },

    // DeepInfra 
    'deepseek-ai/DeepSeek-V4-Pro': { input: 1.30, output: 2.60 },
    'deepseek-ai/DeepSeek-V4-Flash-0731': { input: 0.08, output: 0.18 },
    //'deepseek-ai/DeepSeek-V4-Flash': { input: 0.14, output: 0.28 }, // Deprecado
    'moonshotai/Kimi-K3': { input: 2.85, output: 14.25 },
    'moonshotai/Kimi-K2.7-Code': { input: 0.68, output: 3.40 },
    'zai-org/GLM-5.2': { input: 0.75, output: 2.40 },
    'nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B': { input: 0.50, output: 2.20 },
    'XiaomiMiMo/MiMo-V2.5-Pro': { input: 1.00, output: 3.00 },
    'Qwen/Qwen3.6-35B-A3B': { input: 0.10, output: 0.95 },
    'Qwen/Qwen3.5-397B-A17B': { input: 0.45, output: 3.00 },
    'google/gemma-4-26B-A4B-it': { input: 0.28, output: 0.86 },
    'deepseek-ai/DeepSeek-V3.2': { input: 0.287, output: 0.431 },
    'google/gemma-4-31B-it': { input: 0.28, output: 0.86 },

    // Groq 
    //'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 }, // Deprecado
    //'llama-3.1-8b-instant': { input: 0.05, output: 0.08 }, // Deprecado
    'meta-llama/llama-4-scout-17b-16e-instruct': { input: 0.11, output: 0.34 },
    'qwen/qwen3.6-27b': { input: 0.60, output: 3.00 },
    'openai/gpt-oss-120b': { input: 0.15, output: 0.60 },
    'openai/gpt-oss-20b': { input: 0.075, output: 0.30 },

    // Fireworks AI 
    'accounts/fireworks/models/deepseek-v4-pro-0813': { input: 1.32, output: 3.96 },
    'accounts/fireworks/models/deepseek-v4-flash-0731': { input: 0.14, output: 0.28 },
    'accounts/fireworks/models/deepseek-v4-flash': { input: 0.14, output: 0.28 }, // Deprecado
    'accounts/fireworks/models/qwen-3.8-max': { input: 2.00, output: 6.00 },
    'accounts/fireworks/models/kimi-k3': { input: 3.00, output: 15.00 },
    'accounts/fireworks/models/kimi-k2p7-code': { input: 0.95, output: 4.00 },
    'accounts/fireworks/models/glm-5p2': { input: 1.40, output: 4.40 },
    'accounts/fireworks/models/glm-5p1': { input: 1.40, output: 4.40 },
    'accounts/fireworks/models/muse-glimmer-30b': { input: 0.35, output: 1.50 },
    'accounts/fireworks/models/nemotron-lightning-3.5-30b-a3b': { input: 0.05, output: 0.20 },
    'accounts/fireworks/models/minimax-m3': { input: 0.30, output: 1.20 },
    'accounts/fireworks/models/gpt-oss-120b': { input: 0.15, output: 0.60 },
    'accounts/fireworks/models/qwen3p7-plus': { input: 0.40, output: 1.60 },

    // Gemini
    'gemini-1.5-pro': { input: 1.25, output: 5.00 },
    'gemini-1.5-flash': { input: 0.35, output: 1.05 },
    'gemini-1.5-flash-8b': { input: 0.20, output: 0.80 },

    // OpenRouter / Together
    'deepseek/deepseek-coder': { input: 0.14, output: 0.28 },
    'qwen/qwen-2-72b-instruct': { input: 1.20, output: 1.20 },
    'anthropic/claude-3.5-sonnet': { input: 3.00, output: 15.00 },
    'Qwen/Qwen2-72B-Instruct': { input: 1.20, output: 1.20 },
    'deepseek-ai/deepseek-coder-33b-instruct': { input: 0.20, output: 0.20 },
    'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo': { input: 1.04, output: 1.04 }
};
