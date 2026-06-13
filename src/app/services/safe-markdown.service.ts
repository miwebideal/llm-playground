// src/app/services/safe-markdown.service.ts

import { inject, Injectable, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { marked } from 'marked';

const renderer = new marked.Renderer();
renderer.html = () => '';
renderer.link = ({ href, title, text }) => {
    const safeHref = href?.replace(/javascript:/gi, '').replace(/data:/gi, '') || '#';
    return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer" class="text-violet-600 dark:text-violet-400 underline">${text}</a>`;
};

renderer.image = ({ href, title, text }) => {
    const safeHref = href?.startsWith('https://') ? href : '#';
    return `<img src="${safeHref}" alt="${text || ''}" class="max-w-full rounded-lg" loading="lazy">`;
};

@Injectable({ providedIn: 'root' })
export class SafeMarkdownService {

    private sanitizer = inject(DomSanitizer);

    parse(content: string): string {
        if (!content) return '';

        const rawHtml = marked.parse(content, {
            async: false,
            gfm: true,
            breaks: true,
            renderer
        }) as string;

        const safeHtml = this.sanitizer.sanitize(SecurityContext.HTML, rawHtml);
        return safeHtml || '';
    }

}