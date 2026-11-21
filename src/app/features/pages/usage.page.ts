// src/app/features/pages/usage.page.ts

import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ModelRegistryService } from '../../core/registry/model-registry.service';
import { ModalService } from '../../core/services/modal.service';
import { RunLogStore } from '../../core/stores/run-log.store';
import { providerName } from '../../constants/providers.constants';
import { formatCost, formatMs, formatTokens } from '../../utils/format.utils';

@Component({
    selector: 'app-usage-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './usage.page.html',
    host: { class: 'page' }
})
export class UsagePage {

    readonly log = inject(RunLogStore);
    private registry = inject(ModelRegistryService);
    private modal = inject(ModalService);

    readonly fmtCost = formatCost;
    readonly fmtMs = formatMs;
    readonly fmtTokens = formatTokens;
    providerName = providerName;

    readonly maxTps = computed(() => Math.max(1, ...this.log.byModel().map(m => m.avgTps ?? 0)));
    readonly recent = computed(() => [...this.log.records()].reverse().slice(0, 25));

    /** Gasto de los últimos 14 días para el gráfico de barras. */
    readonly daily = computed(() => {
        const days: { key: string; label: string; cost: number; runs: number }[] = [];
        const today = new Date();
        for (let i = 13; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            days.push({ key, label: d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }), cost: 0, runs: 0 });
        }
        const byKey = new Map(days.map(d => [d.key, d]));
        for (const r of this.log.records()) {
            const day = byKey.get(r.at.slice(0, 10));
            if (day) { day.cost += r.cost ?? 0; day.runs++; }
        }
        const max = Math.max(...days.map(d => d.cost), 0.000001);
        return days.map(d => ({ ...d, height: d.cost ? Math.max(4, (d.cost / max) * 100) : 0 }));
    });

    label(provider: string, model: string): string {
        return this.registry.resolve({ providerId: provider, model }).label;
    }

    time(iso: string): string {
        return new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    }

    async clear(): Promise<void> {
        const ok = await this.modal.confirm({
            title: 'Borrar historial de uso',
            message: 'Se borran las métricas guardadas en este navegador. Los chats no se tocan.',
            confirmText: 'Borrar',
            isDanger: true
        });
        if (ok) this.log.clear();
    }
}
