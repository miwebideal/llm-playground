// src/app/shared/components/markdown/markdown.component.ts

import { ChangeDetectionStrategy, Component, OnDestroy, effect, inject, input, signal } from '@angular/core';
import { SafeMarkdownService } from '../../../core/services/safe-markdown.service';

@Component({
    selector: 'app-markdown',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `<div [class]="cssClass()" [innerHTML]="html()"></div>`
})
export class MarkdownComponent implements OnDestroy {

    content = input.required<string>();
    streaming = input(false);
    cssClass = input('markdown-body');

    readonly html = signal('');
    private md = inject(SafeMarkdownService);

    private latestContent = '';
    private frame: number | null = null;
    private usesAnimationFrame = typeof requestAnimationFrame === 'function';

    constructor() {
        effect(() => {
            const content = this.content();
            const streaming = this.streaming();
            this.latestContent = content;

            if (!streaming) {
                this.cancelScheduledRender();
                this.html.set(this.md.parse(content));
                return;
            }

            this.scheduleRender();
        });
    }

    ngOnDestroy(): void {
        this.cancelScheduledRender();
    }

    private scheduleRender(): void {
        if (this.frame !== null) return;

        if (this.usesAnimationFrame) {
            this.frame = requestAnimationFrame(() => {
                this.frame = null;
                this.html.set(this.md.parse(this.latestContent));
            });
            return;
        }

        this.frame = setTimeout(() => {
            this.frame = null;
            this.html.set(this.md.parse(this.latestContent));
        }, 16) as unknown as number;
    }

    private cancelScheduledRender(): void {
        if (this.frame === null) return;
        if (this.usesAnimationFrame) {
            cancelAnimationFrame(this.frame);
        } else {
            clearTimeout(this.frame);
        }
        this.frame = null;
    }
}
