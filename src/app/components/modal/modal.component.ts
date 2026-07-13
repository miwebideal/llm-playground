// src/app/components/modal/modal.component.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '../../core/services/modal.service';

import { LucideTriangleAlert } from '@lucide/angular';

@Component({
    selector: 'app-modal',
    imports: [CommonModule, LucideTriangleAlert],
    templateUrl: './modal.component.html'
})
export class ModalComponent {

    modalService = inject(ModalService);

}
