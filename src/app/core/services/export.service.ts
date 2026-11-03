// src/app/core/services/export.service.ts

import { Injectable, inject } from '@angular/core';
import { ChatSession, GlobalConfig, ProviderConfig } from '../models';
import { activeSessions } from '../state/session.selectors';
import { MetricsService, RunStats } from './metrics.service';
import { ToastService } from './toast.service';
import { ClipboardService } from './clipboard.service';

interface ExportData {
    exportedAt: string;
    config: GlobalConfig;
    sessions: ChatSession[];
    comparison: {
        a: RunStats;
        b: RunStats;
        winnerTime: string;
        winnerTps: string;
        winnerCost: string;
        winnerTtft: string;
    } | null;
}

@Injectable({ providedIn: 'root' })
export class ExportService {

    private toast = inject(ToastService);
    private clipboard = inject(ClipboardService);
    private metrics = inject(MetricsService);

    exportChat(sessions: ChatSession[], config: GlobalConfig, providers: ProviderConfig[], includeReasoning: boolean): void {
        const active = this.active(sessions, config, providers);
        if (!this.hasMessages(active)) {
            this.toast.warning('No hay mensajes para exportar');
            return;
        }

        const data: ExportData = {
            exportedAt: new Date().toISOString(),
            config,
            sessions: this.clean(active, includeReasoning),
            comparison: this.comparison(active, config)
        };

        this.download(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `chat-${this.fileName(active, config)}.json`);
        this.toast.success('Conversación exportada como JSON');
    }

    exportMarkdown(sessions: ChatSession[], config: GlobalConfig, providers: ProviderConfig[], includeReasoning: boolean): void {
        const active = this.active(sessions, config, providers);
        if (!this.hasMessages(active)) {
            this.toast.warning('No hay mensajes para exportar');
            return;
        }

        this.download(new Blob([this.generateMarkdown(active, config, includeReasoning)], { type: 'text/markdown' }), `chat-${this.fileName(active, config)}.md`);
        this.toast.success('Conversación exportada como Markdown');
    }

    async copyChat(sessions: ChatSession[], config: GlobalConfig, providers: ProviderConfig[], includeReasoning: boolean): Promise<void> {
        const active = this.active(sessions, config, providers);
        if (!this.hasMessages(active)) {
            this.toast.warning('No hay mensajes para copiar');
            return;
        }
        await this.clipboard.copy(this.generateMarkdown(active, config, includeReasoning), 'Chat copiado al portapapeles');
    }

    private active(sessions: ChatSession[], config: GlobalConfig, providers: ProviderConfig[]): ChatSession[] {
        return activeSessions(sessions, config, providers);
    }

    private hasMessages(sessions: ChatSession[]): boolean {
        return sessions.some(session => session.messages.length > 0);
    }

    private clean(sessions: ChatSession[], includeReasoning: boolean): ChatSession[] {
        return sessions.map(session => ({
            ...session,
            messages: session.messages.map(message => {
                const clean = { ...message, isStreaming: false, timestamp: new Date(message.timestamp) };
                if (!includeReasoning) delete clean.reasoning;
                return clean;
            })
        }));
    }

    private comparison(sessions: ChatSession[], config: GlobalConfig) {
        if (!config.isCompareMode || sessions.length < 2) return null;
        const a = this.metrics.statsFor(sessions[0]);
        const b = this.metrics.statsFor(sessions[1]);
        if (!a || !b) return null;

        const name = (side: 'a' | 'b' | 'tie' | null, aName: string, bName: string) => {
            if (side === 'a') return aName;
            if (side === 'b') return bName;
            if (side === 'tie') return 'Empate';
            return '—';
        };

        return {
            a,
            b,
            winnerTime: name(this.metrics.winner(a, b, 'totalTime'), a.name, b.name),
            winnerTps: name(this.metrics.winner(a, b, 'tps'), a.name, b.name),
            winnerCost: name(this.metrics.winner(a, b, 'cost'), a.name, b.name),
            winnerTtft: name(this.metrics.winner(a, b, 'ttft'), a.name, b.name)
        };
    }

    private generateMarkdown(sessions: ChatSession[], config: GlobalConfig, includeReasoning: boolean): string {
        let markdown = `# LLM Playground Export\n\n`;
        markdown += `**Fecha:** ${new Date().toLocaleString('es-AR')}\n\n`;

        const comparison = this.comparison(sessions, config);
        if (comparison) {
            markdown += `## Comparación\n\n`;
            markdown += `| | ${comparison.a.name} | ${comparison.b.name} |\n`;
            markdown += `|---|---|---|\n`;
            markdown += `| Modelo | ${comparison.a.model} | ${comparison.b.model} |\n`;
            markdown += `| TTFT | ${this.ms(comparison.a.ttft)} | ${this.ms(comparison.b.ttft)} |\n`;
            markdown += `| Total | ${this.ms(comparison.a.totalTime)} | ${this.ms(comparison.b.totalTime)} |\n`;
            markdown += `| Tokens out | ${comparison.a.tokensOut ?? '—'} | ${comparison.b.tokensOut ?? '—'} |\n`;
            markdown += `| TPS | ${this.n(comparison.a.tps)} | ${this.n(comparison.b.tps)} |\n`;
            markdown += `| Costo | ${comparison.a.costLabel ?? '—'} | ${comparison.b.costLabel ?? '—'} |\n\n`;
            markdown += `- Más rápido: **${comparison.winnerTime}**\n`;
            markdown += `- Menor TTFT: **${comparison.winnerTtft}**\n`;
            markdown += `- Mayor TPS: **${comparison.winnerTps}**\n`;
            markdown += `- Menor costo: **${comparison.winnerCost}**\n\n`;
            markdown += `_Métricas de la generación. La calidad la decide quien lee._\n\n`;
        }

        sessions.forEach(session => {
            markdown += `## ${session.name} (${session.model || 'Sin configurar'})\n\n`;
            session.messages.forEach(message => {
                markdown += `### ${message.role === 'user' ? 'Tú' : 'AI'}\n`;
                if (includeReasoning && message.reasoning) {
                    markdown += `> **Proceso de pensamiento:**\n> ${message.reasoning.split('\n').join('\n> ')}\n\n`;
                }
                if (message.error) {
                    markdown += `> **Error (${message.error.type}):** ${message.error.message}\n\n`;
                }
                if (message.content) markdown += `${message.content}\n\n`;
            });
            markdown += `---\n\n`;
        });

        return markdown;
    }

    private fileName(sessions: ChatSession[], config: GlobalConfig): string {
        const part = (session?: ChatSession) => (session?.model || 'llm').split('/').pop() || 'llm';
        return config.isCompareMode && sessions[1]
            ? `comparacion-${part(sessions[0])}-vs-${part(sessions[1])}`
            : part(sessions[0]);
    }

    private ms(value: number | null): string {
        return value === null ? '—' : `${Math.round(value)} ms`;
    }

    private n(value: number | null): string {
        return value === null ? '—' : value.toFixed(1);
    }

    private download(blob: Blob, filename: string): void {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }
}
