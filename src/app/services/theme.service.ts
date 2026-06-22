// src/app/services/theme.service.ts

import { Injectable, signal, effect, inject, PLATFORM_ID, RendererFactory2 } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {

    private document = inject(DOCUMENT);
    private platformId = inject(PLATFORM_ID);
    private renderer = inject(RendererFactory2).createRenderer(null, null);

    isDark = signal<boolean>(false);

    constructor() {

        this.isDark.set(this.getInitialTheme());

        effect(() => {
            const dark = this.isDark();

            if (isPlatformBrowser(this.platformId)) {
                localStorage.setItem('theme', dark ? 'dark' : 'light');
            }

            if (dark) {
                this.renderer.addClass(this.document.documentElement, 'dark');
            } else {
                this.renderer.removeClass(this.document.documentElement, 'dark');
            }
        });
    }

    private getInitialTheme(): boolean {

        if (!isPlatformBrowser(this.platformId)) {
            return true;
        }

        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    toggle() {
        this.isDark.update(v => !v);
    }

}
