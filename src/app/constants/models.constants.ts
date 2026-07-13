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

export const AI_MODELS: Record<string, string[]> = {
    'OpenAI': [
        'gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna',
        'gpt-5.4-mini', 'gpt-5.4-nano', 'gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-5-nano', 'gpt-4o', 'gpt-4o-mini'
    ],
    'DeepInfra': [
        'deepseek-ai/DeepSeek-V4-Pro', 'deepseek-ai/DeepSeek-V4-Flash',
        'Qwen/Qwen3.6-35B-A3B', 'Qwen/Qwen3.5-397B-A17B',
        'zai-org/GLM-5.2', 'moonshotai/Kimi-K2.7-Code',
        'google/gemma-4-26B-A4B-it', 'deepseek-ai/DeepSeek-V3.2', 'google/gemma-4-31B-it'
    ],
    'Groq': [
        'llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'meta-llama/llama-4-scout-17b-16e-instruct',
        'qwen/qwen3.6-27b', 'openai/gpt-oss-120b'
    ],
    'Fireworks AI': [
        'accounts/fireworks/models/kimi-k2p7-code', 'accounts/fireworks/models/glm-5p1',
        'accounts/fireworks/models/glm-5p2', 'accounts/fireworks/models/minimax-m3',
        'accounts/fireworks/models/deepseek-v4-flash', 'accounts/fireworks/models/gpt-oss-120b',
        'accounts/fireworks/models/qwen3p7-plus'
    ],
    'Gemini': [
        'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'
    ],
    'OpenRouter': [
        'deepseek/deepseek-coder', 'qwen/qwen-2-72b-instruct', 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o'
    ],
    'Together AI': [
        'Qwen/Qwen2-72B-Instruct', 'deepseek-ai/deepseek-coder-33b-instruct', 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo'
    ]
};
