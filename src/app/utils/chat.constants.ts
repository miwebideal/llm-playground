// src/app/utils/chat.constants.ts

export const QUICK_PROMPTS = [
    {
        title: '📊 Tabla Comparativa',
        text: 'Crea una tabla comparativa detallada entre React, Angular y Vue. Incluye columnas para: Curva de aprendizaje, Rendimiento, Ecosistema y Casos de uso ideales.'
    },
    {
        title: '💻 Script Python',
        text: 'Escribe un script en Python que lea un archivo CSV, filtre las filas donde la columna "estado" sea "activo", y exporte el resultado a un nuevo archivo JSON. Incluye manejo de errores.'
    },
    {
        title: '🤔 Razonamiento Lógico',
        text: 'Resuelve este acertijo paso a paso: Un granjero tiene que cruzar un río con un lobo, una cabra y una lechuga. El bote solo tiene espacio para él y una cosa más. Si deja solos al lobo y la cabra, el lobo se la come. Si deja a la cabra y la lechuga, la cabra se la come. ¿Cómo hace para cruzar todo a salvo?'
    },
    {
        title: '📝 Resumen',
        text: 'Explica el concepto de "Computación Cuántica" como si se lo estuvieras explicando a un niño de 10 años, usando analogías simples.'
    },
    {
        title: '✍️ Escritura con Restricción',
        text: 'Escribe una historia de terror de exactamente tres párrafos. El primer párrafo debe terminar con la palabra "silencio", el segundo con "sombra" y el tercero con "nunca". No uses la palabra "miedo" en ningún momento.'
    },
    {
        title: '⚖️ Dilema Ético',
        text: 'Analiza el impacto del uso de inteligencia artificial en la creación artística. Presenta dos argumentos sólidos a favor (como democratización) y dos en contra (como propiedad intelectual), y concluye con una reflexión neutral sobre el futuro del arte.'
    }
];

export const API_PRESETS: Record<string, { apiUrl: string }> = {
    deepinfra: { apiUrl: 'https://api.deepinfra.com/v1/openai/chat/completions' },
    fireworks: { apiUrl: 'https://api.fireworks.ai/inference/v1/chat/completions' },
    gemini: { apiUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions' },
    openrouter: { apiUrl: 'https://openrouter.ai/api/v1/chat/completions' },
    groq: { apiUrl: 'https://api.groq.com/openai/v1/chat/completions' },
    together: { apiUrl: 'https://api.together.xyz/v1/chat/completions' },
};

// Exportamos solo las keys para usarlas en el HTML del Sidebar
export const API_PRESET_KEYS = Object.keys(API_PRESETS);
