// src/tests/core/services/keys-and-models.spec.ts

import { TestBed } from '@angular/core/testing';
import { maskSecret } from '../../../app/utils/format.utils';
import { providerEndpoint, providerHeaders } from '../../../app/core/services/provider-endpoint';
import { parseModelIds } from '../../../app/core/services/model-discovery.service';
import { ModelRegistryService } from '../../../app/core/registry/model-registry.service';
import { ProviderConfig, keySource } from '../../../app/core/models';

const openai: ProviderConfig = { id: 'openai', name: 'OpenAI', apiUrl: 'https://api.openai.com/v1/chat/completions', apiToken: 'sk-abc' };

describe('maskSecret', () => {
    it('nunca muestra la key completa', () => {
        expect(maskSecret('sk-proj-1234567890abcd')).toBe('sk-p••••abcd');
        expect(maskSecret('corta')).toBe('••••••••');
    });
});

describe('providerEndpoint', () => {
    it('va directo al proveedor con Authorization si hay key', () => {
        expect(providerEndpoint(openai, 'chat/completions')).toBe(openai.apiUrl);
        expect(providerEndpoint(openai, 'models')).toBe('https://api.openai.com/v1/models');
        expect(providerHeaders(openai)['Authorization']).toBe('Bearer sk-abc');
        expect(keySource(openai)).toBe('browser');
    });

    it('marca sin key y no manda Authorization', () => {
        const empty = { ...openai, apiToken: '' };
        expect(providerHeaders(empty)['Authorization']).toBeUndefined();
        expect(keySource(empty)).toBe('none');
    });
});

describe('descubrimiento de modelos', () => {
    it('parseModelIds normaliza y filtra modelos que no son de chat', () => {
        const ids = parseModelIds({ data: [
            { id: 'gpt-5.4-mini' }, { id: 'text-embedding-3-large' }, { id: 'whisper-1' }, { id: 'models/gemini-3.8-flash' }
        ] });
        expect(ids).toEqual(['gpt-5.4-mini', 'gemini-3.8-flash']);
    });

    it('el registry marca deprecados y suma descubiertos', () => {
        TestBed.configureTestingModule({});
        const registry = TestBed.inject(ModelRegistryService);
        registry.setRemote('groq', ['openai/gpt-oss-120b', 'nuevo/modelo-x']);

        const visible = registry.list('groq');
        expect(visible.find(m => m.id === 'openai/gpt-oss-120b')?.status).toBe('available');
        expect(visible.find(m => m.id === 'nuevo/modelo-x')?.status).toBe('discovered');
        expect(visible.some(m => m.id === 'openai/gpt-oss-20b')).toBe(false);

        const all = registry.list('groq', { includeDeprecated: true });
        expect(all.find(m => m.id === 'openai/gpt-oss-20b')?.status).toBe('deprecated');
    });
});
