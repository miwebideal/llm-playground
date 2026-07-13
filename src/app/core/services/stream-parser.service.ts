// src/app/core/services/stream-parser.service.ts

import { Injectable } from '@angular/core';
import { StreamChunkRaw } from '../../models/api.types';

export interface StreamChunk {
    content: string;
    reasoning: string;
    finish_reason?: string | null;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
    };
}

@Injectable({ providedIn: 'root' })
export class StreamParserService {

    parseLine(line: string): StreamChunk | null {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') return null;

        if (!trimmed.startsWith('data: ')) return null;

        try {
            const json = JSON.parse(trimmed.slice(6)) as StreamChunkRaw;
            const choice = json.choices?.[0];
            const delta = choice?.delta ?? {};

            return {
                content: delta.content ?? '',
                reasoning: delta.reasoning_content ?? '',
                finish_reason: choice?.finish_reason,
                usage: json.usage ? {
                    prompt_tokens: json.usage.prompt_tokens,
                    completion_tokens: json.usage.completion_tokens,
                } : undefined,
            };
        } catch {
            return null;
        }
    }

}