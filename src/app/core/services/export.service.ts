// src/app/services/export.service.ts

import { Injectable, inject } from '@angular/core';
import { ToastService } from './toast.service';
import { ChatSession, GlobalConfig, Message } from '../../models/chat.models';

interface ExportData {
    exportedAt: string;
    config: GlobalConfig;
    sessions: ChatSession[];
}

@Injectable({ providedIn: 'root' })
export class ExportService {

    private toast = inject(ToastService);

    exportChat(sessions: ChatSession[], config: GlobalConfig) {
        const activeSessions = config.isCompareMode ? sessions.slice(0, 2) : [sessions[0]];

        if (activeSessions.every(s => s.messages.length === 0)) {
            this.toast.warning('No hay mensajes para exportar');
            return;
        }

        // Limpiamos los mensajes para no exportar estados de streaming o errores temporales
        const cleanSessions = activeSessions.map(session => ({
            ...session,
            messages: session.messages.map(m => {
                const { isStreaming, error, ...cleanMsg } = m;
                return cleanMsg;
            })
        }));

        const data: ExportData = {
            exportedAt: new Date().toISOString(),
            config,
            sessions: cleanSessions
        };

        const fileName = config.isCompareMode
            ? `comparacion-${activeSessions[0].model.split('/').pop()}-vs-${activeSessions[1].model.split('/').pop()}`
            : (activeSessions[0].model || 'llm').split('/').pop() || 'llm';

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        this.downloadBlob(blob, `chat-${fileName}.json`);
        this.toast.success('Conversación exportada como JSON');
    }

    private generateMarkdown(sessions: ChatSession[], config: GlobalConfig): string {
        const activeSessions = config.isCompareMode ? sessions.slice(0, 2) : [sessions[0]];

        let md = `# LLM Playground Export\n\n`;
        md += `**Fecha:** ${new Date().toLocaleString('es-AR')}\n\n`;

        activeSessions.forEach(session => {
            md += `## Chat - ${session.name} (${session.model || 'Sin configurar'})\n\n`;
            session.messages.forEach(m => {
                md += `### ${m.role === 'user' ? 'Tú' : 'AI'}\n${m.content}\n\n`;
            });
            md += `---\n\n`;
        });

        return md;
    }

    exportMarkdown(sessions: ChatSession[], config: GlobalConfig) {
        const activeSessions = config.isCompareMode ? sessions.slice(0, 2) : [sessions[0]];
        if (activeSessions.every(s => s.messages.length === 0)) {
            this.toast.warning('No hay mensajes para exportar');
            return;
        }

        const md = this.generateMarkdown(sessions, config);
        const blob = new Blob([md], { type: 'text/markdown' });

        const fileName = config.isCompareMode
            ? `comparacion-${activeSessions[0].model.split('/').pop()}-vs-${activeSessions[1].model.split('/').pop()}`
            : (activeSessions[0].model || 'llm').split('/').pop() || 'llm';

        this.downloadBlob(blob, `chat-${fileName}.md`);
        this.toast.success('Conversación exportada como Markdown');
    }

    async copyChat(sessions: ChatSession[], config: GlobalConfig) {
        const activeSessions = config.isCompareMode ? sessions.slice(0, 2) : [sessions[0]];
        if (activeSessions.every(s => s.messages.length === 0)) {
            this.toast.warning('No hay mensajes para copiar');
            return;
        }

        const md = this.generateMarkdown(sessions, config);
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
