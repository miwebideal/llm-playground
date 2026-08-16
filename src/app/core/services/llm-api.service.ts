// src/app/core/services/llm-api.service.ts

import { Injectable } from '@angular/core';
import { GlobalConfig, ChatSession, ProviderConfig } from '../../models/chat.models';
import { ApiMessage, ApiPayload, ApiResponse, GeminiResponse, ApiErrorResponse } from '../../models/api.types';
import { StreamParserService, StreamChunk } from './stream-parser.service';
import { MODELS_USING_COMPLETION_TOKENS, API_ERROR_TIPS } from '../../constants/api.constants';

@Injectable({ providedIn: 'root' })
export class LlmApiService {

    private controllers = new Set<AbortController>();

    constructor(private parser: StreamParserService) { }

    async send(provider: ProviderConfig, session: ChatSession, config: GlobalConfig, messages: ApiMessage[]): Promise<Response> {
        const controller = new AbortController();
        this.controllers.add(controller);

        const payload: ApiPayload = {
            model: session.model,
            messages,
            stream: config.streamMode,
            ...(config.streamMode && { stream_options: { include_usage: true } }),
        };

        if (session.useParams) {
            payload.temperature = session.temperature;

            if (session.topP !== undefined) {
                payload.top_p = session.topP;
            }

            // Verificamos contra la constante si el modelo requiere max_completion_tokens
            const modelLower = session.model.toLowerCase();
            const requiresCompletionTokens = MODELS_USING_COMPLETION_TOKENS.some(m => modelLower.includes(m));

            if (requiresCompletionTokens) {
                payload.max_completion_tokens = session.maxTokens;
            } else {
                payload.max_tokens = session.maxTokens;
            }

            if (session.jsonMode) {
                payload.response_format = { type: 'json_object' };
            }
        }

        try {
            const response = await fetch(provider.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${provider.apiToken}`,
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

    async extractSmartError(response: Response): Promise<string> {
        try {
            const errorData = await response.json() as ApiErrorResponse;
            const originalError = errorData.error?.message || response.statusText;
            const errorLower = originalError.toLowerCase();

            let tip = '';

            // Buscamos si el error original hace match con nuestro diccionario
            for (const [key, message] of Object.entries(API_ERROR_TIPS)) {
                if (errorLower.includes(key) || response.status.toString() === key) {
                    tip = `\n\n${message}`;
                    break;
                }
            }

            // Devolvemos el error real + el tip (si existe)
            return `❌ Error de API: ${originalError}${tip}`;
        } catch {
            return `❌ Error ${response.status}: No se pudo conectar con el proveedor.`;
        }
    }

    cleanup() {
        this.cancel();
    }
}
