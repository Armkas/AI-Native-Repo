# AI-Native Repository Standard

[🇺🇸 English](README.md) | [🇨🇳 简体中文](README.zh-CN.md) | [🇹🇼 繁體中文](README.zh-TW.md) | [🇯🇵 日本語](README.ja.md) | [🇪🇸 Español](README.es.md) | [🇫🇷 Français](README.fr.md) | [🇩🇪 Deutsch](README.de.md) | [🇷🇺 Русский](README.ru.md) | [🇺🇦 Українська](README.uk.md) | [🇧🇷 Português](README.pt-BR.md) | [🇰🇷 한국어](README.ko.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇸🇦 العربية](README.ar.md)

> **Don't just give AI more context. Give it a native workspace.**
> **No le des solo más contexto a la IA. Dale un espacio de trabajo nativo.**

Un estándar, un generador CLI (Scaffold) y una arquitectura de referencia para construir repositorios que los agentes de codificación de IA puedan comprender, navegar, modificar y verificar de forma autónoma.

---

## 🚀 Inicio rápido: El generador CLI

Ya no necesitas copiar archivos manualmente. Proporcionamos una poderosa CLI para generar instantáneamente un espacio de trabajo nativo para IA adaptado a tu agente (Agent Runtime) y la complejidad de tu proyecto.

**Ejecuta el siguiente comando en cualquier directorio vacío:**

```bash
npx ai-native-repo init .
```

### La matriz de 12 plantillas
La CLI te pedirá interactivamente que elijas entre nuestra matriz de 12 plantillas (4 Entornos de Ejecución × 3 Niveles):

**Paso 1: Elige tu entorno de agente (Runtime)**
- `claude-code`: Ganchos y habilidades puros del ecosistema de Anthropic.
- `codex`: Estructura pura de agente de OpenAI/Codex.
- `cursor`: Optimizado para la coincidencia global de `.cursor/rules/*.mdc`.
- `gemini-cli`: Entorno puro de Google Gemini.

**Paso 2: Elige tu nivel de complejidad**
- `light`: Los archivos de contexto mínimos (PROJECT_MAP + reglas principales) para scripts simples o prototipos.
- `standard`: El predeterminado. Arquitectura completa de Contexto, Contratos y Reglas para servicios en producción.
- `full`: Nivel empresarial. Standard más barreras de rutas (archivos de solo lectura / solo anexar, aplicadas con hooks o CI) y un verificador de frescura del contexto.

*Alternativamente, puedes omitir las preguntas interactivas:*
```bash
npx ai-native-repo init . --runtime cursor --tier standard
npx ai-native-repo init . --runtime claude-code --tier full --lang zh-CN   # en (default) | zh-CN | ja
```

---

## ⚠️ Agnóstico a la semántica, Consciente del entorno, Ajustable al modelo

**"La semántica está unificada, pero los entornos están fragmentados."**

A partir de 2026, la industria se ha dado cuenta de que construir un repositorio nativo de IA requiere separar tres capas distintas:
1. **El Modelo / Proveedor del Modelo** (p. ej., OpenAI, Anthropic, Google, DeepSeek, Qwen, Meta, Moonshot, Zhipu, MiniMax): Determina la capacidad bruta y el razonamiento del modelo subyacente. Nunca fijes aquí una versión específica de un modelo — consulta la [Matriz de Compatibilidad de Modelos](spec/model-compatibility.md) para el mapeo completo de Runtime × Proveedor de Modelo.
2. **El entorno del agente (Runtime)** (p. ej., Claude Code, Codex, Gemini CLI, Cursor): Determina *cómo* se leen los archivos, *cuándo* se invocan las habilidades y *qué* ganchos se ejecutan.
3. **El Estándar del Repositorio** (Contexto, Contratos, Flujos de trabajo): La verdad semántica universal de tu proyecto.

Aunque la semántica de negocio de tu proyecto es **Agnóstica al modelo** (tanto los modelos de OpenAI como los de Anthropic pueden entender un archivo `docs/domains/voice.md`), deben ser **Conscientes del entorno**.
- **Claude Code de Anthropic** espera `.claude/settings.json` (enfocándose en los ganchos de ciclo de vida).
- **Cursor** espera `.cursor/rules/*.mdc` (enfocándose en la coincidencia de archivos globales).

