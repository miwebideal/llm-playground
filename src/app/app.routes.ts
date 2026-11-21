// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { PlaygroundPage } from './features/playground/playground.page';

export const routes: Routes = [
    { path: '', component: PlaygroundPage, title: 'Playground · LLM Playground' },
    { path: 'modelos', loadComponent: () => import('./features/pages/models.page').then(m => m.ModelsPage), title: 'Modelos · LLM Playground' },
    { path: 'uso', loadComponent: () => import('./features/pages/usage.page').then(m => m.UsagePage), title: 'Uso · LLM Playground' },
    { path: 'claves', loadComponent: () => import('./features/pages/keys.page').then(m => m.KeysPage), title: 'Claves · LLM Playground' },
    { path: 'ajustes', loadComponent: () => import('./features/pages/settings.page').then(m => m.SettingsPage), title: 'Ajustes · LLM Playground' },
    { path: 'acerca', loadComponent: () => import('./features/pages/about.page').then(m => m.AboutPage), title: 'Acerca · LLM Playground' },
    { path: '**', redirectTo: '' }
];
