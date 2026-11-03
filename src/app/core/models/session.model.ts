// src/app/core/models/session.model.ts

import { Message } from './message.model';

export interface ChatSession {
    id: string;
    name: string;
    providerId: string;
    model: string;
    messages: Message[];
    useParams: boolean;
    temperature: number;
    topP: number;
    maxTokens: number;
    jsonMode: boolean;
    systemPrompt: string;
    tokenLimitOverride?: 'max_tokens' | 'max_completion_tokens';
}

export const DEFAULT_SESSION_SETTINGS = {
    useParams: true,
    temperature: 0.7,
    topP: 1,
    maxTokens: 8192,
    jsonMode: false,
    systemPrompt: 'You are a helpful assistant.'
} as const;

export function createSession(id: string, name: string, providerId = 'openai', model = 'gpt-4o-mini'): ChatSession {
    return {
        id,
        name,
        providerId,
        model,
        messages: [],
        ...DEFAULT_SESSION_SETTINGS
    };
}
