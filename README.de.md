# AI-Native Repository Standard

[🇺🇸 English](README.md) | [🇨🇳 简体中文](README.zh-CN.md) | [🇹🇼 繁體中文](README.zh-TW.md) | [🇯🇵 日本語](README.ja.md) | [🇪🇸 Español](README.es.md) | [🇫🇷 Français](README.fr.md) | [🇩🇪 Deutsch](README.de.md) | [🇷🇺 Русский](README.ru.md) | [🇺🇦 Українська](README.uk.md) | [🇧🇷 Português](README.pt-BR.md) | [🇰🇷 한국어](README.ko.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇸🇦 العربية](README.ar.md)

> **Don't just give AI more context. Give it a native workspace.**
> **Gib der KI nicht nur mehr Kontext. Gib ihr einen nativen Arbeitsbereich.**

Ein Standard, ein CLI-Scaffold und eine Referenzarchitektur zum Aufbau von Repositories, die KI-Programmieragenten autonom verstehen, navigieren, ändern und verifizieren können.

---

## 🚀 Schnellstart: Das CLI-Scaffold

Du musst keine Dateien mehr manuell kopieren. Wir bieten eine leistungsstarke CLI, mit der du sofort einen KI-nativen Arbeitsbereich erstellen kannst, der auf deine bevorzugte Agenten-Laufzeitumgebung und Projektkomplexität zugeschnitten ist.

**Führe den folgenden Befehl in einem beliebigen leeren Verzeichnis aus:**

```bash
npx ai-native-repo init .
```

### Die 12-Vorlagen-Matrix
Die CLI fordert dich interaktiv auf, aus unserer 12-Vorlagen-Matrix (4 Runtimes × 3 Tiers) zu wählen:

**Schritt 1: Wähle deine Agent Runtime**
- `claude-code`: Reine Anthropic-Ökosystem-Hooks und Skills.
- `codex`: Reine OpenAI/Codex-Agentenstruktur.
- `cursor`: Optimiert für Cursors `.cursor/rules/*.mdc`.
- `gemini-cli`: Reine Google Gemini Umgebung.

**Schritt 2: Wähle deinen Komplexitätsgrad (Tier)**
- `light`: Die absolut minimalen Kontextdateien für einfache Skripte.
- `standard`: Der Standard. Vollständige Kontext-, Vertrags- und Regelarchitektur.
- `full`: Enterprise-Klasse. Standard plus Pfad-Guardrails (schreibgeschützte / nur-anhängen Dateien, durchgesetzt per Hook oder CI) und ein Kontext-Aktualitätscheck.

*Alternativ kannst du die Eingabeaufforderungen mit Parametern überspringen:*
```bash
npx ai-native-repo init . --runtime cursor --tier standard
npx ai-native-repo init . --runtime claude-code --tier full --lang zh-CN   # en (default) | zh-CN | ja
```

---

## 🎯 Kernvorteil: Die doppelte "progressive" Architektur (The Dual Progressive Architecture)

Die meisten KI-Prompt-Vorlagen scheitern in komplexen Projekten aus zwei Gründen: **Context Bloat führt zum Verlust der KI-Aufmerksamkeit**, und **hohe Einstiegshürden machen die Übernahme in bestehende Projekte unmöglich**. Der AI-Native Repository Standard löst beides durch ein duales progressives Konzept:

### 1. Progressive Kontext-Offenlegung (Progressive Context Disclosure) — KI-Aufmerksamkeit bewahren
> **Context Must Be Earned (Kontext muss bei Bedarf verdient werden).**

Füttere einen KI-Agenten niemals mit einem riesigen 100.000-Wörter-Prompt. Der globale Einstiegspunkt (`AGENTS.md`) ist strikt auf **<= 2048 bytes (2 KiB)** begrenzt und agiert als leichtgewichtiger "Fluglotse". Der Agent erschließt den Kontext Schicht für Schicht nach Bedarf:

* **L0: Agent Rules (<= 2048 bytes)** → Wie soll sich die KI verhalten? (Verhaltensregeln und globales Routing)
* **L1: Project Map (< 100 Zeilen)** → Was ist dieses Projekt und wo ist alles? (Physische Karte)
* **L2: Architecture / Domain** → Welches fachliche Problem löst diese Domäne?
* **L3: Interface / Contract** → Wie kommunizieren Komponenten miteinander?
* **L4: Invariants / Tests** → Welche Regeln dürfen NIEMALS verletzt werden? Wie wird verifiziert?
* **L5: Implementation** → Eigentlicher Quellcode

**Es wird nur der für die aktuelle Aufgabe benötigte Kontext geladen.** Dies senkt den Token-Verbrauch drastisch und eliminiert Aufmerksamkeitsverlust und Halluzinationen.

### 2. Progressive Repository-Einführung (Progressive Repository Adoption) — Reibungslose Migration für bestehende Projekte
> **Kein Neustart auf der grünen Wiese erforderlich. Jedes bestehende Projekt kann sich in 10 Minuten weiterentwickeln.**

Du musst nicht über Nacht die gesamte Legacy-Codebasis dokumentieren. Über das **Stufenmodell (Tiers)** wächst ein bestehendes Projekt schrittweise in den AI-Native-Standard hinein:

