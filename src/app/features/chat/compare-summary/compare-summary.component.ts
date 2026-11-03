// src/app/features/chat/compare-summary/compare-summary.component.ts

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LucideX } from '@lucide/angular';
import { MetricsService, WinnerCriterion } from '../../../core/services/metrics.service';
import { ClipboardService } from '../../../core/services/clipboard.service';
import { ConfigStore } from '../../../core/stores/config.store';
import { ProviderStore } from '../../../core/stores/provider.store';
import { SessionStore } from '../../../core/stores/session.store';
import { activeSessions } from '../../../core/state/session.selectors';

@Component({
    selector: 'app-compare-summary',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [LucideX],
    templateUrl: './compare-summary.component.html'
})
export class CompareSummaryComponent {

    private sessionStore = inject(SessionStore);
    private configStore = inject(ConfigStore);
    private providerStore = inject(ProviderStore);
    private metrics = inject(MetricsService);
    private clipboard = inject(ClipboardService);

    readonly open = signal(false);
    readonly criterion = signal<WinnerCriterion>('totalTime');

    readonly activeSessions = computed(() => activeSessions(
        this.sessionStore.sessions(),
        this.configStore.state(),
        this.providerStore.providers()
    ));

    readonly visible = computed(() => {
        if (!this.configStore.state().isCompareMode) return false;
        const sessions = this.activeSessions();
        if (sessions.length < 2) return false;
        return !!this.metrics.lastValidAssistant(sessions[0]) && !!this.metrics.lastValidAssistant(sessions[1]);
    });

    readonly pair = computed(() => {
        if (!this.visible()) return null;
        const [first, second] = this.activeSessions();
        const a = this.metrics.statsFor(first);
        const b = this.metrics.statsFor(second);
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

    setCriterion(criterion: WinnerCriterion): void {
        this.criterion.set(criterion);
    }

    toggle(): void {
        this.open.update(value => !value);
    }

    close(): void {
        this.open.set(false);
    }

    fmtMs(value: number | null): string {
        return value === null ? '—' : `${Math.round(value)} ms`;
    }

    fmtNum(value: number | null): string {
        return value === null ? '—' : value.toFixed(1);
    }

    async copyTable(): Promise<void> {
        const pair = this.pair();
        if (!pair) return;
        const lines = [
            `Comparación (${this.label[this.criterion()]})`,
            `${pair.a.name} · ${pair.a.model}`,
            `  TTFT ${this.fmtMs(pair.a.ttft)} · Total ${this.fmtMs(pair.a.totalTime)} · Out ${pair.a.tokensOut ?? '—'} · TPS ${this.fmtNum(pair.a.tps)} · ${pair.a.costLabel ?? '—'}`,
            `${pair.b.name} · ${pair.b.model}`,
            `  TTFT ${this.fmtMs(pair.b.ttft)} · Total ${this.fmtMs(pair.b.totalTime)} · Out ${pair.b.tokensOut ?? '—'} · TPS ${this.fmtNum(pair.b.tps)} · ${pair.b.costLabel ?? '—'}`,
            pair.winner === 'tie' ? 'Empate en métricas'
                : pair.winner === 'a' ? `Mejor en ${this.label[this.criterion()]}: ${pair.a.name}`
                    : pair.winner === 'b' ? `Mejor en ${this.label[this.criterion()]}: ${pair.b.name}`
                        : 'Sin datos suficientes'
        ];
        await this.clipboard.copy(lines.join('\n'), 'Comparación copiada');
    }
}
