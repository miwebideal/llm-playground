// src/tests/core/registry/model-registry.service.spec.ts

import { TestBed } from '@angular/core/testing';
import { ModelRegistryService } from '../../../app/core/registry/model-registry.service';

describe('ModelRegistryService', () => {
    let service: ModelRegistryService;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [ModelRegistryService] });
        service = TestBed.inject(ModelRegistryService);
    });

    it('lista sólo modelos del proveedor', () => {
        const openai = service.list('openai');
        expect(openai.length).toBeGreaterThan(0);
        expect(openai.every(model => model.providerId === 'openai')).toBe(true);
    });

    it('resuelve tokenLimit por familia', () => {
        expect(service.tokenPolicy({ providerId: 'openai', model: 'gpt-5.6-sol' })).toBe('max_completion_tokens');
        expect(service.tokenPolicy({ providerId: 'openai', model: 'gpt-4o' })).toBe('max_tokens');
        expect(service.tokenPolicy({ providerId: 'deepinfra', model: 'deepseek-ai/DeepSeek-V4.1-Flash' })).toBe('max_tokens');
    });

    it('permite override manual del tokenLimit', () => {
        expect(service.tokenPolicy({
            providerId: 'openai',
            model: 'gpt-4o',
            tokenLimitOverride: 'max_completion_tokens'
        })).toBe('max_completion_tokens');
    });

    it('fallback para modelos manuales desconocidos', () => {
        expect(service.tokenPolicy({ providerId: 'custom', model: 'gpt-5.9-experimental' })).toBe('max_completion_tokens');
        expect(service.tokenPolicy({ providerId: 'custom', model: 'mi-modelo-local' })).toBe('max_tokens');
    });

    it('precio es provider-scoped', () => {
        expect(service.pricing('openai', 'gpt-4o')?.input).toBe(2.5);
        expect(service.pricing('groq', 'gpt-4o')).toBeUndefined();
    });

    it('etiqueta el límite de tokens según la política', () => {
        expect(service.tokenLimitLabel('max_completion_tokens')).toBe('Max completion tokens');
        expect(service.tokenLimitLabel('max_tokens')).toBe('Max tokens');
    });

    it('detecta parámetros restringidos', () => {
        const caps = service.capabilities({ providerId: 'openai', model: 'gpt-5.6-sol' });
        expect(service.hasRestrictedParams(caps)).toBe(true);
        expect(service.restrictedParamLabels(caps)).toContain('temperature');
    });
});