**Proveedor del Modelo ≠ Entorno del Agente — no los combines en un solo eje.** Ningún entorno pertenece a un único proveedor de modelo (Cursor y Claude Code pueden ejecutarse con Anthropic, OpenAI, o proveedores compatibles como DeepSeek). Por eso el Proveedor del Modelo se registra por separado en la [Matriz de Compatibilidad de Modelos](spec/model-compatibility.md) en lugar de convertirse en una plantilla propia.

### Repositorios de Referencia vs Consumidores
- **Este repositorio (Referencia)**: Este repositorio de GitHub es el *Repositorio de Referencia* global. Contiene múltiples adaptadores, el generador de plantillas y el código CLI.
- **Tu repositorio (Consumidor)**: El repositorio generado por la CLI es un *Repositorio Consumidor*. Debe contener exactamente **un** adaptador de entorno y **un** nivel de complejidad, para asegurar que el agente de IA nunca se confunda con reglas en conflicto.

### Runtimes de Referencia actuales vs Runtimes emergentes
Este repositorio ofrece plantillas de primera clase para cuatro **Runtimes de Referencia** hoy: `claude-code`, `codex`, `gemini-cli`, `cursor`. Otros entornos reales — Qwen Code, DeepSeek Harness, Windsurf, GitHub Copilot, entre otros — se registran como **Runtimes Emergentes** en la [Matriz de Compatibilidad de Modelos](spec/model-compatibility.md) y podrían pasar a ser de Referencia cuando sus convenciones se estabilicen.

---

## 🏗 Los 8 pilares de la arquitectura nativa de IA

Este estándar eleva el repositorio de un "libro para que la IA lea" a un "espacio de trabajo para que la IA opere". Define 8 capas arquitectónicas:

### 1. Contexto (El "Qué")
*`PROJECT_MAP`, `Domains`, `Architecture`*
Le dice a la IA qué es el sistema, dónde están las cosas y por qué se construyeron de esa manera.

### 2. Reglas (Las "Instrucciones y restricciones")
*`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`*
Instrucciones para el agente y restricciones declaradas. Cómo debe formatearse el código y qué límites arquitectónicos deben respetarse.

### 3. Contratos (El "Cómo se conectan")
*`Protocols`, `Schemas`, `API Definitions`*
Límites explícitos entre componentes. Los agentes de IA dependen de interfaces explícitas mucho más que los humanos.

### 4. Habilidades (El "Cómo hacer una tarea específica")
*`SKILL.md`*
Capacidades atómicas reutilizables.

### 5. Flujos de trabajo (El "Cómo orquestar")
*`SOPs`*
Procedimientos de múltiples pasos (ej. "Plan -> Verificar -> Implementar -> Probar -> Actualizar Documentos").

### 6. Herramientas (El "Cómo tocar el mundo")
*`MCP Servers`, `Scripts CLI deterministas`*
Capacidades estructuradas que el agente puede usar para leer bases de datos, compilar código, etc.

### 7. Verificación (La "Evidencia")
*`Tests`, `Validators`, `Hooks`*
El cierre automático del ciclo. El trabajo de un agente no termina hasta que el script validador devuelve el código 0.

### 8. Límite Humano/Agente (La "Barrera de confianza")
*`MANUAL_TASKS.md`*
Una clara delineación de permisos: Qué puede hacer la IA de forma autónoma, para qué debe pedir permiso (ej. despliegues de producción) y qué deben hacer los humanos manualmente.

---

## 📂 Guía del Desarrollador

Si deseas contribuir al propio Estándar:

```text
AI-Native-Repo/ (Repositorio de Referencia)
│
├── spec/                        # El Estándar: Teorías y filosofía
├── cli/                         # Código fuente de `npx ai-native-repo`
├── template-source/             # La ÚNICA fuente de la verdad para todas las plantillas
│   ├── common/                  # Documentos compartidos
│   └── runtimes/                # Adaptadores específicos (Claude, Cursor, etc.)
│
├── scripts/
│   ├── generate-templates.js    # Construye la matriz de 12 combinaciones
│   └── validate.sh              # Pipeline CI para verificar la integridad
└── anr.yaml                     # El manifiesto legible por máquina
```
