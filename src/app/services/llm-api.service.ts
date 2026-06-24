// src/app/services/llm-api.service.ts

import { Injectable } from '@angular/core';
import { LlmConfig } from '../models/llm.models';
import { ApiMessage, ApiPayload, ApiResponse, GeminiResponse, ApiErrorResponse } from '../models/api.types';
import { StreamParserService, StreamChunk } from './stream-parser.service';

@Injectable({ providedIn: 'root' })
export class LlmApiService {

    private controllers = new Set<AbortController>();

    constructor(private parser: StreamParserService) { }

    async send(cfg: LlmConfig, messages: ApiMessage[], stream: boolean): Promise<Response> {
        const controller = new AbortController();
        this.controllers.add(controller);

        const payload: ApiPayload = {
            model: cfg.model,
            messages,
            stream,
            ...(stream && { stream_options: { include_usage: true } }),
        };

        if (cfg.useParams) {
            payload.temperature = cfg.temperature;
            payload.max_tokens = cfg.maxTokens;
        }

        try {
            const response = await fetch(cfg.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${cfg.apiToken}`,
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });
            return response;
        } catch (error) {
            this.controllers.delete(controller);
            throw error;
        }
    }

    cancel() {
        this.controllers.forEach(c => c.abort());
        this.controllers.clear();
    }

    parseStreamLine(line: string): StreamChunk | null {
        return this.parser.parseLine(line);
    }

    extractContent(data: unknown): string {
        const response = data as ApiResponse | GeminiResponse;
        if ('choices' in response && response.choices?.[0]?.message?.content) return response.choices[0].message.content;
        if ('candidates' in response && response.candidates?.[0]?.content?.parts?.[0]?.text) return response.candidates[0].content.parts[0].text;
        return JSON.stringify(data);
    }

    extractError(data: unknown): string {
        const error = (data as ApiErrorResponse).error;
        return error?.message ?? 'Error desconocido de la API';
    }

    cleanup() {
        this.cancel();
    }

}
