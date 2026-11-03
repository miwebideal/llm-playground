// src/app/core/models/message.model.ts

import { AppError } from './app-error';

export type FinishReason =
    | 'stop'
    | 'length'
    | 'content_filter'
    | 'tool_calls'
    | 'stopped'
    | 'error'
    | (string & {});

export interface MessageMetrics {
    ttft?: number;
    totalTime?: number;
    tokensIn?: number;
    tokensOut?: number;
    estimated?: boolean;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    reasoning?: string;
    timestamp: Date;
    model?: string;
    provider?: string;
    finishReason?: FinishReason;
    metrics?: MessageMetrics;
    isStreaming?: boolean;
    error?: AppError;
}

export function createMessage(partial: Partial<Message> & Pick<Message, 'role' | 'content'>): Message {
    return {
        id: partial.id ?? crypto.randomUUID(),
        timestamp: partial.timestamp ?? new Date(),
        ...partial
    } as Message;
}
