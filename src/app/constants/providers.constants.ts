// src/app/constants/providers.constants.ts

export interface ProviderPreset {
    id: string;
    name: string;
    apiUrl: string;
}

export const CUSTOM_PROVIDER_ID = 'custom';

export const PROVIDER_PRESETS: ProviderPreset[] = [
    { id: 'openai', name: 'OpenAI', apiUrl: 'https://api.openai.com/v1/chat/completions' },
    { id: 'deepinfra', name: 'DeepInfra', apiUrl: 'https://api.deepinfra.com/v1/openai/chat/completions' },
    { id: 'fireworks', name: 'Fireworks AI', apiUrl: 'https://api.fireworks.ai/inference/v1/chat/completions' },
    { id: 'gemini', name: 'Google Gemini', apiUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions' },
    { id: 'openrouter', name: 'OpenRouter', apiUrl: 'https://openrouter.ai/api/v1/chat/completions' },
    { id: 'groq', name: 'Groq', apiUrl: 'https://api.groq.com/openai/v1/chat/completions' },
    { id: 'together', name: 'Together AI', apiUrl: 'https://api.together.xyz/v1/chat/completions' },
];

export const PROVIDER_BY_ID = new Map(PROVIDER_PRESETS.map(p => [p.id, p]));

export function providerName(id: string): string {
    if (id === CUSTOM_PROVIDER_ID) return 'Personalizado';
    return PROVIDER_BY_ID.get(id)?.name ?? id;
}
