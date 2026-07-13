// src/app/models/chat.models.ts

export interface MessageMetrics {
    ttft?: number;
    totalTime?: number;
    tokensIn?: number;
    tokensOut?: number;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    reasoning?: string;
    timestamp: Date;
    model?: string;
    provider?: string;
    finishReason?: string;
    metrics?: MessageMetrics;
    isStreaming?: boolean;
    error?: string;
}

export interface ProviderConfig {
    id: string;
    name: string;
    apiUrl: string;
    apiToken: string;
}

export interface ChatSession {
    id: string;
    name: string;
    providerId: string;
    model: string;
    messages: Message[];
    useParams: boolean;
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
}

export interface GlobalConfig {
    includeHistory: boolean;
    streamMode: boolean;
    isCompareMode: boolean;
}
