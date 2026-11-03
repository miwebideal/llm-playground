// src/app/core/services/stream-parser.service.ts

import { Injectable } from '@angular/core';
import { ApiUsage, StreamChunkRaw } from '../../models/api.types';
import { AppError } from '../models';
import { mapStreamError } from './api-error.mapper';

export interface StreamChunk {
    content: string;
    reasoning: string;
    finishReason?: string | null;
    usage?: ApiUsage;
    error?: AppError;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object';
}

@Injectable({ providedIn: 'root' })
export class StreamParserService {

    parseLine(line: string): StreamChunk | null {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':') || trimmed.startsWith('event:')) return null;
        if (!trimmed.startsWith('data:')) return null;

        const payload = trimmed.slice(5).trim();
        if (!payload || payload === '[DONE]') return null;

        try {
            const parsed: unknown = JSON.parse(payload);
            if (!isRecord(parsed)) return null;

            if (parsed['error']) {
                const error = parsed['error'] as { message?: string; code?: string | number };
                return { content: '', reasoning: '', error: mapStreamError(error.message || 'Error del proveedor', error.code) };
            }

            const raw = parsed as StreamChunkRaw;
            const choice = raw.choices?.[0];
            const delta = choice?.delta ?? {};
            const content = delta.content ?? '';
            const reasoning = delta.reasoning_content ?? delta.reasoning ?? '';
            const finishReason = choice?.finish_reason ?? undefined;
            const usage = raw.usage;

            if (!content && !reasoning && !usage && finishReason === undefined) return null;

            return { content, reasoning, finishReason, usage };
        } catch {
            return null;
        }
    }
}
