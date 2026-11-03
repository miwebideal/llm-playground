// src/tests/core/services/stream-reader.service.spec.ts

import { TestBed } from '@angular/core/testing';
import { StreamReaderService } from '../../../app/core/services/stream-reader.service';
import { StreamChunk, StreamParserService } from '../../../app/core/services/stream-parser.service';

function responseFrom(chunks: string[]): Response {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
        start(controller) {
            chunks.forEach(chunk => controller.enqueue(encoder.encode(chunk)));
            controller.close();
        }
    });
    return new Response(body, { status: 200 });
}

describe('StreamReaderService', () => {
    let service: StreamReaderService;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [StreamParserService, StreamReaderService] });
        service = TestBed.inject(StreamReaderService);
    });

    it('lee chunks completos', async () => {
        const received: StreamChunk[] = [];
        await service.readStream(
            responseFrom(['data: {"choices":[{"delta":{"content":"a"}}]}\n', 'data: {"choices":[{"delta":{"content":"b"}}]}\n']),
            { onChunk: chunk => received.push(chunk) }
        );
        expect(received.map(chunk => chunk.content)).toEqual(['a', 'b']);
    });

    it('reconstruye líneas partidas entre chunks', async () => {
        const received: StreamChunk[] = [];
        await service.readStream(
            responseFrom(['data: {"choices":[{"delta":{"cont', 'ent":"partido"}}]}\n']),
            { onChunk: chunk => received.push(chunk) }
        );
        expect(received.map(chunk => chunk.content)).toEqual(['partido']);
    });

    it('procesa el buffer final sin salto de línea', async () => {
        const received: StreamChunk[] = [];
        await service.readStream(
            responseFrom(['data: {"choices":[{"delta":{"content":"final"}}]}']),
            { onChunk: chunk => received.push(chunk) }
        );
        expect(received.map(chunk => chunk.content)).toEqual(['final']);
    });

    it('rechaza si la señal ya está abortada', async () => {
        const controller = new AbortController();
        controller.abort();
        await expect(service.readStream(responseFrom([]), {
            signal: controller.signal,
            onChunk: () => undefined
        })).rejects.toMatchObject({ type: 'aborted' });
    });

    it('rechaza por inactividad', async () => {
        const body = new ReadableStream<Uint8Array>({
            start() {
                // stream que nunca envía datos ni cierra
            }
        });

        await expect(service.readStream(new Response(body, { status: 200 }), {
            idleTimeoutMs: 20,
            onChunk: () => undefined
        })).rejects.toMatchObject({ type: 'timeout' });
    });
});
