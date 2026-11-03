// src/app/core/services/stream-reader.service.ts

import { Injectable, inject } from '@angular/core';
import { AppError, isAppError } from '../models';
import { abortedError, timeoutError } from './api-error.mapper';
import { StreamChunk, StreamParserService } from './stream-parser.service';

export interface ReadStreamOptions {
    signal?: AbortSignal;
    idleTimeoutMs?: number;
    onChunk: (chunk: StreamChunk) => void;
}

const DEFAULT_IDLE_TIMEOUT_MS = 120_000;

@Injectable({ providedIn: 'root' })
export class StreamReaderService {

    private parser = inject(StreamParserService);

    async readStream(response: Response, options: ReadStreamOptions): Promise<void> {
        const reader = response.body?.getReader();
        if (!reader) throw this.streamError('La respuesta no tiene cuerpo legible.');

        const decoder = new TextDecoder();
        const idleTimeoutMs = options.idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS;
        let buffer = '';

        try {
            while (true) {
                if (options.signal?.aborted) throw abortedError();

                const { done, value } = await this.readWithTimeout(reader, options.signal, idleTimeoutMs);
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                buffer = this.consume(buffer, options.onChunk);
            }

            buffer += decoder.decode();
            this.consume(buffer, options.onChunk, true);
        } catch (error) {
            if (isAppError(error)) throw error;
            if (error instanceof Error && error.name === 'AbortError') throw abortedError();
            throw this.streamError(error instanceof Error ? error.message : 'Error leyendo el stream');
        } finally {
            try { await reader.cancel(); } catch { /* ignore */ }
            try { reader.releaseLock(); } catch { /* ignore */ }
        }
    }

    private consume(buffer: string, onChunk: (chunk: StreamChunk) => void, flush = false): string {
        const lines = buffer.split(/\r?\n/);
        const rest = flush ? '' : (lines.pop() ?? '');

        for (const line of lines) {
            const chunk = this.parser.parseLine(line);
            if (!chunk) continue;
            if (chunk.error) throw chunk.error;
            onChunk(chunk);
        }

        return rest;
    }

    private readWithTimeout(
        reader: ReadableStreamDefaultReader<Uint8Array>,
        signal: AbortSignal | undefined,
        timeoutMs: number
    ): Promise<ReadableStreamReadResult<Uint8Array>> {
        if (signal?.aborted) return Promise.reject(abortedError());

        return new Promise((resolve, reject) => {
            let settled = false;
            const finish = (fn: () => void) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                signal?.removeEventListener('abort', onAbort);
                fn();
            };
            const timer = setTimeout(() => finish(() => reject(timeoutError(Math.round(timeoutMs / 1000)))), timeoutMs);
            const onAbort = () => finish(() => reject(abortedError()));
            signal?.addEventListener('abort', onAbort, { once: true });

            reader.read().then(
                result => finish(() => resolve(result)),
                error => finish(() => reject(error))
            );
        });
    }

    private streamError(message: string): AppError {
        return { type: 'stream', message: `Error de streaming: ${message}`, retryable: true };
    }
}
