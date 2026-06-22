// src/app/utils/provider.utils.ts

export function guessProvider(apiUrl: string): string {

    if (!apiUrl) return 'unknown';
    const url = apiUrl.toLowerCase();
    if (url.includes('deepinfra')) return 'deepinfra';
    if (url.includes('fireworks')) return 'fireworks';
    if (url.includes('google') || url.includes('gemini')) return 'gemini';
    if (url.includes('openrouter')) return 'openrouter';
    if (url.includes('groq')) return 'groq';
    if (url.includes('together')) return 'together';
    if (url.includes('openai')) return 'openai';
    return 'unknown';

}
