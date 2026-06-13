// src/app/app.ts

import { Component, OnInit } from '@angular/core';
import { HomeComponent } from "./home/home.component";
import { ToastComponent } from "./components/toast/toast.component";

@Component({
  selector: 'app-root',
  imports: [HomeComponent, ToastComponent],
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
