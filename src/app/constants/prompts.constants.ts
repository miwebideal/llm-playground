// src/app/constants/prompts.constants.ts

export const QUICK_PROMPTS = [
    {
        title: '⚡ Ping',
        text: 'Responde únicamente: OK'
    },
    {
        title: '📋 Instrucciones',
        text: 'Escribe exactamente 3 bullets, máximo 8 palabras cada uno, sobre por qué usar streaming en un chat.'
    },
    {
        title: '🧩 Cajas',
        text: 'Hay 3 cajas: Roja, Azul y Verde. Solo una contiene oro. Las inscripciones dicen: Roja: "El oro está en la caja Azul". Azul: "El oro no está en esta caja". Verde: "El oro no está en la caja Roja". Sabiendo que EXACTAMENTE UNA inscripción es verdadera, determina dónde está el oro y justifica paso a paso.'
    },
    {
        title: '🐺 Lobo, cabra y lechuga',
        text: 'Un granjero debe cruzar un lobo, una cabra y una lechuga en un bote que solo lleva al granjero y una cosa a la vez. Si deja solos al lobo y la cabra, el lobo come la cabra. Si deja solas a la cabra y la lechuga, la cabra come la lechuga. Da la secuencia mínima de viajes e indica qué lleva en cada uno.'
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
        text: 'Crea una tabla comparativa entre React, Angular y Vue. Incluye columnas para: Curva de aprendizaje, Rendimiento, Ecosistema y Casos de uso ideales. Responde únicamente con la tabla, sin texto antes ni después.'
    }
];
