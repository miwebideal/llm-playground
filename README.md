# ⚡ LLM Playground

Un entorno minimalista, rápido y seguro para probar modelos de IA locales o en la nube. 

🔗 **[Probar la Demo en Vivo](https://llm-playground.miwebideal.com.ar)**

## 💡 ¿Por qué nació este proyecto?
Como desarrollador, cada vez que salía un modelo nuevo o quería comparar respuestas entre distintas APIs, terminaba armando scripts temporales o peleando con Postman. Necesitaba un lugar limpio donde simplemente pegar mi API Key, cambiar de modelo en un clic y ver los resultados (con soporte para Markdown y streaming real). 

Así nació LLM Playground. Una herramienta hecha por devs para devs, para que te enfoques en lo divertido: **probar modelos**.

## 🛡️ Privacidad Primero (BYOK - Bring Your Own Key)
**Tus datos son tuyos.** 
Esta es una Single Page Application (SPA) 100% frontend. 
- 📉 **Cero Telemetría:** No hay rastreadores, analíticas ni scripts de terceros.
- 🚫 **Sin Backend Intermediario:** Las peticiones a las APIs de IA se hacen directamente desde tu navegador al proveedor.
- 💾 **Almacenamiento Local:** Tu API Key, configuración y el historial de chat se guardan exclusivamente en el `localStorage` de tu navegador. 

## ✨ Características Principales
- **Soporte Multi-Proveedor:** Compatible con cualquier API que use el estándar de OpenAI (Fireworks, DeepInfra, Groq, Together, OpenRouter, Gemini, etc.).
- **Streaming en Tiempo Real:** Respuestas fluidas con cálculo de métricas (TTFT y Tiempo Total).
- **Soporte para Modelos de Razonamiento:** Captura y muestra el "proceso de pensamiento" (reasoning) en un acordeón colapsable antes de la respuesta final.
- **Markdown & Code Highlighting:** Renderizado perfecto de tablas, listas y bloques de código con botón de "Copiar" integrado.
- **Estimador de Tokens:** Calcula los tokens estimados mientras escribís y muestra el gasto real al finalizar.
- **Dark/Light Mode:** Tema adaptable y persistente.

## 🛠️ Stack Tecnológico
- **Framework:** Angular (Signals, Standalone Components, Control Flow)
- **Estilos:** Tailwind CSS v4
- **Iconos:** Lucide Angular v1
- **Markdown:** Marked.js

## 🚀 Instalación Local

Si querés correr el proyecto en tu propia máquina o hacerle un fork:

1. Cloná el repositorio:
```bash
git clone https://github.com/miwebideal/llm-playground.git
```

2. Instalá las dependencias:
```bash
cd llm-playground
npm install
```

3. Levantá el servidor de desarrollo:
```bash
ng serve
```

4. Abrí tu navegador en `http://localhost:4200`

## 🤝 Contribuir
¡Los Pull Requests son bienvenidos! Si encontrás un bug o tenés una idea para mejorar la herramienta, no dudes en abrir un issue.

---
Desarrollado por [miwebideal](https://miwebideal.com.ar)
