// src/app/core/services/safe-markdown.service.ts

import { Injectable, SecurityContext, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { marked } from 'marked';

const SAFE_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

function escapeAttr(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Allowlist de protocolos: parsea la URL en vez de filtrar con regex (evita `java&#115;cript:`, etc.). */
export function safeUrl(href: string | null | undefined, protocols: ReadonlySet<string> = SAFE_LINK_PROTOCOLS): string | null {
    if (!href) return null;
    try {
        const url = new URL(href, 'https://invalid.local/');
        if (url.origin === 'https://invalid.local') return null; // relativas: no apuntan a nada útil
        return protocols.has(url.protocol) ? url.href : null;
    } catch {
        return null;
    }
}

const renderer = new marked.Renderer();
renderer.html = () => '';
renderer.link = function ({ href, tokens }) {
    const text = this.parser.parseInline(tokens);
    const safe = safeUrl(href);
    if (!safe) return text;
    return `<a href="${escapeAttr(safe)}" target="_blank" rel="noopener noreferrer nofollow">${text}</a>`;
};
renderer.image = ({ href, text }) => {
    const safe = safeUrl(href, new Set(['https:']));
    if (!safe) return escapeAttr(text || '');
    return `<img src="${escapeAttr(safe)}" alt="${escapeAttr(text || '')}" loading="lazy" referrerpolicy="no-referrer">`;
};

const CACHE_LIMIT = 200;

@Injectable({ providedIn: 'root' })
export class SafeMarkdownService {

    private sanitizer = inject(DomSanitizer);
    private cache = new Map<string, string>();

    parse(content: string): string {
        if (!content) return '';

        const cached = this.cache.get(content);
        if (cached !== undefined) return cached;

        const rawHtml = marked.parse(content, {
            async: false,
            gfm: true,
            breaks: true,
            renderer
        }) as string;

        const safeHtml = this.sanitizer.sanitize(SecurityContext.HTML, rawHtml) || '';
        this.remember(content, safeHtml);
        return safeHtml;
    }

    private remember(content: string, html: string): void {
        if (this.cache.size >= CACHE_LIMIT) {
            const oldest = this.cache.keys().next().value;
            if (oldest !== undefined) this.cache.delete(oldest);
        }
        this.cache.set(content, html);
    }
}
