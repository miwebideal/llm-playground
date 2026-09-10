// src/app/core/services/metrics.service.ts

import { Injectable } from '@angular/core';
import { ChatSession, Message, MessageMetrics } from '../../models/chat.models';
import { MODEL_PRICING } from '../../constants/pricing.constants';

export interface RunStats {
    sessionId: string;
    name: string;
    model: string;
    provider: string;
    ttft: number | null;
    totalTime: number | null;
    tokensIn: number | null;
    tokensOut: number | null;
    tps: number | null;
    cost: number | null;
    costLabel: string | null;
    hasError: boolean;
}

export type WinnerCriterion = 'totalTime' | 'ttft' | 'cost' | 'tps';

@Injectable({ providedIn: 'root' })
export class MetricsService {

    getTPS(metrics?: MessageMetrics | null): number | null {
        if (!metrics?.tokensOut || !metrics.totalTime || !metrics.ttft) return null;
        const genTimeSec = (metrics.totalTime - metrics.ttft) / 1000;
        if (genTimeSec <= 0) return null;
        return metrics.tokensOut / genTimeSec;
    }

    formatTPS(metrics?: MessageMetrics | null): string | null {
        const tps = this.getTPS(metrics);
        return tps === null ? null : tps.toFixed(1);
    }

    getCostValue(metrics?: MessageMetrics | null, model?: string): number | null {
        if (!metrics?.tokensIn || !metrics.tokensOut || !model) return null;
        const pricing = MODEL_PRICING[model];
        if (!pricing) return null;
        const total = (metrics.tokensIn / 1_000_000) * pricing.input
            + (metrics.tokensOut / 1_000_000) * pricing.output;
        return total === 0 ? null : total;
    }

    formatCost(metrics?: MessageMetrics | null, model?: string): string | null {
        const total = this.getCostValue(metrics, model);
        if (total === null) return null;
        if (total < 0.0001) return '< $0.0001';
        return '$' + total.toFixed(4);
    }

    lastValidAssistant(session: ChatSession): Message | null {
        for (let i = session.messages.length - 1; i >= 0; i--) {
            const m = session.messages[i];
            if (m.role === 'assistant' && !m.isStreaming) return m;
        }
        return null;
    }

    statsFor(session: ChatSession): RunStats | null {
        const msg = this.lastValidAssistant(session);
        if (!msg) return null;
        const model = msg.model || session.model;
        const cost = this.getCostValue(msg.metrics, model);
        return {
            sessionId: session.id,
            name: session.name,
            model: model || '—',
            provider: msg.provider || session.providerId || '—',
            ttft: msg.metrics?.ttft ?? null,
            totalTime: msg.metrics?.totalTime ?? null,
            tokensIn: msg.metrics?.tokensIn ?? null,
            tokensOut: msg.metrics?.tokensOut ?? null,
            tps: this.getTPS(msg.metrics),
            cost,
            costLabel: this.formatCost(msg.metrics, model),
            hasError: !!msg.error
        };
    }

    winner(a: RunStats, b: RunStats, criterion: WinnerCriterion = 'totalTime'): 'a' | 'b' | 'tie' | null {
        const va = this.value(a, criterion);
        const vb = this.value(b, criterion);
        if (va === null && vb === null) return null;
        if (va === null) return 'b';
        if (vb === null) return 'a';
        if (va === vb) return 'tie';
        if (criterion === 'tps') return va > vb ? 'a' : 'b';
        return va < vb ? 'a' : 'b';
    }

    private value(s: RunStats, c: WinnerCriterion): number | null {
        if (c === 'totalTime') return s.totalTime;
        if (c === 'ttft') return s.ttft;
        if (c === 'cost') return s.cost;
        return s.tps;
    }
}