// src/app/features/chat/compare-summary/compare-summary.component.ts

import { Component, computed, inject, signal } from '@angular/core';
import { SessionStore } from '../../../core/stores/session.store';
import { GlobalConfigStore } from '../../../core/stores/global-config.store';
import { MetricsService, WinnerCriterion } from '../../../core/services/metrics.service';
import { ClipboardService } from '../../../core/services/clipboard.service';
import { LucideX } from '@lucide/angular';

@Component({
    selector: 'app-compare-summary',
    imports: [LucideX],
    templateUrl: './compare-summary.component.html'
})
export class CompareSummaryComponent {

    private sessions = inject(SessionStore).sessions;
    private config = inject(GlobalConfigStore).state;
    private metrics = inject(MetricsService);
    private clipboard = inject(ClipboardService);

    open = signal(false);
    criterion = signal<WinnerCriterion>('totalTime');

    readonly visible = computed(() => {
        if (!this.config().isCompareMode) return false;
        const [a, b] = this.sessions();
        if (!a || !b) return false;
        return !!this.metrics.lastValidAssistant(a) && !!this.metrics.lastValidAssistant(b);
    });

    readonly pair = computed(() => {
        if (!this.visible()) return null;
        const [sa, sb] = this.sessions();
        const a = this.metrics.statsFor(sa);
        const b = this.metrics.statsFor(sb);
        if (!a || !b) return null;
        return { a, b, winner: this.metrics.winner(a, b, this.criterion()) };
    });

    readonly label: Record<WinnerCriterion, string> = {
        totalTime: 'Más rápido',
        ttft: 'Menor TTFT',
        cost: 'Menor costo',
        tps: 'Mayor TPS'
    };

    readonly criteria: WinnerCriterion[] = ['totalTime', 'ttft', 'cost', 'tps'];

    setCriterion(c: WinnerCriterion) {
        this.criterion.set(c);
    }

    toggle() {
        this.open.update(v => !v);
    }

    close() {
        this.open.set(false);
    }

    fmtMs(v: number | null): string {
        return v === null ? '—' : `${Math.round(v)} ms`;
    }

    fmtNum(v: number | null): string {
        return v === null ? '—' : v.toFixed(1);
    }

    async copyTable() {
        const p = this.pair();
        if (!p) return;
        const lines = [
            `Comparación (${this.label[this.criterion()]})`,
            `${p.a.name} · ${p.a.model}`,
            `  TTFT ${this.fmtMs(p.a.ttft)} · Total ${this.fmtMs(p.a.totalTime)} · Out ${p.a.tokensOut ?? '—'} · TPS ${this.fmtNum(p.a.tps)} · ${p.a.costLabel ?? '—'}`,
            `${p.b.name} · ${p.b.model}`,
            `  TTFT ${this.fmtMs(p.b.ttft)} · Total ${this.fmtMs(p.b.totalTime)} · Out ${p.b.tokensOut ?? '—'} · TPS ${this.fmtNum(p.b.tps)} · ${p.b.costLabel ?? '—'}`,
            p.winner === 'tie' ? 'Empate en métricas' :
                p.winner === 'a' ? `Mejor en ${this.label[this.criterion()]}: ${p.a.name}` :
                    p.winner === 'b' ? `Mejor en ${this.label[this.criterion()]}: ${p.b.name}` :
                        'Sin datos suficientes'
        ];
        await this.clipboard.copy(lines.join('\n'), 'Comparación copiada');
    }
}