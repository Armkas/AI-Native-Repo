# AI-Native Repository Standard & Reference Implementation

[🇺🇸 English](README.md) | [🇨🇳 简体中文](README.zh-CN.md) | [🇹🇼 繁體中文](README.zh-TW.md) | [🇯🇵 日本語](README.ja.md) | [🇪🇸 Español](README.es.md) | [🇫🇷 Français](README.fr.md) | [🇩🇪 Deutsch](README.de.md) | [🇷🇺 Русский](README.ru.md) | [🇺🇦 Українська](README.uk.md) | [🇧🇷 Português](README.pt-BR.md) | [🇰🇷 한국어](README.ko.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇸🇦 العربية](README.ar.md)

> **"Los proveedores estandarizan cómo la IA entra al repositorio. ANR estandariza cómo se diseña el repositorio como un activo de ingeniería duradero para los agentes de IA."**

Un estándar entre agentes, arquitectura de referencia y plataforma de gobernanza del ciclo de vida para estructurar, verificar y mantener repositorios de software preparados para IA.

---

## 🤔 ¿Necesitas ANR? (Dos caminos hacia un repositorio AI-Friendly)

**NO necesitas instalar ANR para construir un repositorio adaptado para IA.**  
Los entornos de agentes modernos (Claude Code, OpenAI Codex, Cursor, Gemini CLI, Copilot) ya proporcionan mecanismos nativos de instrucciones, reglas, hooks y habilidades. ANR separa limpiamente la **Capacidad de Ejecución del Agente (el sistema operativo)** de la **Arquitectura y Gobernanza del Contexto del Repositorio (la organización duradera del código)**.

