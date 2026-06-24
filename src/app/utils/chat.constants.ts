// src/app/utils/chat.constants.ts

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

// Diccionario de precios ($ por 1M tokens) [Input, Output]
export const MODEL_PRICING: Record<string, { input: number, output: number }> = {
    // OpenAI
    'gpt-5.4-mini': { input: 0.75, output: 4.50 },
    'gpt-5.4-nano': { input: 0.20, output: 1.25 },
    'gpt-4.1-mini': { input: 0.40, output: 1.60 },
    'gpt-4.1-nano': { input: 0.10, output: 0.40 },
    'gpt-5-nano': { input: 0.05, output: 0.40 },
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },

    // DeepInfra
    'deepseek-ai/DeepSeek-V4-Pro': { input: 1.60, output: 3.38 },
    'deepseek-ai/DeepSeek-V4-Flash': { input: 0.14, output: 0.28 },
    'Qwen/Qwen3.6-35B-A3B': { input: 0.15, output: 0.95 },
    'Qwen/Qwen3.5-397B-A17B': { input: 0.60, output: 3.60 },
    'zai-org/GLM-5.2': { input: 1.40, output: 4.40 },
    'moonshotai/Kimi-K2.7-Code': { input: 0.95, output: 4.00 },
    'google/gemma-4-26B-A4B-it': { input: 0.28, output: 0.86 },
    'deepseek-ai/DeepSeek-V3.2': { input: 0.287, output: 0.431 },
    'google/gemma-4-31B-it': { input: 0.28, output: 0.86 },

    // Groq
    'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
    'llama-3.1-8b-instant': { input: 0.05, output: 0.08 },
    'meta-llama/llama-4-scout-17b-16e-instruct': { input: 0.11, output: 0.34 },
    'qwen/qwen3.6-27b': { input: 0.60, output: 3.00 },
    'openai/gpt-oss-120b': { input: 0.15, output: 0.60 },

    // Fireworks
    'accounts/fireworks/models/kimi-k2p7-code': { input: 0.95, output: 4.00 },
    'accounts/fireworks/models/glm-5p1': { input: 1.40, output: 4.40 },
    'accounts/fireworks/models/glm-5p2': { input: 1.40, output: 4.40 },
    'accounts/fireworks/models/minimax-m3': { input: 0.30, output: 1.20 },
    'accounts/fireworks/models/deepseek-v4-flash': { input: 0.14, output: 0.28 },
    'accounts/fireworks/models/gpt-oss-120b': { input: 0.15, output: 0.60 },
    'accounts/fireworks/models/qwen3p7-plus': { input: 0.40, output: 1.60 },

    // Gemini
    'gemini-1.5-pro': { input: 1.25, output: 5.00 },
    'gemini-1.5-flash': { input: 0.35, output: 1.05 },
    'gemini-1.5-flash-8b': { input: 0.20, output: 0.80 },

    // OpenRouter
    'deepseek/deepseek-coder': { input: 0.14, output: 0.28 },
    'qwen/qwen-2-72b-instruct': { input: 1.20, output: 1.20 },
    'anthropic/claude-3.5-sonnet': { input: 3.00, output: 15.00 },

    // Together AI
    'Qwen/Qwen2-72B-Instruct': { input: 1.20, output: 1.20 },
    'deepseek-ai/deepseek-coder-33b-instruct': { input: 0.20, output: 0.20 },
    'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo': { input: 1.04, output: 1.04 }
};

export const QUICK_PROMPTS = [
    {
        title: '📊 Tabla Comparativa',
        text: 'Crea una tabla comparativa detallada entre React, Angular y Vue. Incluye columnas para: Curva de aprendizaje, Rendimiento, Ecosistema y Casos de uso ideales.'
    },
    {
        title: '💻 Script Python',
        text: 'Escribe un script en Python que lea un archivo CSV, filtre las filas donde la columna "estado" sea "activo", y exporte el resultado a un nuevo archivo JSON. Incluye manejo de errores.'
    },
    {
        title: '🤔 Razonamiento Lógico',
        text: 'Resuelve este acertijo paso a paso: Un granjero tiene que cruzar un río con un lobo, una cabra y una lechuga. El bote solo tiene espacio para él y una cosa más. Si deja solos al lobo y la cabra, el lobo se la come. Si deja a la cabra y la lechuga, la cabra se la come. ¿Cómo hace para cruzar todo a salvo?'
    },
    {
        title: '📝 Resumen',
        text: 'Explica el concepto de "Computación Cuántica" como si se lo estuvieras explicando a un niño de 10 años, usando analogías simples.'
    },
    {
        title: '✍️ Escritura con Restricción',
        text: 'Escribe una historia de terror de exactamente tres párrafos. El primer párrafo debe terminar con la palabra "silencio", el segundo con "sombra" y el tercero con "nunca". No uses la palabra "miedo" en ningún momento.'
    },
    {
        title: '⚖️ Dilema Ético',
        text: 'Analiza el impacto del uso de inteligencia artificial en la creación artística. Presenta dos argumentos sólidos a favor (como democratización) y dos en contra (como propiedad intelectual), y concluye con una reflexión neutral sobre el futuro del arte.'
    }
];
