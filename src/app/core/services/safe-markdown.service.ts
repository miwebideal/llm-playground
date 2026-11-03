// src/app/core/services/safe-markdown.service.ts

import { Injectable, SecurityContext, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { marked } from 'marked';

const renderer = new marked.Renderer();
renderer.html = () => '';
renderer.link = ({ href, text }) => {
    const safeHref = href?.replace(/javascript:/gi, '').replace(/data:/gi, '') || '#';
    return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer" class="text-primary underline">${text}</a>`;
};
renderer.image = ({ href, text }) => {
    const safeHref = href?.startsWith('https://') ? href : '#';
    return `<img src="${safeHref}" alt="${text || ''}" class="max-w-full rounded-lg" loading="lazy">`;
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
