# ⚡ LLM Playground

Un entorno minimalista, rápido y seguro para probar modelos de IA locales o en la nube. 

🔗 **[Probar la Demo en Vivo](https://llm-playground.miwebideal.com.ar)**

## 💡 ¿Por qué nació este proyecto?
Como desarrollador, cada vez que salía un modelo nuevo o quería comparar respuestas entre distintas APIs, terminaba armando scripts temporales o peleando con Postman. Necesitaba un lugar limpio donde simplemente pegar mi API Key, cambiar de modelo en un clic y ver los resultados (con soporte para Markdown y streaming real). 

Así nació LLM Playground. Una herramienta hecha por devs para devs, para que te enfoques en lo divertido: **probar modelos**.

## 🛡️ Privacidad primero (BYOK)
**Tus datos son tuyos.** Es una SPA 100% frontend:
- 📉 **Cero telemetría:** sin rastreadores, analíticas ni scripts de terceros (las fuentes también son locales).
- 🚫 **Sin backend intermediario:** las requests van directo de tu navegador al proveedor.
- 🔐 **Keys cifradas:** en el navegador se guardan con AES-GCM usando una clave local no exportable (IndexedDB). Evita lecturas casuales, pero **no protege contra XSS ni contra acceso a tu perfil del navegador**. Si el navegador no puede cifrar, las keys quedan sólo en memoria.

## ✨ Características
- **Playground con chat a todo el ancho** y panel de ajustes lateral (proveedor, modelo, parámetros, system prompt).
- **Modo dividido:** dos modelos lado a lado con el mismo prompt, parámetros sincronizables y una "carrera de tokens" que muestra primer token y duración.
- **Métricas reales en cada respuesta:** TTFT, tokens/s, tokens y costo, con detalle desplegable (tokens in/out, tiempo de generación, motivo de corte).
- **Modelos verificados:** consulta `/models` de cada proveedor, marca los que ya no existen y descubre los nuevos. Catálogo con precio, contexto, parámetros y capacidades.
- **Uso:** gasto, tokens, velocidad y TTFT promedio por modelo, gasto diario y últimas corridas.
- **Claves:** cargalas a mano y se cifran al instante en tu navegador.
- **Multi-proveedor:** OpenAI, DeepInfra, Fireworks, Gemini, OpenRouter, Groq, Together o cualquier endpoint compatible con OpenAI (incluido Ollama / LM Studio en localhost).
- **Exportación** a Markdown, JSON o portapapeles. Tema claro cálido y oscuro grafito.

## 🛠️ Stack
- **Framework:** Angular 21 (Signals, Standalone, Router, Control Flow)
- **Estilos:** Tailwind CSS v4 · Geist / Geist Mono (self-hosted)
- **Íconos:** Lucide · **Markdown:** Marked + sanitizado por allowlist
- **Tests:** Vitest

## 🚀 Instalación local

```bash
git clone https://github.com/miwebideal/llm-playground.git
cd llm-playground
npm install
npm start
```

Abrí `http://localhost:4200`.

### Tests
```bash
npm test
```

## 🤝 Contribuir
¡Los Pull Requests son bienvenidos! Si encontrás un bug o tenés una idea para mejorar la herramienta, no dudes en abrir un issue.

---
Desarrollado por [miwebideal](https://miwebideal.com.ar)
