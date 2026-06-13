// src/app/services/theme.service.ts

import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    isDark = signal<boolean>(this.getInitialTheme());

    constructor() {
        effect(() => {
            const dark = this.isDark();
            localStorage.setItem('theme', dark ? 'dark' : 'light');
            if (dark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        });
    }

    private getInitialTheme(): boolean {
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    toggle() {
        this.isDark.update(v => !v);
    }
    
}
