// src/app/directives/code-copy.directive.ts

import { Directive, ElementRef, Input, OnChanges, SimpleChanges, OnDestroy, inject, Renderer2, AfterViewInit } from '@angular/core';
import { ToastService } from '../services/toast.service';

interface CodeWrapper {
    wrapper: HTMLElement;
    button: HTMLElement;
    cleanup: () => void;
}

@Directive({
    selector: '[appCodeCopy]',
    standalone: true
})
export class CodeCopyDirective implements OnChanges, OnDestroy, AfterViewInit {

    @Input('appCodeCopy') isStreaming: boolean | undefined = false;

    private el = inject(ElementRef);
    private renderer = inject(Renderer2);
    private toast = inject(ToastService);

    private wrappers = new Map<HTMLPreElement, CodeWrapper>();

    ngAfterViewInit() {
        if (!this.isStreaming) {
            setTimeout(() => this.processCodeBlocks(), 100);
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['isStreaming'] && this.isStreaming === false && !changes['isStreaming'].isFirstChange()) {
            setTimeout(() => this.processCodeBlocks(), 100);
        }
    }

    ngOnDestroy() {
        this.cleanupAll();
    }

    private processCodeBlocks() {
        const container = this.el.nativeElement as HTMLElement;

        this.wrappers.forEach((wrapper, pre) => {
            if (!container.contains(pre)) {
                wrapper.cleanup();
                this.wrappers.delete(pre);
            }
        });

        const pres = container.querySelectorAll('pre');

        pres.forEach(pre => {
            if (this.wrappers.has(pre)) return;
            if (pre.parentElement?.classList.contains('code-wrapper')) return;

            const wrapper = this.createWrapper(pre);
            if (wrapper) {
                this.wrappers.set(pre, wrapper);
            }
        });
    }

    private createWrapper(pre: HTMLPreElement): CodeWrapper | null {
        try {
            const wrapper = this.renderer.createElement('div');
            this.renderer.addClass(wrapper, 'relative');
            this.renderer.addClass(wrapper, 'group');
            this.renderer.addClass(wrapper, 'code-wrapper');
            this.renderer.addClass(wrapper, 'my-4');

            const parent = pre.parentNode;
            if (!parent) return null;

            this.renderer.insertBefore(parent, wrapper, pre);
            this.renderer.appendChild(wrapper, pre);
            this.renderer.addClass(pre, '!my-0');

            const btn = this.renderer.createElement('button');
            const btnClasses = [
                'absolute', 'right-2', 'top-2', 'hover:cursor-pointer',
                'flex', 'items-center', 'gap-1', 'px-2', 'py-1',
                'text-xs', 'rounded', 'bg-gray-800', 'hover:bg-gray-700',
                'text-gray-300', 'hover:text-white', 'border', 'border-gray-600',
                'z-10', 'shadow-sm'
            ];
            btnClasses.forEach(c => this.renderer.addClass(btn, c));

            this.renderer.setAttribute(btn, 'aria-label', 'Copiar código');
            this.renderer.setAttribute(btn, 'type', 'button');
            this.renderer.setProperty(btn, 'innerHTML', this.getCopyIcon());

            const clickHandler = () => this.handleCopy(pre, btn);
            const removeListener = this.renderer.listen(btn, 'click', clickHandler);

            this.renderer.appendChild(wrapper, btn);

            return {
                wrapper,
                button: btn,
                cleanup: () => {
                    removeListener();
                    if (parent && pre.parentNode === wrapper) {
                        this.renderer.insertBefore(parent, pre, wrapper);
                        this.renderer.removeClass(pre, '!my-0');
                    }
                    if (wrapper.parentNode === parent) {
                        this.renderer.removeChild(parent, wrapper);
                    }
                }
            };
        } catch (e) {
            console.error('Error creando wrapper de código:', e);
            return null;
        }
    }

    private handleCopy(pre: HTMLPreElement, btn: HTMLElement) {
        const code = pre.textContent || '';

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

    private cleanupAll() {
        this.wrappers.forEach(wrapper => wrapper.cleanup());
        this.wrappers.clear();
    }

    private getCopyIcon(): string {
        return `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg><span>Copiar</span>`;
    }

    private getCheckIcon(): string {
        return `<svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg><span class="text-emerald-400">¡Copiado!</span>`;
    }
}