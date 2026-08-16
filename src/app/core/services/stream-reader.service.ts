// src/app/core/services/stream-reader.service.ts

import { Injectable, inject } from '@angular/core';
import { StreamParserService, StreamChunk } from './stream-parser.service';

@Injectable({ providedIn: 'root' })
export class StreamReaderService {

    private parser = inject(StreamParserService);

    /**
     * Lee un ReadableStream de una respuesta HTTP, decodifica los bytes,
     * separa por líneas y emite los chunks parseados.
     */
    async readStream(
        response: Response,
        stopSignal: () => boolean,
        onChunk: (chunk: StreamChunk) => void
    ): Promise<void> {
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No se pudo leer el stream');

        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                if (stopSignal()) break;

                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');

                // El último elemento puede estar incompleto, lo guardamos en el buffer
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const chunk = this.parser.parseLine(line);
                    if (chunk) onChunk(chunk);
                }
            }

            // Procesar lo que haya quedado en el buffer al finalizar
            if (buffer) {
                const chunk = this.parser.parseLine(buffer);
                if (chunk) onChunk(chunk);
            }
        } finally {
            reader.releaseLock();
        }
    }
}
