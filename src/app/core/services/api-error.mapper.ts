// src/app/core/services/api-error.mapper.ts

import { AppError, AppErrorType } from '../models';
import { findErrorTip } from '../../constants/api-errors.constants';

const RETRYABLE: AppErrorType[] = ['rate_limit', 'server', 'network', 'timeout', 'stream'];

export function mapHttpError(status: number, providerMessage?: string, code?: string | number): AppError {
    const message = providerMessage || `Error ${status}`;
    const lower = message.toLowerCase();
    let type: AppErrorType = 'unknown';

    if (status === 401 || status === 403 || lower.includes('api key') || lower.includes('unauthorized')) type = 'auth';
    else if (status === 402 || lower.includes('insufficient_quota') || lower.includes('quota') || lower.includes('billing')) type = 'insufficient_quota';
    else if (status === 429 || lower.includes('rate limit')) type = 'rate_limit';
    else if (status === 404 || lower.includes('not found') || lower.includes('not deployed')) type = 'not_found';
    else if (lower.includes('context') || lower.includes('too long') || lower.includes('maximum context')) type = 'context_length';
    else if (status >= 500) type = 'server';
    else if (status >= 400) type = 'invalid_params';

    return {
        type,
        message: `Error de API: ${message}`,
        providerMessage,
        code: code ?? status,
        retryable: RETRYABLE.includes(type),
        hint: findErrorTip(message, status)
    };
}

export function mapStreamError(message: string, code?: string | number): AppError {
    return {
        type: 'stream',
        message: `Error en el stream: ${message}`,
        providerMessage: message,
        code,
        retryable: true,
        hint: findErrorTip(message)
    };
}

export function abortedError(): AppError {
    return { type: 'aborted', message: 'Generación detenida por el usuario.', retryable: true };
}

export function timeoutError(seconds: number): AppError {
    return {
        type: 'timeout',
        message: `El proveedor dejó de responder durante ${seconds}s.`,
        retryable: true,
        hint: 'Probá de nuevo o revisá la conexión.'
    };
}
