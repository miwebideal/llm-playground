// src/app/features/playground/session-bar/session-bar.component.ts

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LucideChevronDown, LucideCopy } from '@lucide/angular';
import { ModelRegistryService } from '../../../core/registry/model-registry.service';
import { ClipboardService } from '../../../core/services/clipboard.service';
import { MetricsService, RunStats } from '../../../core/services/metrics.service';
import { ConfigStore } from '../../../core/stores/config.store';
import { ProviderStore } from '../../../core/stores/provider.store';
import { RunLogStore } from '../../../core/stores/run-log.store';
import { SessionStore } from '../../../core/stores/session.store';
import { activeSessions } from '../../../core/state/session.selectors';
import { formatCost, formatMs, formatTokens } from '../../../utils/format.utils';

interface Lane extends RunStats {
    label: string;
    color: string;
    offset: number;
    width: number;
}

@Component({
    selector: 'app-session-bar',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [LucideChevronDown, LucideCopy],
    templateUrl: './session-bar.component.html'
})
export class SessionBarComponent {

    private sessionStore = inject(SessionStore);
    private configStore = inject(ConfigStore);
    private providerStore = inject(ProviderStore);
    private metrics = inject(MetricsService);
    private registry = inject(ModelRegistryService);
    private clipboard = inject(ClipboardService);
    readonly runLog = inject(RunLogStore);

    readonly open = signal(false);
    readonly fmtCost = formatCost;
    readonly fmtMs = formatMs;
    readonly fmtTokens = formatTokens;

    private readonly active = computed(() => activeSessions(
        this.sessionStore.sessions(), this.configStore.state(), this.providerStore.providers()
    ));

    readonly lanes = computed<Lane[]>(() => {
        const rows = this.active()
            .map((session, index) => ({ index, stats: this.metrics.statsFor(session) }))
            .filter((row): row is { index: number; stats: RunStats } =>
                !!row.stats && !row.stats.hasError && !!row.stats.totalTime);
        const max = Math.max(1, ...rows.map(row => row.stats.totalTime ?? 0));
        return rows.map(({ index, stats }) => ({
            ...stats,
            label: this.registry.resolve({ providerId: stats.provider, model: stats.model }).label,
            color: index === 0 ? 'var(--model-a)' : 'var(--model-b)',
            offset: ((stats.ttft ?? 0) / max) * 100,
            width: Math.max(2, (((stats.totalTime ?? 0) - (stats.ttft ?? 0)) / max) * 100)
        }));
    });

    readonly fastest = computed(() => {
        const lanes = this.lanes();
        if (lanes.length < 2) return null;
        return [...lanes].sort((a, b) => (a.totalTime ?? Infinity) - (b.totalTime ?? Infinity))[0];
    });

    readonly cheapest = computed(() => {
        const lanes = this.lanes().filter(lane => lane.cost !== null);
        if (lanes.length < 2) return null;
        return [...lanes].sort((a, b) => (a.cost ?? Infinity) - (b.cost ?? Infinity))[0];
    });

    async copy(): Promise<void> {
        const lines = this.lanes().map(lane =>
            `${lane.label} (${lane.provider}) · TTFT ${formatMs(lane.ttft)} · total ${formatMs(lane.totalTime)} · ${lane.tps?.toFixed(1) ?? '—'} t/s · ${lane.tokensOut ?? '—'} tok · ${lane.costLabel ?? '—'}`
        );
        await this.clipboard.copy(lines.join('\n'), 'Resumen copiado');
    }
}
