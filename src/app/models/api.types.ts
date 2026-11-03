// src/app/models/api.types.ts

export interface ApiMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface ApiPayload {
    model: string;
    messages: ApiMessage[];
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
    max_completion_tokens?: number;
    response_format?: { type: string };
    stream: boolean;
    stream_options?: { include_usage: boolean };
}

export interface ApiUsage {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
}

export interface ApiChoice {
    message?: {
        content?: string;
        reasoning?: string;
    };
    delta?: {
        content?: string;
        reasoning?: string;
        reasoning_content?: string;
    };
    finish_reason?: string | null;
}

export interface ApiResponse {
    choices?: ApiChoice[];
    usage?: ApiUsage;
}

export interface GeminiResponse {
    candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        finishReason?: string;
    }>;
    usageMetadata?: ApiUsage;
}

export interface StreamChunkRaw {
    choices?: ApiChoice[];
    usage?: ApiUsage;
    error?: {
        message?: string;
        type?: string;
        code?: string | number;
    };
}

export interface ApiErrorResponse {
    error?: {
        message?: string;
        type?: string;
        code?: string | number;
    };
}
