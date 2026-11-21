// src/app/core/stores/run-log.store.ts

import { Injectable, computed, inject, signal } from '@angular/core';
import { Message } from '../models';
import { MetricsService } from '../services/metrics.service';
import { StorageService, STORAGE_KEYS } from '../services/storage.service';

/** Una corrida terminada (respuesta completa o detenida). Sin contenido: sólo métricas. */
export interface RunRecord {
    at: string;
    provider: string;
    model: string;
    ttft?: number;
    totalTime?: number;
    tokensIn?: number;
    tokensOut?: number;
    tps?: number;
    cost?: number;
    estimated?: boolean;
    error?: boolean;
}

export interface ModelUsage {
    key: string;
    provider: string;
    model: string;
    runs: number;
    errors: number;
    tokens: number;
    cost: number;
    avgTtft: number | null;
    avgTps: number | null;
}

const MAX_RECORDS = 2000;

function isRecords(data: unknown): boolean {
    return Array.isArray(data) && data.every(item =>
        !!item && typeof item === 'object' && typeof (item as RunRecord).model === 'string'
    );
}

function average(values: (number | undefined)[]): number | null {
    const valid = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0);
    return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
}

@Injectable({ providedIn: 'root' })
export class RunLogStore {

    private storage = inject(StorageService);
    private metrics = inject(MetricsService);

    private readonly _records = signal<RunRecord[]>(this.storage.load<RunRecord[]>(STORAGE_KEYS.runLog, isRecords) ?? []);
    readonly records = this._records.asReadonly();

    /** Corridas desde que se abrió la pestaña: es la "sesión de prueba" actual. */
    private readonly sessionStart = new Date().toISOString();
    readonly sessionRecords = computed(() => this._records().filter(r => r.at >= this.sessionStart));

    readonly sessionTotals = computed(() => this.totals(this.sessionRecords()));
    readonly allTotals = computed(() => this.totals(this._records()));

    readonly byModel = computed<ModelUsage[]>(() => {
        const groups = new Map<string, RunRecord[]>();
        for (const record of this._records()) {
            const key = `${record.provider}::${record.model}`;
            groups.set(key, [...(groups.get(key) ?? []), record]);
        }
        return [...groups.entries()].map(([key, list]) => ({
            key,
            provider: list[0].provider,
            model: list[0].model,
            runs: list.length,
            errors: list.filter(r => r.error).length,
            tokens: list.reduce((sum, r) => sum + (r.tokensIn ?? 0) + (r.tokensOut ?? 0), 0),
            cost: list.reduce((sum, r) => sum + (r.cost ?? 0), 0),
            avgTtft: average(list.map(r => r.ttft)),
            avgTps: average(list.map(r => r.tps))
        })).sort((a, b) => b.runs - a.runs);
    });

    record(message: Message): void {
        if (message.role !== 'assistant' || !message.model) return;
        const metrics = message.metrics;
        const provider = message.provider ?? 'unknown';
        const entry: RunRecord = {
            at: new Date().toISOString(),
            provider,
            model: message.model,
            ttft: metrics?.ttft,
            totalTime: metrics?.totalTime,
            tokensIn: metrics?.tokensIn,
            tokensOut: metrics?.tokensOut,
            tps: this.metrics.getTPS(metrics) ?? undefined,
            cost: this.metrics.getCostValue(metrics, provider, message.model) ?? undefined,
            estimated: metrics?.estimated,
            error: !!message.error
        };
        this._records.update(list => [...list, entry].slice(-MAX_RECORDS));
        this.storage.save(STORAGE_KEYS.runLog, this._records());
    }

    clear(): void {
        this._records.set([]);
        this.storage.saveNow(STORAGE_KEYS.runLog, []);
    }

    private totals(list: RunRecord[]) {
        return {
            runs: list.length,
            tokens: list.reduce((sum, r) => sum + (r.tokensIn ?? 0) + (r.tokensOut ?? 0), 0),
            cost: list.reduce((sum, r) => sum + (r.cost ?? 0), 0),
            avgTps: average(list.map(r => r.tps)),
            avgTtft: average(list.map(r => r.ttft))
        };
    }
}
