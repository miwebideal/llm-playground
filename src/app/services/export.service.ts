// src/app/services/export.service.ts

import { Injectable, inject } from '@angular/core';
import { ToastService } from './toast.service';
import { Message, LlmConfig } from '../models/llm.models';

@Injectable({ providedIn: 'root' })
export class ExportService {

    private toast = inject(ToastService);

    exportChat(messages: Message[], config: LlmConfig) {
        if (messages.length === 0) {
            this.toast.warning('No hay mensajes para exportar');
            return;
        }

        const data = {
            exportedAt: new Date().toISOString(),
            config: {
                model: config.model,
                provider: this.guessProvider(config.apiUrl),
                apiUrl: config.apiUrl,
                temperature: config.temperature,
                maxTokens: config.maxTokens,
                systemPrompt: config.systemPrompt,
                includeHistory: config.includeHistory,
                streamMode: config.streamMode,
            },
            messages: messages.map(m => ({
                role: m.role,
                content: m.content,
                reasoning: m.reasoning,
                timestamp: m.timestamp,
                metrics: m.metrics,
            })),
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-${config.model?.replace(/\//g, '-') || 'llm'}-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.toast.success('Conversación exportada');
    }

    private guessProvider(apiUrl: string): string {
        const url = apiUrl.toLowerCase();
        if (url.includes('deepinfra')) return 'deepinfra';
        if (url.includes('fireworks')) return 'fireworks';
        if (url.includes('google') || url.includes('gemini')) return 'gemini';
        if (url.includes('openrouter')) return 'openrouter';
        if (url.includes('groq')) return 'groq';
        if (url.includes('together')) return 'together';
        if (url.includes('openai')) return 'openai';
        return 'unknown';
    }

}