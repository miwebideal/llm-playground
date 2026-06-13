// src/app/services/llm-api.service.ts

import { Injectable } from '@angular/core';
import { LlmConfig } from '../models/llm.models';
import { ApiMessage, ApiPayload, ApiResponse, GeminiResponse, ApiErrorResponse } from '../models/api.types';
import { StreamParserService, StreamChunk } from './stream-parser.service';

@Injectable({ providedIn: 'root' })
export class LlmApiService {

    private abortController: AbortController | null = null;
    private activeRequest: Promise<Response> | null = null;

    constructor(private parser: StreamParserService) { }

    isActive(): boolean {
        return this.activeRequest !== null && this.abortController !== null;
    }

    cancel() {
        if (this.abortController) {
            this.abortController.abort();
        }
        this.abortController = null;
        this.activeRequest = null;
    }

    async send(
        cfg: LlmConfig,
        messages: ApiMessage[],
        stream: boolean
    ): Promise<Response> {
        this.cancel();

        const controller = new AbortController();
        this.abortController = controller;

        const payload: ApiPayload = {
            model: cfg.model,
            messages,
            temperature: cfg.temperature,
            max_tokens: cfg.maxTokens,
            stream,
            ...(stream && { stream_options: { include_usage: true } }),
        };

        const requestPromise = fetch(cfg.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cfg.apiToken}`,
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
        });

        this.activeRequest = requestPromise;

        try {
            const response = await requestPromise;
            this.activeRequest = null;
            // Mantener abortController por si se necesita cancelar la lectura del body
            return response;
        } catch (error) {
            this.activeRequest = null;
            this.abortController = null;
            throw error;
        }
    }

    parseStreamLine(line: string): StreamChunk | null {
        return this.parser.parseLine(line);
    }

    extractContent(data: unknown): string {
        const response = data as ApiResponse | GeminiResponse;

        if ('choices' in response && response.choices?.[0]?.message?.content) {
            return response.choices[0].message.content;
        }

        if ('candidates' in response && response.candidates?.[0]?.content?.parts?.[0]?.text) {
            return response.candidates[0].content.parts[0].text;
        }

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