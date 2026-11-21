// src/app/core/services/llm-api.service.ts

import { Injectable, inject } from '@angular/core';
import { ChatSession, GlobalConfig, ProviderConfig, AppError } from '../models';
import { ApiMessage, ApiPayload, ApiResponse, ApiErrorResponse } from '../models';
import { ModelRegistryService } from '../registry/model-registry.service';
import { mapHttpError } from './api-error.mapper';
import { StreamChunk } from './stream-parser.service';
import { providerEndpoint, providerHeaders } from './provider-endpoint';

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object';
}

@Injectable({ providedIn: 'root' })
export class LlmApiService {

    private readonly controllers = new Map<string, AbortController>();
    private registry = inject(ModelRegistryService);

    async send(
        provider: ProviderConfig,
        session: ChatSession,
        config: GlobalConfig,
        messages: ApiMessage[]
    ): Promise<Response> {
        const controller = new AbortController();
        this.controllers.set(session.id, controller);

        return fetch(providerEndpoint(provider, 'chat/completions'), {
            method: 'POST',
            headers: providerHeaders(provider),
            body: JSON.stringify(this.buildPayload(session, config, messages)),
            signal: controller.signal,
        });
    }

    buildPayload(session: ChatSession, config: GlobalConfig, messages: ApiMessage[]): ApiPayload {
        const capabilities = this.registry.capabilities(session);
        const payload: ApiPayload = {
            model: session.model,
            messages,
            stream: config.streamMode,
        };

        if (config.streamMode) payload.stream_options = { include_usage: true };

        if (session.useParams) {
            if (capabilities.temperature) payload.temperature = session.temperature;
            if (capabilities.topP) payload.top_p = session.topP;

            if (capabilities.tokenLimit === 'max_completion_tokens') {
                payload.max_completion_tokens = session.maxTokens;
            } else if (capabilities.tokenLimit === 'max_tokens') {
                payload.max_tokens = session.maxTokens;
            }

            if (capabilities.jsonMode && session.jsonMode) {
                payload.response_format = { type: 'json_object' };
            }
        }

        return payload;
    }

    signalFor(sessionId: string): AbortSignal | undefined {
        return this.controllers.get(sessionId)?.signal;
    }

    release(sessionId: string): void {
        this.controllers.delete(sessionId);
    }

    abort(sessionId: string): void {
        this.controllers.get(sessionId)?.abort();
        this.controllers.delete(sessionId);
    }

    abortAll(): void {
        this.controllers.forEach(controller => controller.abort());
        this.controllers.clear();
    }

    async toAppError(response: Response): Promise<AppError> {
        const text = await response.text().catch(() => '');
        let providerMessage = text || response.statusText;
        let code: string | number | undefined;

        if (text) {
            try {
                const parsed = JSON.parse(text) as ApiErrorResponse;
                providerMessage = parsed.error?.message || providerMessage;
                code = parsed.error?.code;
            } catch {
                // el cuerpo no era JSON: usamos el texto tal cual
            }
        }

        return mapHttpError(response.status, providerMessage, code);
    }

    extractContent(data: unknown): string {
        if (!isRecord(data)) return '';
        const choices = (data as ApiResponse).choices;
        const content = choices?.[0]?.message?.content;
        return typeof content === 'string' ? content : '';
    }

    extractUsage(data: unknown): { tokensIn?: number; tokensOut?: number } {
        if (!isRecord(data)) return {};
        const usage = (data as ApiResponse).usage;
        if (!usage) return {};
        return {
            tokensIn: usage.prompt_tokens,
            tokensOut: usage.completion_tokens
        };
    }

    extractFinishReason(data: unknown): string | undefined {
        if (!isRecord(data)) return undefined;
        const choices = (data as ApiResponse).choices;
        return choices?.[0]?.finish_reason ?? undefined;
    }

    usageFromChunk(chunk: StreamChunk): { tokensIn?: number; tokensOut?: number } {
        if (!chunk.usage) return {};
        return {
            tokensIn: chunk.usage.prompt_tokens,
            tokensOut: chunk.usage.completion_tokens
        };
    }
}
