// src/app/core/models/app-error.ts

export type AppErrorType =
    | 'auth'
    | 'insufficient_quota'
    | 'rate_limit'
    | 'not_found'
    | 'context_length'
    | 'invalid_params'
    | 'server'
    | 'network'
    | 'timeout'
    | 'aborted'
    | 'stream'
    | 'unknown';

export interface AppError {
    type: AppErrorType;
    message: string;
    providerMessage?: string;
    code?: number | string;
    retryable: boolean;
    hint?: string;
}

export interface AppErrorMeta {
    title: string;
    icon: 'alert' | 'key' | 'clock' | 'search' | 'credit' | 'ruler' | 'wifi' | 'server';
    tone: 'danger' | 'warning';
}

export const APP_ERROR_META: Record<AppErrorType, AppErrorMeta> = {
    auth: { title: 'Autenticación', icon: 'key', tone: 'danger' },
    insufficient_quota: { title: 'Sin saldo/cuota', icon: 'credit', tone: 'danger' },
    rate_limit: { title: 'Rate limit', icon: 'clock', tone: 'warning' },
    not_found: { title: 'Modelo o endpoint no encontrado', icon: 'search', tone: 'danger' },
    context_length: { title: 'Contexto demasiado largo', icon: 'ruler', tone: 'warning' },
    invalid_params: { title: 'Parámetros inválidos', icon: 'alert', tone: 'warning' },
    server: { title: 'Error del proveedor', icon: 'server', tone: 'danger' },
    network: { title: 'Error de red', icon: 'wifi', tone: 'danger' },
    timeout: { title: 'Tiempo de espera agotado', icon: 'clock', tone: 'warning' },
    aborted: { title: 'Detenido', icon: 'clock', tone: 'warning' },
    stream: { title: 'Error de streaming', icon: 'alert', tone: 'danger' },
    unknown: { title: 'Error inesperado', icon: 'alert', tone: 'danger' }
};

export function isAppError(value: unknown): value is AppError {
    return !!value && typeof value === 'object'
        && typeof (value as AppError).type === 'string'
        && typeof (value as AppError).message === 'string';
}

export function toAppError(value: unknown, fallback = 'Error desconocido'): AppError {
    if (isAppError(value)) return value;
    if (value instanceof Error) {
        const aborted = value.name === 'AbortError';
        return {
            type: aborted ? 'aborted' : 'network',
            message: value.message || fallback,
            retryable: !aborted
        };
    }
    if (typeof value === 'string' && value) return { type: 'unknown', message: value, retryable: true };
    return { type: 'unknown', message: fallback, retryable: true };
}

export function legacyError(value: string): AppError {
    return { type: 'unknown', message: value, retryable: true };
}
