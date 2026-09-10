// src/app/core/services/export.service.ts

import { Injectable, inject } from '@angular/core';
import { ToastService } from './toast.service';
import { ClipboardService } from './clipboard.service';
import { MetricsService, RunStats } from './metrics.service';
import { ChatSession, GlobalConfig } from '../../models/chat.models';

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

    exportChat(sessions: ChatSession[], config: GlobalConfig, includeReasoning: boolean) {
        const active = this.active(sessions, config);
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

    exportMarkdown(sessions: ChatSession[], config: GlobalConfig, includeReasoning: boolean) {
        const active = this.active(sessions, config);
        if (!this.hasMessages(active)) {
            this.toast.warning('No hay mensajes para exportar');
            return;
        }

        this.download(new Blob([this.generateMarkdown(active, config, includeReasoning)], { type: 'text/markdown' }), `chat-${this.fileName(active, config)}.md`);
        this.toast.success('Conversación exportada como Markdown');
    }

    async copyChat(sessions: ChatSession[], config: GlobalConfig, includeReasoning: boolean) {
        const active = this.active(sessions, config);
        if (!this.hasMessages(active)) {
            this.toast.warning('No hay mensajes para copiar');
            return;
        }
        await this.clipboard.copy(this.generateMarkdown(active, config, includeReasoning), 'Chat copiado al portapapeles');
    }

    private active(sessions: ChatSession[], config: GlobalConfig): ChatSession[] {
        return config.isCompareMode ? sessions.slice(0, 2) : [sessions[0]];
    }

    private hasMessages(sessions: ChatSession[]): boolean {
        return sessions.some(s => s?.messages.length > 0);
    }

    private clean(sessions: ChatSession[], includeReasoning: boolean): ChatSession[] {
        return sessions.map(session => ({
            ...session,
            messages: session.messages.map(m => {
                const { isStreaming, error, ...cleanMsg } = m;
                if (!includeReasoning) delete cleanMsg.reasoning;
                return cleanMsg;
            })
        }));
    }

    private comparison(sessions: ChatSession[], config: GlobalConfig) {
        if (!config.isCompareMode || sessions.length < 2) return null;
        const a = this.metrics.statsFor(sessions[0]);
        const b = this.metrics.statsFor(sessions[1]);
        if (!a || !b) return null;

        const name = (side: 'a' | 'b' | 'tie' | null, aN: string, bN: string) => {
            if (side === 'a') return aN;
            if (side === 'b') return bN;
            if (side === 'tie') return 'Empate';
            return '—';
        };

        return {
            a, b,
            winnerTime: name(this.metrics.winner(a, b, 'totalTime'), a.name, b.name),
            winnerTps: name(this.metrics.winner(a, b, 'tps'), a.name, b.name),
            winnerCost: name(this.metrics.winner(a, b, 'cost'), a.name, b.name),
            winnerTtft: name(this.metrics.winner(a, b, 'ttft'), a.name, b.name)
        };
    }

    private generateMarkdown(sessions: ChatSession[], config: GlobalConfig, includeReasoning: boolean): string {
        let md = `# LLM Playground Export\n\n`;
        md += `**Fecha:** ${new Date().toLocaleString('es-AR')}\n\n`;

        const cmp = this.comparison(sessions, config);
        if (cmp) {
            md += `## Comparación\n\n`;
            md += `| | ${cmp.a.name} | ${cmp.b.name} |\n`;
            md += `|---|---|---|\n`;
            md += `| Modelo | ${cmp.a.model} | ${cmp.b.model} |\n`;
            md += `| TTFT | ${this.ms(cmp.a.ttft)} | ${this.ms(cmp.b.ttft)} |\n`;
            md += `| Total | ${this.ms(cmp.a.totalTime)} | ${this.ms(cmp.b.totalTime)} |\n`;
            md += `| Tokens out | ${cmp.a.tokensOut ?? '—'} | ${cmp.b.tokensOut ?? '—'} |\n`;
            md += `| TPS | ${this.n(cmp.a.tps)} | ${this.n(cmp.b.tps)} |\n`;
            md += `| Costo | ${cmp.a.costLabel ?? '—'} | ${cmp.b.costLabel ?? '—'} |\n\n`;
            md += `- Más rápido: **${cmp.winnerTime}**\n`;
            md += `- Menor TTFT: **${cmp.winnerTtft}**\n`;
            md += `- Mayor TPS: **${cmp.winnerTps}**\n`;
            md += `- Menor costo: **${cmp.winnerCost}**\n\n`;
            md += `_Métricas de la generación. La calidad la decide quien lee._\n\n`;
        }

        sessions.forEach(session => {
            md += `## ${session.name} (${session.model || 'Sin configurar'})\n\n`;
            session.messages.forEach(m => {
                md += `### ${m.role === 'user' ? 'Tú' : 'AI'}\n`;
                if (includeReasoning && m.reasoning) {
                    md += `> **Proceso de pensamiento:**\n> ${m.reasoning.split('\n').join('\n> ')}\n\n`;
                }
                md += `${m.content}\n\n`;
            });
            md += `---\n\n`;
        });

        return md;
    }

    private fileName(sessions: ChatSession[], config: GlobalConfig): string {
        const part = (s: ChatSession) => (s.model || 'llm').split('/').pop() || 'llm';
        return config.isCompareMode && sessions[1]
            ? `comparacion-${part(sessions[0])}-vs-${part(sessions[1])}`
            : part(sessions[0]);
    }

    private ms(v: number | null): string {
        return v === null ? '—' : `${Math.round(v)} ms`;
    }

    private n(v: number | null): string {
        return v === null ? '—' : v.toFixed(1);
    }

    private download(blob: Blob, filename: string) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
}