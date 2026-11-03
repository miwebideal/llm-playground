// src/app/components/modal/modal.component.ts

import {
    ChangeDetectionStrategy, Component, ElementRef, HostListener, effect, inject, viewChild
} from '@angular/core';
import { ModalService } from '../../core/services/modal.service';
import { LucideTriangleAlert } from '@lucide/angular';

@Component({
    selector: 'app-modal',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [LucideTriangleAlert],
    templateUrl: './modal.component.html'
})
export class ModalComponent {

    modalService = inject(ModalService);
    private confirmButton = viewChild<ElementRef<HTMLButtonElement>>('confirmButton');
    private dialog = viewChild<ElementRef<HTMLElement>>('dialog');

    constructor() {
        effect(onCleanup => {
            if (this.modalService.isOpen()) {
                document.body.style.overflow = 'hidden';
                queueMicrotask(() => this.confirmButton()?.nativeElement.focus());
                onCleanup(() => { document.body.style.overflow = ''; });
                return;
            }
            document.body.style.overflow = '';
        });
    }

    @HostListener('document:keydown.escape')
    onEscape(): void {
        if (this.modalService.isOpen()) this.modalService.close(false);
    }

    @HostListener('document:keydown.tab', ['$event'])
    onTab(event: Event): void {
        if (!this.modalService.isOpen()) return;

        const keyboard = event as KeyboardEvent;
        const root = this.dialog()?.nativeElement;
        if (!root) return;

        const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('button'));
        if (!buttons.length) return;

        const first = buttons[0];
        const last = buttons[buttons.length - 1];

        if (keyboard.shiftKey && document.activeElement === first) {
            keyboard.preventDefault();
            last.focus();
        } else if (!keyboard.shiftKey && document.activeElement === last) {
            keyboard.preventDefault();
            first.focus();
        }
    }

}
