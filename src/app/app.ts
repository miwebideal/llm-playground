// src/app/app.ts

import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ShellComponent } from './features/shell/shell.component';
import { ToastComponent } from './components/toast/toast.component';
import { ModalComponent } from './components/modal/modal.component';

@Component({
    selector: 'app-root',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ShellComponent, ToastComponent, ModalComponent],
    templateUrl: './app.html',
})
export class App implements OnInit {

    ngOnInit() {
        console.log(
            "Hola colega developer 👋\n\n" +
            "Si encontrás un bug o algo para mejorar:\n" +
            "https://miwebideal.com.ar/contacto\n\n" +
            "— MiWebIdeal.",
        );
    }
}
