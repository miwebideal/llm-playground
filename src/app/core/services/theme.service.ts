// src/app/core/services/theme.service.ts

import { Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

const THEME_KEY = 'theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {

    private document = inject(DOCUMENT);
    private platformId = inject(PLATFORM_ID);

    readonly isDark = signal(this.getInitialTheme());

    constructor() {
        effect(() => {
            const dark = this.isDark();
            if (!isPlatformBrowser(this.platformId)) return;

            this.document.documentElement.classList.toggle('dark', dark);
            try {
                localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
            } catch {
                // sin persistencia disponible
            }
        });
    }

    toggle(): void {
        this.isDark.update(value => !value);
    }

    private getInitialTheme(): boolean {
        if (!isPlatformBrowser(this.platformId)) return true;
        try {
            const saved = localStorage.getItem(THEME_KEY);
            if (saved) return saved === 'dark';
        } catch {
            // ignorar
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
}
