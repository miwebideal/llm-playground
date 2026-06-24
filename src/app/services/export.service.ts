// src/app/services/export.service.ts

import { Injectable, inject } from '@angular/core';
import { ToastService } from './toast.service';
import { Message } from '../models/llm.models';
import { guessProvider } from '../utils/provider.utils';
import { ConfigState } from '../stores/config.store';

interface ExportData {
    exportedAt: string;
    config: Partial<ConfigState> & { provider?: string; providerB?: string };
    messages?: Message[];
    messagesA?: Message[];
    messagesB?: Message[];
}

@Injectable({ providedIn: 'root' })
export class ExportService {

    private toast = inject(ToastService);

    // Exporta la conversación actual en formato JSON
    exportChat(messagesA: Message[], messagesB: Message[], config: ConfigState) {
        if (messagesA.length === 0 && messagesB.length === 0) {
            this.toast.warning('No hay mensajes para exportar');
            return;
        }

        const cleanMessages = (msgs: Message[]) => msgs.map(m => {
            const { isStreaming, error, ...cleanMsg } = m;
            return cleanMsg;
        });

        const data: ExportData = {
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
                useParams: config.useParams,
            }
        };

        let fileName = '';

        if (config.isCompareMode) {
            data.config.modelB = config.modelB;
            data.config.providerB = guessProvider(config.apiUrlB);
            data.config.apiUrlB = config.apiUrlB;
            data.messagesA = cleanMessages(messagesA);
            data.messagesB = cleanMessages(messagesB);
            fileName = `comparacion-${(config.model || 'A').split('/').pop()}-vs-${(config.modelB || 'B').split('/').pop()}`;
        } else {
            data.messages = cleanMessages(messagesA);
            fileName = (config.model || 'llm').split('/').pop() || 'llm';
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        this.downloadBlob(blob, `chat-${fileName}.json`);
        this.toast.success('Conversación exportada como JSON');
    }

    // Genera un string en formato Markdown con el contenido de la conversación
    private generateMarkdown(messagesA: Message[], messagesB: Message[], config: ConfigState): string {
        let md = `# LLM Playground Export\n\n`;
        md += `**Fecha:** ${new Date().toLocaleString('es-AR')}\n\n`;

        if (config.isCompareMode) {
            md += `## Chat - Modelo A (${config.model || 'Sin configurar'})\n\n`;
            messagesA.forEach(m => {
                md += `### ${m.role === 'user' ? 'Tú' : 'AI'}\n${m.content}\n\n`;
            });
            md += `---\n\n## Chat - Modelo B (${config.modelB || 'Sin configurar'})\n\n`;
            messagesB.forEach(m => {
                md += `### ${m.role === 'user' ? 'Tú' : 'AI'}\n${m.content}\n\n`;
            });
        } else {
            md += `**Modelo:** ${config.model || 'Sin configurar'}\n\n---\n\n`;
            messagesA.forEach(m => {
                md += `### ${m.role === 'user' ? 'Tú' : 'AI'}\n${m.content}\n\n`;
            });
        }
        return md;
    }

    // Exporta la conversación actual en formato Markdown (.md)
    exportMarkdown(messagesA: Message[], messagesB: Message[], config: ConfigState) {
        if (messagesA.length === 0 && messagesB.length === 0) {
            this.toast.warning('No hay mensajes para exportar');
            return;
        }
        const md = this.generateMarkdown(messagesA, messagesB, config);
        const blob = new Blob([md], { type: 'text/markdown' });

        let fileName = config.isCompareMode
            ? `comparacion-${(config.model || 'A').split('/').pop()}-vs-${(config.modelB || 'B').split('/').pop()}`
            : (config.model || 'llm').split('/').pop() || 'llm';

        this.downloadBlob(blob, `chat-${fileName}.md`);
        this.toast.success('Conversación exportada como Markdown');
    }

    // Copia la conversación actual al portapapeles en formato Markdown
    async copyChat(messagesA: Message[], messagesB: Message[], config: ConfigState) {
        if (messagesA.length === 0 && messagesB.length === 0) {
            this.toast.warning('No hay mensajes para copiar');
            return;
        }
        const md = this.generateMarkdown(messagesA, messagesB, config);
        try {
            await navigator.clipboard.writeText(md);
            this.toast.success('Chat copiado al portapapeles');
        } catch (err) {
            this.toast.error('Error al copiar el chat');
        }
    }

    private downloadBlob(blob: Blob, filename: string) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

}
