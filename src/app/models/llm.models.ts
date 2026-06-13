// src/app/models/llm.models.ts

export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    reasoning?: string;
    timestamp: Date;
    metrics?: {
        ttft?: number;
        totalTime?: number;
        tokensIn?: number;
        tokensOut?: number;
    };
    isStreaming?: boolean;
    error?: string;
}

export interface LlmConfig {
    apiUrl: string;
    apiToken: string;
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
    includeHistory: boolean;
    streamMode: boolean;
}