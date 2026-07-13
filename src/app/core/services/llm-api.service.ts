// src/app/core/services/llm-api.service.ts

import { Injectable } from '@angular/core';
import { GlobalConfig, ChatSession } from '../../models/chat.models';
import { ApiMessage, ApiPayload, ApiResponse, GeminiResponse, ApiErrorResponse } from '../../models/api.types';
import { StreamParserService, StreamChunk } from './stream-parser.service';

@Injectable({ providedIn: 'root' })
export class LlmApiService {

    private controllers = new Set<AbortController>();

    constructor(private parser: StreamParserService) { }

    async send(session: ChatSession, config: GlobalConfig, messages: ApiMessage[]): Promise<Response> {
        const controller = new AbortController();
        this.controllers.add(controller);

        const payload: ApiPayload = {
            model: session.model,
            messages,
            stream: config.streamMode,
            ...(config.streamMode && { stream_options: { include_usage: true } }),
        };

        if (config.useParams) {
            payload.temperature = config.temperature;
            payload.max_tokens = config.maxTokens;
        }

        try {
            const response = await fetch(session.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.apiToken}`,
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
