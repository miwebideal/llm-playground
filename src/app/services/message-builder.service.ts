// src/app/services/message-builder.service.ts

import { Injectable } from '@angular/core';
import { LlmConfig, Message } from '../models/llm.models';
import { ApiMessage } from '../models/api.types';

@Injectable({ providedIn: 'root' })
export class MessageBuilderService {

    build(
        userContent: string,
        config: LlmConfig,
        history: Message[]
    ): ApiMessage[] {
        const result: ApiMessage[] = [];

        if (config.systemPrompt?.trim()) {
            result.push({ role: 'system', content: config.systemPrompt });
        }

        if (config.includeHistory) {
            for (const msg of history) {
                if (msg.role === 'system') continue;
                if (msg.error || msg.isStreaming) continue;
                result.push({ role: msg.role, content: msg.content });
            }
        }

        result.push({ role: 'user', content: userContent });

        return result;
    }

}