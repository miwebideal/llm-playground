// src/app/core/models/config.model.ts

export interface GlobalConfig {
    includeHistory: boolean;
    streamMode: boolean;
    isCompareMode: boolean;
    includeReasoningExport: boolean;
    activeSessionId: string;
    splitWidth: number;
}

export const DEFAULT_CONFIG: GlobalConfig = {
    includeHistory: true,
    streamMode: false,
    isCompareMode: false,
    includeReasoningExport: true,
    activeSessionId: 'session-a',
    splitWidth: 50
};
