// src/app/constants/api.constants.ts

// Substrings para identificar modelos que usan max_completion_tokens en lugar de max_tokens
export const MODELS_USING_COMPLETION_TOKENS = [
    'o1',
    'o3',
    'gpt-5',
    'sol',
    'terra',
    'luna'
];

// Diccionario de tips amigables basados en substrings de errores comunes de las APIs
export const API_ERROR_TIPS: Record<string, string> = {
    'max_tokens': '💡 Tip: El modelo no soporta este parámetro. Probá desactivando los parámetros en el panel.',
    'max_completion_tokens': '💡 Tip: El modelo no soporta este parámetro. Probá desactivando los parámetros en el panel.',
    'temperature': '💡 Tip: Este modelo no permite modificar la temperatura. Desactivá los parámetros.',
    'json_object': '💡 Tip: Este modelo no soporta forzar JSON Mode nativamente. Apagá el JSON Mode.',
    'response_format': '💡 Tip: Este modelo no soporta forzar JSON Mode nativamente. Apagá el JSON Mode.',
    'api_key': '🔑 Tip: Revisá que tu API Key sea correcta y tenga saldo.',
    '401': '🔑 Tip: Error de Autenticación. Revisá tu API Key.'
};