### Camino A: Configuración Manual Sin Herramientas (Recomendado para desarrolladores individuales y prototipos)
Si mantienes un proyecto personal o un repositorio pequeño, no necesitas ningún CLI externo. Simplemente sigue los principios fundamentales de ANR:
1. **Enrutador Global Mínimo**: Mantén un `AGENTS.md` (o `CLAUDE.md`, `GEMINI.md`) en la raíz limitado a un presupuesto de `<= 2048 bytes (2 KiB)`. Actúa como controlador de tráfico aéreo, enrutando hacia el contexto en lugar de saturar la memoria con una enciclopedia del proyecto.
2. **Flujos de Trabajo Modulares con Agent Skills**: Coloca acciones procedimentales repetibles en el formato abierto [Agent Skills](https://agentskills.io) en `.agents/skills/<nombre>/SKILL.md`.
3. **Capas Estructuradas de Dominios y Contratos**: Mueve la arquitectura y conocimiento del negocio a `docs/domains/`, y esquemas de bases de datos y APIs a `docs/contracts/`.
4. **Divulgación Progresiva del Contexto**: Asegúrate de que el agente solo lea la documentación relevante para su tarea actual.
5. **Verificación Determinista**: Define comandos explícitos de prueba y compilación que deben aprobarse antes de que el agente declare el trabajo terminado.
6. **Límites Humanos Ejecutables**: Protege configuraciones críticas o scripts de despliegue mediante hooks o comprobaciones de CI.

---

### Camino B: Plataforma de Ciclo de Vida Estandarizada (ANR CLI — Para equipos y entornos multi-agente)
Cuando gestionas sistemas de producción en equipo o con múltiples agentes de IA, ANR proporciona un marco auditado y automatizado:
- **Portabilidad entre Agentes**: Mapea una única fuente de verdad (`docs/`, `.agents/skills/`) de forma limpia entre Claude Code, Codex, Cursor y Gemini CLI sin duplicar reglas.
- **Gobernanza Multirrepositorio**: Aplica estándares estructurales, contratos y límites de permisos consistentes en decenas de microservicios o bibliotecas.
- **Mantenimiento y Evolución (Día 2)**: Usa `anr update` con fusión profunda de JSON respetuosa con la autoría y detección de obsoletos con `--prune`, y ejecuta `anr doctor` para auditar enlaces rotos y cumplimiento de skills.

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
- `standard`: El predeterminado. Arquitectura completa de Contexto, Contratos y Reglas para servicios en producción, con criterios de aceptación, planes de tarea y una revisión independiente basada en rúbrica.
- `full`: Barreras de alta madurez. Standard más barreras de rutas (archivos de solo lectura / solo anexar, aplicadas con hooks o CI), un verificador de frescura del contexto y evaluaciones de comportamiento de la capa de contexto.

*Alternativamente, puedes omitir las preguntas interactivas:*
```bash
npx ai-native-repo init . --runtime cursor --tier standard
npx ai-native-repo init . --runtime claude-code --tier full --lang zh-CN   # en (default) | zh-CN | ja
```

---

## 🎯 Ventaja Principal: La Doble Arquitectura "Progresiva" (The Dual Progressive Architecture)

La mayoría de las plantillas de prompts de IA fallan en proyectos complejos del mundo real por dos razones: **la saturación de contexto (Context Bloat) degrada la atención de la IA**, y **el alto coste de configuración inicial hace imposible su adopción en repositorios existentes**. El Estándar de Repositorio Nativo de IA resuelve ambos problemas mediante un diseño progresivo dual:

### 1. Revelación Progresiva del Contexto (Progressive Context Disclosure) — Preservar la atención de la IA
> **Context Must Be Earned (El contexto debe ganarse bajo demanda).**

Nunca alimentes a un agente con un prompt monolítico de 100.000 palabras. El punto de entrada global (`AGENTS.md`) está estrictamente limitado a **<= 2048 bytes (2 KiB)** para actuar como un controlador de tráfico aéreo ultraligero. El agente descubre el contexto capa por capa según sea necesario:

* **L0: Agent Rules (<= 2048 bytes)** → ¿Cómo debe comportarse la IA? (Reglas globales y enrutamiento)
* **L1: Project Map (< 100 líneas)** → ¿Qué es este proyecto y dónde está cada cosa? (Mapa físico)
* **L2: Architecture / Domain** → ¿Qué problema de negocio resuelve este dominio?
* **L3: Interface / Contract** → ¿Cómo se comunican los componentes entre sí?
* **L4: Invariants / Tests** → ¿Qué reglas NUNCA deben romperse? ¿Cómo verificarlo?
* **L5: Implementation** → Código fuente real

**Solo se carga el contexto necesario para la tarea actual.** Esto reduce drásticamente el consumo de tokens y elimina la degradación de la atención y las alucinaciones en modelos grandes.

### 2. Adopción Progresiva del Repositorio (Progressive Repository Adoption) — Migración sin fricción para proyectos existentes
> **No se requiere empezar desde cero. Cualquier base de código existente puede evolucionar en 10 minutos.**

No necesitas documentar todo tu código heredado de la noche a la mañana. Mediante el **Modelo de Niveles de Complejidad (Tiers)**, un repositorio existente adopta las prácticas nativas de IA de forma progresiva:

* **Día 1 (Tier 1: Light) — Configuración en 10 minutos**: Cero reescrituras de código. Genera un enrutador de < 2KB, deja que la IA escanee tu árbol existente para generar un `PROJECT_MAP.md` realista, y define límites en `MANUAL_TASKS.md`. La IA deja de alucinar sobre la estructura de inmediato.
* **Día 30 (Tier 2: Standard) — Conocimiento bajo demanda**: Documenta solo lo que tocas. Cuando la IA trabaje en un módulo específico (p. ej., autenticación), documenta `domains/auth.md` en esa misma PR e implementa bucles de verificación mediante el skill `verify`.
* **Día 90 (Tier 3: Full) — Guardarraíles empresariales**: Una vez que el equipo se sienta cómodo, introduce guardarraíles de rutas (archivos de solo lectura/solo adición) y comprobaciones automáticas de frescura en CI.

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
*`SOPs`, `Plans`*
Procedimientos de múltiples pasos (ej. "Definir criterios de aceptación -> Verificar invariantes -> Implementar -> Probar -> Verificar -> Revisar -> Actualizar documentos"), más planes de tarea versionados en `docs/plans/` para que la siguiente sesión continúe en lugar de empezar de cero.

### 6. Herramientas (El "Cómo tocar el mundo")
*`MCP Servers`, `Scripts CLI deterministas`, `.agents/tools.md`*
Capacidades estructuradas que el agente puede usar para leer bases de datos, compilar código, etc. Cada herramienta se declara en `.agents/tools.md` con su nivel de riesgo, y las credenciales nunca viven en la configuración versionada.

### 7. Verificación y evaluación (La "Evidencia")
*`Tests`, `Validators`, `Hooks`, `Review`, `Evals`*
El cierre automático del ciclo, ordenado por fiabilidad. Primero las comprobaciones deterministas: el trabajo de un agente no termina hasta que devuelven el código 0. Solo después, un **LLM-as-a-judge acotado** revisa lo que ningún comando puede decidir —criterios de aceptación cumplidos, alcance respetado, documentación aún veraz— con una rúbrica versionada, un contexto independiente, `UNKNOWN` como respuesta válida y sin poder para anular una comprobación fallida. Las evaluaciones de comportamiento verifican que la propia capa de contexto guíe a los agentes hacia el comportamiento correcto.

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
