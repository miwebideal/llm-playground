// src/app/utils/token.utils.ts

import { Message } from "../models";

export function estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
}

export function estimateContextTokens(history: Message[], input: string): number {
    if (!history.length && !input) return 0;
    const text = history.map(m => m.content).join(' ') + input;
    return Math.ceil(text.length / 4);
}