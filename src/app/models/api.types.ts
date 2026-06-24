// src/app/models/api.types.ts

export interface ApiMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface ApiPayload {
    model: string;
    messages: ApiMessage[];
    temperature?: number;
    max_tokens?: number;
    stream: boolean;
    stream_options?: {
        include_usage: boolean;
    };
}

// Respuesta no-streaming (OpenAI format)
export interface ApiResponse {
    choices: Array<{
        message: {
            content: string;
            role: string;
        };
        finish_reason: string | null;
        index: number;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    model: string;
    created: number;
    id: string;
}

// Respuesta no-streaming (Gemini format)
export interface GeminiResponse {
    candidates: Array<{
        content: {
            parts: Array<{ text: string }>;
            role: string;
        };
        finishReason: string;
        index: number;
    }>;
}

// Chunk de streaming
export interface StreamDelta {
    content?: string;
    reasoning_content?: string;
    role?: string;
}

export interface StreamChoice {
    index: number;
    delta: StreamDelta;
    finish_reason: string | null;
}

export interface StreamChunkRaw {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: StreamChoice[];
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

// Error de API
export interface ApiErrorResponse {
    error?: {
        message: string;
        type: string;
        code: string;
    };
}