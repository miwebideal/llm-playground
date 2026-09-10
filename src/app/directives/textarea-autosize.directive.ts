// src/app/directives/textarea-autosize.directive.ts

import { Directive, ElementRef, OnDestroy, afterNextRender, effect, inject, input } from '@angular/core';

@Directive({
    selector: 'textarea[appAutosize]',
})
export class TextareaAutosizeDirective implements OnDestroy {

    expanded = input(false);

    private el = inject<ElementRef<HTMLTextAreaElement>>(ElementRef);

    constructor() {
        afterNextRender(() => {
            this.fit();
            window.addEventListener('resize', this.onViewport);
            window.visualViewport?.addEventListener('resize', this.onViewport);
        });

        effect(() => {
            this.expanded();
            queueMicrotask(() => this.fit());
        });
    }

    fit(): void {
        const el = this.el.nativeElement;
        const ratio = this.expanded() ? 0.75 : 0.25;
        const cap = Math.max(48, Math.floor(window.innerHeight * ratio));

        el.style.height = 'auto';
        el.style.maxHeight = cap + 'px';

        const next = Math.min(el.scrollHeight, cap);
        el.style.height = next + 'px';
        el.style.overflowY = el.scrollHeight > cap ? 'auto' : 'hidden';
    }

    reset(): void {
        const el = this.el.nativeElement;
        el.value = '';
        this.fit();
    }

    private onViewport = () => this.fit();

    ngOnDestroy(): void {
        window.removeEventListener('resize', this.onViewport);
        window.visualViewport?.removeEventListener('resize', this.onViewport);
    }
}