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

export interface ChatSession {
    id: string;
    name: string; // Ej: "Modelo A", "Modelo B"
    apiUrl: string;
    apiToken: string;
    model: string;
    provider: string;
    messages: Message[];
}

export interface GlobalConfig {
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
    useParams: boolean;
    includeHistory: boolean;
    streamMode: boolean;
    isCompareMode: boolean;
}
