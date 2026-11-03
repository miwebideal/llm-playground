// src/app/core/services/metrics.service.ts

import { Injectable, inject } from '@angular/core';
import { ChatSession, Message, MessageMetrics } from '../models';
import { ModelRegistryService } from '../registry/model-registry.service';

export interface RunStats {
    sessionId: string;
    name: string;
    model: string;
    provider: string;
    ttft: number | null;
    totalTime: number | null;
    tokensIn: number | null;
    tokensOut: number | null;
    estimated: boolean;
    tps: number | null;
    cost: number | null;
    costLabel: string | null;
    hasError: boolean;
}

export type WinnerCriterion = 'totalTime' | 'ttft' | 'cost' | 'tps';

@Injectable({ providedIn: 'root' })
export class MetricsService {

    private registry = inject(ModelRegistryService);

    getTPS(metrics?: MessageMetrics | null): number | null {
        if (metrics?.tokensOut == null || metrics.totalTime == null || metrics.ttft == null) return null;
        const generationMs = metrics.totalTime - metrics.ttft;
        if (generationMs <= 0) return null;
        return metrics.tokensOut / (generationMs / 1000);
    }

    formatTPS(metrics?: MessageMetrics | null): string | null {
        const tps = this.getTPS(metrics);
        return tps === null ? null : tps.toFixed(1);
    }

    getCostValue(metrics?: MessageMetrics | null, providerId?: string, model?: string): number | null {
        if (metrics?.tokensIn == null || metrics.tokensOut == null || !providerId || !model) return null;
        const pricing = this.registry.pricing(providerId, model);
        if (!pricing) return null;
        return (metrics.tokensIn / 1_000_000) * pricing.input
            + (metrics.tokensOut / 1_000_000) * pricing.output;
    }

    formatCost(metrics?: MessageMetrics | null, providerId?: string, model?: string): string | null {
        const total = this.getCostValue(metrics, providerId, model);
        if (total === null) return null;
        if (total > 0 && total < 0.0001) return '< $0.0001';
        return '$' + total.toFixed(4);
    }

    lastValidAssistant(session: ChatSession): Message | null {
        for (let i = session.messages.length - 1; i >= 0; i--) {
            const message = session.messages[i];
            if (message.role === 'assistant' && !message.isStreaming) return message;
        }
        return null;
    }

    statsFor(session: ChatSession): RunStats | null {
        const message = this.lastValidAssistant(session);
        if (!message) return null;
        const model = message.model || session.model;
        const provider = message.provider || session.providerId;
        return {
            sessionId: session.id,
            name: session.name,
            model: model || '—',
            provider: provider || '—',
            ttft: message.metrics?.ttft ?? null,
            totalTime: message.metrics?.totalTime ?? null,
            tokensIn: message.metrics?.tokensIn ?? null,
            tokensOut: message.metrics?.tokensOut ?? null,
            estimated: !!message.metrics?.estimated,
            tps: this.getTPS(message.metrics),
            cost: this.getCostValue(message.metrics, provider, model),
            costLabel: this.formatCost(message.metrics, provider, model),
            hasError: !!message.error
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

    private value(stats: RunStats, criterion: WinnerCriterion): number | null {
        if (criterion === 'totalTime') return stats.totalTime;
        if (criterion === 'ttft') return stats.ttft;
        if (criterion === 'cost') return stats.cost;
        return stats.tps;
    }
}
