// src/app/constants/prompts.constants.ts

export const QUICK_PROMPTS = [
    {
        title: '⚡ Ping',
        text: 'Responde únicamente: OK'
    },
    {
        title: '🔢 Cálculo',
        text: '¿Cuánto es 17 × 24? Responde solo el número.'
    },
    {
        title: '📋 Instrucciones',
        text: 'Escribe exactamente 3 bullets, máximo 8 palabras cada uno, sobre por qué usar streaming en un chat.'
    },
    {
        title: '🧩 Lógica Inversa',
        text: 'Hay 3 cajas: Roja, Azul y Verde. La caja Roja dice: "El oro no está aquí". La Azul dice: "El oro está en la caja Verde". La Verde dice: "El oro no está en la caja Azul". Sabiendo que EXACTAMENTE DOS de estas afirmaciones son FALSAS, determina dónde está el oro. Explica tu razonamiento paso a paso antes de dar la respuesta final.'
    },
    {
        title: '🔤 Conteo de "e"',
        text: '¿Cuántas letras "e" hay en esta frase: "El veloz murciélago hindú comía feliz cardillo y kiwi"? Responde solo el número y explica en una línea.'
    },
    {
        title: '🔠 Lipograma Técnico Extremo',
        text: 'Explica qué es y cómo funciona el "Machine Learning" en exactamente tres oraciones. Regla estricta: NO puedes usar la vocal "a" ni la vocal "o" en ninguna de las palabras de tu respuesta. Si usas una "a" o una "o" en cualquier parte del texto, fallas la prueba.'
    },
    {
        title: '📝 Explicación Simple',
        text: 'Explica el concepto de "Computación Cuántica" como si se lo estuvieras explicando a un niño de 10 años, usando analogías simples.'
    },
    {
        title: '📊 Tabla Comparativa',
        text: 'Crea una tabla comparativa detallada entre React, Angular y Vue. Incluye columnas para: Curva de aprendizaje, Rendimiento, Ecosistema y Casos de uso ideales.'
    }
];
