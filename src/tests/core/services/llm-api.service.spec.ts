// src/tests/core/services/llm-api.service.spec.ts

import { TestBed } from '@angular/core/testing';
import { LlmApiService } from '../../../app/core/services/llm-api.service';
import { StreamParserService } from '../../../app/core/services/stream-parser.service';

describe('LlmApiService', () => {
    let service: LlmApiService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                LlmApiService,
                StreamParserService
            ]
        });
        service = TestBed.inject(LlmApiService);
    });

    it('debería crearse correctamente', () => {
        expect(service).toBeTruthy();
    });

    describe('extractSmartError', () => {
        
        // Helper para simular una respuesta HTTP de error
        const createMockResponse = (status: number, statusText: string, body: any) => {
            return new Response(JSON.stringify(body), {
                status,
                statusText,
                headers: { 'Content-Type': 'application/json' }
            });
        };

        it('debería detectar error de max_tokens y sugerir apagar parámetros', async () => {
            const mockResponse = createMockResponse(400, 'Bad Request', {
                error: { message: 'Unrecognized request argument: max_tokens' }
            });

            const result = await service.extractSmartError(mockResponse);
            
            expect(result).toContain('❌ Error de API: Unrecognized request argument: max_tokens');
            expect(result).toContain('💡 Tip: El modelo no soporta este parámetro');
        });

        it('debería detectar error de json_object y sugerir apagar JSON Mode', async () => {
            const mockResponse = createMockResponse(400, 'Bad Request', {
                error: { message: 'response_format json_object is not supported for this model' }
            });

            const result = await service.extractSmartError(mockResponse);
            
            expect(result).toContain('💡 Tip: Este modelo no soporta forzar JSON Mode nativamente');
        });

        it('debería detectar error 401 de autenticación', async () => {
            const mockResponse = createMockResponse(401, 'Unauthorized', {
                error: { message: 'Invalid API Key provided' }
            });

            const result = await service.extractSmartError(mockResponse);
            
            expect(result).toContain('🔑 Tip: Error de Autenticación');
        });

        it('debería devolver solo el error original si no hay coincidencias en el diccionario', async () => {
            const mockResponse = createMockResponse(500, 'Internal Server Error', {
                error: { message: 'Server overload, please try again later' }
            });

            const result = await service.extractSmartError(mockResponse);
            
            expect(result).toBe('❌ Error de API: Server overload, please try again later');
            expect(result).not.toContain('💡 Tip:');
        });

        it('debería manejar respuestas que no son JSON (ej. caída de red)', async () => {
            const mockResponse = new Response('Gateway Timeout', { status: 504 });
            
            const result = await service.extractSmartError(mockResponse);
            
            expect(result).toBe('❌ Error 504: No se pudo conectar con el proveedor.');
        });
    });
});
