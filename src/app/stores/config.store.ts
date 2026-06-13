// src/app/stores/config.store.ts

import { Injectable, signal, computed, effect } from '@angular/core';
import { LlmConfig } from '../models/llm.models';
import { encrypt, decrypt } from '../utils/crypto.utils';

const STORAGE_KEY = 'llm-config-v1';

export interface ConfigState extends LlmConfig {
  _version: number;
}

const DEFAULT_CONFIG: ConfigState = {
  _version: 1,
  apiUrl: '',
  apiToken: '',
  model: '',
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: 'You are a helpful assistant.',
  includeHistory: true,
  streamMode: false,
};

@Injectable({ providedIn: 'root' })
export class ConfigStore {

  private _state = signal<ConfigState>(DEFAULT_CONFIG);
  private initialized = false;

  readonly state = computed(() => this._state());
  readonly apiUrl = computed(() => this._state().apiUrl);
  readonly apiToken = computed(() => this._state().apiToken);
  readonly model = computed(() => this._state().model);
  readonly temperature = computed(() => this._state().temperature);
  readonly maxTokens = computed(() => this._state().maxTokens);
  readonly systemPrompt = computed(() => this._state().systemPrompt);
  readonly includeHistory = computed(() => this._state().includeHistory);
  readonly streamMode = computed(() => this._state().streamMode);

  readonly isReady = computed(() => {
    const c = this._state();
    return !!(c.apiUrl && c.apiToken && c.model);
  });

  constructor() {
    this.load();

    effect(() => {
      const state = this._state();
      if (this.initialized) {
        this.save(state);
      }
    });
  }

  private async load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.initialized = true;
        return;
      }
      const parsed = JSON.parse(raw);

      if (parsed.apiToken) {
        parsed.apiToken = await decrypt(parsed.apiToken);
      }

      this._state.update(current => ({ ...current, ...parsed }));
      this.initialized = true;
    } catch (e) {
      console.error('Error cargando config:', e);
      this.initialized = true;
    }
  }

  private async save(config: ConfigState) {
    if (!this.initialized) return;
    try {
      const toStore = { ...config };
      if (toStore.apiToken) {
        toStore.apiToken = await encrypt(toStore.apiToken);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (e) {
      console.warn('No se pudo guardar config:', e);
    }
  }

  update(partial: Partial<ConfigState>) {
    this._state.update(current => ({ ...current, ...partial }));
  }

  resetParams() {
    this._state.update(current => ({
      ...current,
      temperature: DEFAULT_CONFIG.temperature,
      maxTokens: DEFAULT_CONFIG.maxTokens,
      systemPrompt: DEFAULT_CONFIG.systemPrompt,
      includeHistory: DEFAULT_CONFIG.includeHistory,
      streamMode: DEFAULT_CONFIG.streamMode,
    }));
  }

}