* **Tag 1 (Tier 1: Light) — 10-Minuten-Setup**: Kein Code wird umgeschrieben. Richte einen <= 2048-byte router ein, lass die KI deine Struktur scannen, um eine realistische `PROJECT_MAP.md` zu erstellen, und setze Grenzen in `MANUAL_TASKS.md`. Die KI hört sofort auf, im Projekt umherzuirren.
* **Tag 30 (Tier 2: Standard) — Wissen auf Abruf**: Dokumentiere nur das, was angefasst wird. Wenn die KI an einem Modul (z. B. Auth) arbeitet, erfasse `domains/auth.md` in diesem PR und binde den Verifizierungs-Loop über den Skill `verify` ein.
* **Tag 90 (Tier 3: Full) — Enterprise-Schutz**: Sobald das Team vertraut ist, aktiviere Pfad-Schutzregeln (Read-Only/Append-Only) und automatisierte Frischeprüfungen in der CI.

---

## ⚠️ Semantikunabhängig, Laufzeitabhängig, Modellanpassbar

Ab 2026 hat die Branche erkannt, dass der Aufbau eines KI-nativen Repositories die Trennung von drei verschiedenen Ebenen erfordert:
1. **Das Modell / der Model Provider** (z. B. OpenAI, Anthropic, Google, DeepSeek, Qwen, Meta, Moonshot, Zhipu, MiniMax): Bestimmt die rohe Fähigkeit und das Schlussfolgern des zugrunde liegenden Modells. Schreibe hier niemals eine konkrete Modellversion fest — siehe die [Model Compatibility Matrix](spec/model-compatibility.md) für die vollständige Runtime × Model Provider Zuordnung.
2. **Die Agent Runtime** (z. B. Claude Code, Codex, Gemini CLI, Cursor): Bestimmt, *wie* Dateien gelesen werden und *wann* Hooks ausgeführt werden.
3. **Der Repository Standard**: Die universelle semantische Wahrheit deines Projekts.

Während die Geschäftssemantik deines Projekts **modellunabhängig** ist, muss sie **laufzeitabhängig** sein.
- **Anthropics Claude Code** erwartet `.claude/settings.json`.
- **Cursor** erwartet `.cursor/rules/*.mdc`.

**Model Provider ≠ Agent Runtime — verschmelze sie nicht zu einer Achse.** Keine Runtime gehört einem einzigen Model Provider (Cursor und Claude Code lassen sich beide mit Anthropic, OpenAI oder API-kompatiblen Anbietern wie DeepSeek betreiben). Deshalb wird der Model Provider separat in der [Model Compatibility Matrix](spec/model-compatibility.md) erfasst, statt zu einer eigenen Template-Dimension zu werden.

### Referenz- vs. Consumer-Repositories
- **Dieses Repository (Referenz)**: Dieses GitHub-Repository ist das globale *Referenz-Repository*. Es enthält mehrere Adapter, den Vorlagengenerator und den CLI-Code.
- **Dein Repository (Consumer)**: Das von der CLI erzeugte Repository ist ein *Consumer-Repository*. Es sollte genau **einen** Runtime-Adapter und **einen** Tier enthalten, damit der KI-Agent nie durch widersprüchliche Regelsätze verwirrt wird.

### Aktuelle Referenz-Runtimes vs. entstehende Runtimes
Dieses Repository bietet heute erstklassige Vorlagen für vier **Referenz-Runtimes**: `claude-code`, `codex`, `gemini-cli`, `cursor`. Andere reale Runtimes — Qwen Code, DeepSeek Harness, Windsurf, GitHub Copilot und weitere — werden als **entstehende Runtimes** in der [Model Compatibility Matrix](spec/model-compatibility.md) geführt und können zu Referenz-Runtimes aufsteigen, sobald sich ihre Konventionen stabilisiert haben.

---

## 🏗 Die 8 Säulen der KI-Nativen Architektur

Dieser Standard erhebt das Repository von einem "Buch zum Lesen für die KI" zu einem "Arbeitsbereich für die KI". Er definiert 8 Architekturebenen:

1. **Kontext (Das "Was")**: *`PROJECT_MAP`, `Domains`, `Architecture`*
2. **Regeln (Die "Anweisungen & Einschränkungen")**: *`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`*
3. **Verträge (Das "Wie sie sich verbinden")**: *`Protocols`, `Schemas`, `API Definitions`*
4. **Fähigkeiten (Das "Wie man eine spezifische Aufgabe erledigt")**: *`SKILL.md`*
5. **Workflows (Das "Wie man orchestriert")**: *`SOPs`*
6. **Werkzeuge (Das "Wie man die Welt berührt")**: *`MCP Servers`, `Deterministic CLI Scripts`*
7. **Verifizierung (Der "Beweis")**: *`Tests`, `Validators`, `Hooks`*. Die Arbeit eines Agenten ist nicht beendet, bis das Validator-Skript 0 zurückgibt.
8. **Mensch / Agent-Grenze (Die "Vertrauensbarriere")**: *`MANUAL_TASKS.md`*

---

## 📂 Entwicklerhandbuch

```text
AI-Native-Repo/ (Reference Repository)
│
├── spec/                        # Der Standard: Werkzeugunabhängige Theorien
├── cli/                         # Quellcode für das `npx ai-native-repo` Tool
├── template-source/             # Die EINZIGE Wahrheitsquelle für alle Vorlagen
│   ├── common/                  
│   └── runtimes/                
│
├── scripts/
│   ├── generate-templates.js    # Erstellt die 12-Matrix-Kombinationen
│   └── validate.sh              # CI-Pipeline
└── anr.yaml                     # Das maschinenlesbare Manifest
```
