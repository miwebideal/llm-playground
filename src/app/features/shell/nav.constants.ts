// src/app/features/shell/nav.constants.ts

export interface NavItem {
    path: string;
    label: string;
    icon: 'chat' | 'models' | 'usage' | 'keys' | 'settings' | 'about';
}

export const NAV_ITEMS: NavItem[] = [
    { path: '/', label: 'Playground', icon: 'chat' },
    { path: '/modelos', label: 'Modelos', icon: 'models' },
    { path: '/uso', label: 'Uso', icon: 'usage' },
    { path: '/claves', label: 'Claves', icon: 'keys' },
    { path: '/ajustes', label: 'Ajustes', icon: 'settings' },
];

export const REPO_URL = 'https://github.com/miwebideal/llm-playground';
export const SITE_URL = 'https://miwebideal.com.ar';
