// src/app/services/export.service.ts

import { Injectable, inject } from '@angular/core';
import { ToastService } from './toast.service';
import { Message } from '../models/llm.models';
import { guessProvider } from '../utils/provider.utils';
import { ConfigState } from '../stores/config.store';

@Injectable({ providedIn: 'root' })
export class ExportService {

    private toast = inject(ToastService);

    exportChat(messagesA: Message[], messagesB: Message[], config: ConfigState) {
        if (messagesA.length === 0 && messagesB.length === 0) {
            this.toast.warning('No hay mensajes para exportar');
            return;
        }

        const data: Record<string, any> = {
            exportedAt: new Date().toISOString(),
            config: {
                model: config.model,
                provider: guessProvider(config.apiUrl),
                apiUrl: config.apiUrl,
                temperature: config.temperature,
                maxTokens: config.maxTokens,
                systemPrompt: config.systemPrompt,
                includeHistory: config.includeHistory,
                streamMode: config.streamMode,
                isCompareMode: config.isCompareMode,
            }
        };

        let fileName = '';

        if (config.isCompareMode) {
            data['config'].modelB = config.modelB;
            data['config'].providerB = guessProvider(config.apiUrlB);
            data['config'].apiUrlB = config.apiUrlB;
            data['messagesA'] = messagesA;
            data['messagesB'] = messagesB;

            const safeModelA = (config.model || 'modeloA').split('/').pop();
            const safeModelB = (config.modelB || 'modeloB').split('/').pop();
            fileName = `comparacion-${safeModelA}-vs-${safeModelB}`;
        } else {
            data['messages'] = messagesA;
            fileName = (config.model || 'llm').split('/').pop() || 'llm';
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const dateStr = new Date().toISOString().slice(0, 10);
        a.download = `chat-${fileName}-${dateStr}.json`;

        a.click();
        URL.revokeObjectURL(url);

        this.toast.success('Conversación exportada');
    }

}
