// src/app/app.ts

import { Component, OnInit, afterNextRender, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HomeComponent } from "./home/home.component";
import { ToastComponent } from "./components/toast/toast.component";
import { ModalComponent } from "./components/modal/modal.component";

@Component({
  selector: 'app-root',
  imports: [HomeComponent, ToastComponent, ModalComponent],
  templateUrl: './app.html',
})
export class App implements OnInit {

  private document = inject(DOCUMENT);

  constructor() {
    afterNextRender(() => {
      setTimeout(() => {
        const splash = this.document.getElementById('splash-screen');
        if (splash) {
          splash.style.opacity = '0';
          setTimeout(() => splash.remove(), 700);
        }
      }, 100);
    });
  }

  ngOnInit() {
    console.log(
      "Hola colega developer 👋\n\n" +
      "Si encontrás un bug o algo para mejorar:\n" +
      "https://miwebideal.com.ar/contacto\n\n" +
      "— MiWebIdeal.",
    );
  }

}
