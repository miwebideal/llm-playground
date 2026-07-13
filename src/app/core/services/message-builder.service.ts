// src/app/core/services/message-builder.service.ts

import { Injectable } from '@angular/core';
import { ChatSession, GlobalConfig, Message } from '../../models/chat.models';
import { ApiMessage } from '../../models/api.types';

@Injectable({ providedIn: 'root' })
export class MessageBuilderService {

    build(
        userContent: string,
        session: ChatSession,
        config: GlobalConfig,
        history: Message[]
    ): ApiMessage[] {
        const result: ApiMessage[] = [];

        if (session.useParams && session.systemPrompt?.trim()) {
            result.push({ role: 'system', content: session.systemPrompt });
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
