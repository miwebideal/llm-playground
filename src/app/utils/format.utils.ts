// src/app/utils/format.utils.ts

export function formatCost(value: number | null | undefined): string {
    if (value == null) return '—';
    if (value === 0) return '$0';
    if (value < 0.0001) return '< $0.0001';
    return value < 1 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`;
}

export function formatMs(value: number | null | undefined): string {
    if (value == null) return '—';
    return value < 1000 ? `${Math.round(value)}ms` : `${(value / 1000).toFixed(1)}s`;
}

export function formatTokens(value: number | null | undefined): string {
    if (value == null) return '—';
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return String(value);
}

export function formatContext(value: number | undefined): string | null {
    if (!value) return null;
    return value >= 1_000_000 ? `${value / 1_000_000}M` : `${Math.round(value / 1000)}k`;
}

/** `sk-proj-abc…wxyz` → `sk-p••••wxyz`. Nunca muestra la key completa. */
export function maskSecret(value: string): string {
    if (!value) return '';
    if (value.length <= 8) return '••••••••';
    return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}
