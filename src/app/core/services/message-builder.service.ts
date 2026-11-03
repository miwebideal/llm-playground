// src/app/core/services/message-builder.service.ts

import { Injectable, inject } from '@angular/core';
import { ChatSession, GlobalConfig, Message } from '../models';
import { ApiMessage } from '../../models/api.types';
import { ModelRegistryService } from '../registry/model-registry.service';

@Injectable({ providedIn: 'root' })
export class MessageBuilderService {

    private registry = inject(ModelRegistryService);

    build(userContent: string, session: ChatSession, config: GlobalConfig, history: Message[]): ApiMessage[] {
        const result: ApiMessage[] = [];
        const capabilities = this.registry.capabilities(session);

        if (session.useParams && capabilities.systemPrompt && session.systemPrompt?.trim()) {
            result.push({ role: 'system', content: session.systemPrompt });
        }

        if (config.includeHistory) {
            for (const message of history) {
                if (message.error || message.isStreaming || !message.content) continue;
                result.push({ role: message.role, content: message.content });
            }
        }

        result.push({ role: 'user', content: userContent });
        return result;
    }
}
