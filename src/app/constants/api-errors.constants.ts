// src/app/constants/api-errors.constants.ts

export const API_ERROR_TIPS: Record<string, string> = {
    'max_tokens': 'El modelo no soporta este parámetro. Revisá el tipo de límite de tokens.',
    'max_completion_tokens': 'El modelo no soporta este parámetro. Revisá el tipo de límite de tokens.',
    'temperature': 'Este modelo no permite modificar la temperatura. Desactivá los parámetros.',
    'top_p': 'Este modelo no permite modificar top_p. Desactivá los parámetros.',
    'json_object': 'Este modelo no soporta forzar JSON Mode. Apagá JSON Mode.',
    'response_format': 'Este modelo no soporta forzar JSON Mode. Apagá JSON Mode.',
    'api_key': 'Revisá que tu API Key sea correcta y tenga saldo.',
    'unauthorized': 'Error de autenticación. Revisá tu API Key.',
    'not found': 'El modelo no existe, está mal escrito o fue deprecado.',
    'not deployed': 'El modelo no está disponible en este proveedor.',
    '429': 'Rate limit alcanzado. Esperá un momento o revisá tu cuota.',
    'rate limit': 'Rate limit alcanzado. Esperá un momento o revisá tu cuota.',
    'quota': 'Sin saldo o cuota insuficiente. Revisá tu cuenta del proveedor.',
    'insufficient_quota': 'Sin saldo o cuota insuficiente. Revisá tu cuenta del proveedor.',
    'context_length': 'El contexto es demasiado largo. Reducí el historial o el prompt.',
    'context length': 'El contexto es demasiado largo. Reducí el historial o el prompt.',
    'too long': 'El contexto es demasiado largo. Reducí el historial o el prompt.'
};

export function findErrorTip(message: string, status?: number): string | undefined {
    const lower = message.toLowerCase();
    for (const [key, tip] of Object.entries(API_ERROR_TIPS)) {
        if (lower.includes(key) || (status !== undefined && String(status) === key)) return tip;
    }
    return undefined;
}
