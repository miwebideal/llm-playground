// src/app/directives/code-copy.directive.ts

import { Directive, ElementRef, Input, OnChanges, SimpleChanges, OnDestroy, inject, Renderer2, AfterViewInit } from '@angular/core';
import { ToastService } from '../services/toast.service';

@Directive({
    selector: '[appCodeCopy]',
    standalone: true
})
export class CodeCopyDirective implements OnChanges, OnDestroy, AfterViewInit {

    @Input('appCodeCopy') isStreaming: boolean | undefined = false;

    private el = inject(ElementRef);
    private renderer = inject(Renderer2);
    private toast = inject(ToastService);

    private clickListener!: () => void;
    private observer!: MutationObserver;

    ngAfterViewInit() {

        this.clickListener = this.renderer.listen(this.el.nativeElement, 'click', (event: MouseEvent) => {
            const btn = (event.target as HTMLElement).closest('.copy-btn');
            if (!btn) return;
            const wrapper = btn.closest('.code-wrapper');
            const pre = wrapper?.querySelector('pre');
            if (pre) this.handleCopy(pre.textContent || '', btn as HTMLElement);
        });

        this.observer = new MutationObserver(() => {
            if (!this.isStreaming) {
                this.processCodeBlocks();
            }
        });

        this.observer.observe(this.el.nativeElement, { childList: true, subtree: true });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['isStreaming'] && this.isStreaming === false) {
            this.processCodeBlocks();
        }
    }

    ngOnDestroy() {
        if (this.clickListener) this.clickListener();
        if (this.observer) this.observer.disconnect();
    }

    private processCodeBlocks() {

        const pres = this.el.nativeElement.querySelectorAll('pre:not(.wrapped)');

        pres.forEach((pre: HTMLElement) => {
            this.renderer.addClass(pre, 'wrapped');
            this.renderer.addClass(pre, '!my-0');

            const wrapper = this.renderer.createElement('div');
            this.renderer.addClass(wrapper, 'relative');
            this.renderer.addClass(wrapper, 'group');
            this.renderer.addClass(wrapper, 'code-wrapper');
            this.renderer.addClass(wrapper, 'my-4');

            const parent = pre.parentNode;
            if (parent) {
                this.renderer.insertBefore(parent, wrapper, pre);
                this.renderer.appendChild(wrapper, pre);
            }

            const btn = this.renderer.createElement('button');

            btn.className = 'copy-btn absolute right-2 top-2 flex items-center justify-center w-[86px] gap-1 px-2 py-1 text-xs rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-600 z-10 shadow-sm cursor-pointer transition-colors';
            this.renderer.setAttribute(btn, 'aria-label', 'Copiar código');
            this.renderer.setAttribute(btn, 'type', 'button');
            this.renderer.setProperty(btn, 'innerHTML', this.getCopyIcon());

            this.renderer.appendChild(wrapper, btn);
        });
    }

    private handleCopy(code: string, btn: HTMLElement) {
        navigator.clipboard.writeText(code).then(() => {
            this.toast.success('Código copiado al portapapeles');

            this.renderer.setProperty(btn, 'innerHTML', this.getCheckIcon());
            this.renderer.setAttribute(btn, 'disabled', 'true');

            setTimeout(() => {
                this.renderer.setProperty(btn, 'innerHTML', this.getCopyIcon());
                this.renderer.removeAttribute(btn, 'disabled');
            }, 2000);
        }).catch(() => {
            this.toast.error('No se pudo copiar el código');
        });
    }

    private getCopyIcon(): string {
        return `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg><span>Copiar</span>`;
    }

    private getCheckIcon(): string {
        return `<svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg><span class="text-emerald-400">¡Copiado!</span>`;
    }

}
