// src/app/constants/models.constants.ts

export const API_PRESETS: Record<string, { apiUrl: string }> = {
    openai: { apiUrl: 'https://api.openai.com/v1/chat/completions' },
    deepinfra: { apiUrl: 'https://api.deepinfra.com/v1/openai/chat/completions' },
    fireworks: { apiUrl: 'https://api.fireworks.ai/inference/v1/chat/completions' },
    gemini: { apiUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions' },
    openrouter: { apiUrl: 'https://openrouter.ai/api/v1/chat/completions' },
    groq: { apiUrl: 'https://api.groq.com/openai/v1/chat/completions' },
    together: { apiUrl: 'https://api.together.xyz/v1/chat/completions' },
};

export const API_PRESET_KEYS = Object.keys(API_PRESETS);

export interface AiModel {
    id: string;
    name: string;
}

export const AI_MODELS: Record<string, AiModel[]> = {
    'OpenAI': [
        { id: 'gpt-5.4-mini', name: 'GPT-5.4 Mini' },
        { id: 'gpt-5.4-nano', name: 'GPT-5.4 Nano' },
        { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
        { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano' },
        { id: 'gpt-5-nano', name: 'GPT-5 Nano' },
        { id: 'gpt-4o', name: 'GPT-4o' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini' }
    ],
    'DeepInfra': [
        { id: 'deepseek-ai/DeepSeek-V4-Pro', name: 'DeepSeek V4 Pro' },
        { id: 'deepseek-ai/DeepSeek-V4-Flash', name: 'DeepSeek V4 Flash' },
        { id: 'Qwen/Qwen3.6-35B-A3B', name: 'Qwen 3.6 (35B)' },
        { id: 'Qwen/Qwen3.5-397B-A17B', name: 'Qwen 3.5 (397B)' },
        { id: 'zai-org/GLM-5.2', name: 'GLM 5.2' },
        { id: 'moonshotai/Kimi-K2.7-Code', name: 'Kimi K2.7 Code' },
        { id: 'google/gemma-4-26B-A4B-it', name: 'Gemma 4 (26B)' },
        { id: 'deepseek-ai/DeepSeek-V3.2', name: 'DeepSeek V3.2' },
        { id: 'google/gemma-4-31B-it', name: 'Gemma 4 (31B)' }
    ],
    'Groq': [
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 (70B) Versatile' },
        { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 (8B) Instant' },
        { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout (17B)' },
        { id: 'qwen/qwen3.6-27b', name: 'Qwen 3.6 (27B)' },
        { id: 'openai/gpt-oss-120b', name: 'GPT-OSS (120B)' }
    ],
    'Fireworks AI': [
        { id: 'accounts/fireworks/models/kimi-k2p7-code', name: 'Kimi K2.7 Code' },
        { id: 'accounts/fireworks/models/glm-5p1', name: 'GLM 5.1' },
        { id: 'accounts/fireworks/models/glm-5p2', name: 'GLM 5.2' },
        { id: 'accounts/fireworks/models/minimax-m3', name: 'MiniMax M3' },
        { id: 'accounts/fireworks/models/deepseek-v4-flash', name: 'DeepSeek V4 Flash' },
        { id: 'accounts/fireworks/models/gpt-oss-120b', name: 'GPT-OSS (120B)' },
        { id: 'accounts/fireworks/models/qwen3p7-plus', name: 'Qwen 3.7 Plus' }
    ],
    'Gemini': [
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
        { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B' }
    ],
    'OpenRouter': [
        { id: 'deepseek/deepseek-coder', name: 'DeepSeek Coder' },
        { id: 'qwen/qwen-2-72b-instruct', name: 'Qwen 2 (72B)' },
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
        { id: 'openai/gpt-4o', name: 'GPT-4o' }
    ],
    'Together AI': [
        { id: 'Qwen/Qwen2-72B-Instruct', name: 'Qwen 2 (72B)' },
        { id: 'deepseek-ai/deepseek-coder-33b-instruct', name: 'DeepSeek Coder (33B)' },
        { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', name: 'Llama 3.1 (70B) Turbo' }
    ]
};
