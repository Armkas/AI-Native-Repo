# AI-Native Repository Standard

[🇺🇸 English](README.md) | [🇨🇳 简体中文](README.zh-CN.md) | [🇹🇼 繁體中文](README.zh-TW.md) | [🇯🇵 日本語](README.ja.md) | [🇪🇸 Español](README.es.md) | [🇫🇷 Français](README.fr.md) | [🇩🇪 Deutsch](README.de.md) | [🇷🇺 Русский](README.ru.md) | [🇺🇦 Українська](README.uk.md) | [🇧🇷 Português](README.pt-BR.md) | [🇰🇷 한국어](README.ko.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇸🇦 العربية](README.ar.md)

> **Don't just give AI more context. Give it a native workspace.**

A standard, CLI scaffold, and reference architecture for building repositories that AI coding agents can understand, navigate, modify, and verify autonomously.

---

## 🚀 Getting Started: The CLI Scaffold

You no longer need to copy files manually. We provide a powerful CLI to instantly scaffold an AI-Native workspace tailored to your preferred Agent Runtime and project complexity.

**Run the following command in any empty directory:**

```bash
npx ai-native-repo init .
```

### The 12-Template Matrix
The CLI will interactively ask you to choose from our 12-template matrix (4 Runtimes × 3 Tiers):

**Step 1: Choose Your Agent Runtime**
- `claude-code`: Pure Anthropic ecosystem hooks and skills.
- `codex`: Pure OpenAI/Codex agent structure.
- `cursor`: Optimized for Cursor's `.cursor/rules/*.mdc` global matching.
- `gemini-cli`: Pure Google Gemini environment.

**Step 2: Choose Your Complexity Tier**
- `light`: The bare minimum context files (PROJECT_MAP + core rules) for simple scripts or prototypes.
- `standard`: The default. Full Context, Contracts, and Rules architecture for production services.
- `full`: Enterprise grade. Standard plus path guardrails (read-only / append-only files, enforced by hooks or CI) and a context freshness checker.

*Alternatively, bypass the prompts with flags:*
```bash
npx ai-native-repo init . --runtime cursor --tier standard
npx ai-native-repo init . --runtime claude-code --tier full --lang zh-CN   # en (default) | zh-CN | ja
```

---

## 🎯 Core Advantage: The Dual "Progressive" Architecture

Most AI prompt templates fail in complex real-world projects for two reasons: **Context Bloat causes AI attention degradation**, and **high upfront setup costs make existing codebases impossible to adopt**. The AI-Native Repository Standard solves both through a dual progressive design:

### 1. Progressive Context Disclosure — Preserving AI Attention
> **Context Must Be Earned.**

Never feed an AI agent a monolithic 100,000-word prompt. The global entrypoint (`AGENTS.md`) is strictly capped at **< 2 KB** to act as a lightweight "air traffic controller." The agent discovers context layer-by-layer on demand, never loading the entire world upfront:

* **L0: Agent Rules (< 2KB)** → How should the AI behave? (Global router & boundaries)
* **L1: Project Map (< 100L)** → What is this project and where is everything? (Physical map)
* **L2: Architecture/Domain** → What business problem does this domain solve?
* **L3: Interface/Contract** → How do components talk to each other?
* **L4: Invariants/Tests** → What rules must NEVER be broken? How to verify?
* **L5: Implementation** → Actual source code

**Only the context required for the current task is loaded.** This slashes token usage and eliminates attention degradation and hallucinations in large models.

### 2. Progressive Repository Adoption — Frictionless Migration for Existing Projects
> **No greenfield requirement. Any existing codebase can evolve in 10 minutes.**

You don't need to document your entire legacy codebase upfront. Through the **Tiered Complexity Model**, an existing repository adopts AI-native practices progressively:

* **Day 1 (Tier 1: Light) — 10-Minute Setup**: Zero code rewrites. Scaffold a < 2KB router, let AI scan your existing tree to generate a realistic `PROJECT_MAP.md`, and set hard boundaries in `MANUAL_TASKS.md`. The AI immediately stops hallucinating project structure.
* **Day 30 (Tier 2: Standard) — On-Demand Knowledge**: Only document what you touch. When the AI works on a specific module (e.g. auth), capture `domains/auth.md` in that PR, and enforce deterministic test loops via the `verify` skill.
* **Day 90 (Tier 3: Full) — Enterprise Guardrails**: Once the team is comfortable, introduce path guardrails (read-only/append-only files) and automated freshness checks in CI.

---

## ⚠️ Semantic-Agnostic, Runtime-Aware, Model-Tunable

**"The semantics are unified, but the runtimes are fragmented."**

As of 2026, the industry has realized that building an AI-Native repository requires separating three distinct layers:
1. **The Model / Model Provider** (e.g., OpenAI, Anthropic, Google, DeepSeek, Qwen, Meta, Moonshot, Zhipu, MiniMax): Determines the underlying model's raw capability and reasoning. Never hard-code a specific model version here — see the [Model Compatibility Matrix](spec/model-compatibility.md) for the current Runtime × Model Provider mapping.
2. **The Agent Runtime** (e.g., Claude Code, Codex, Gemini CLI, Cursor): Determines *how* files are read, *when* skills are invoked, and *what* hooks are executed.
3. **The Repository Standard** (e.g., Context, Contracts, Workflows): The universal semantic truth of your project.

While your project's business semantics are **Model-Agnostic** (both OpenAI and Anthropic models can understand a `docs/domains/voice.md` file), they must be **Runtime-Aware**. 
- **Anthropic's Claude Code** expects `.claude/settings.json` (focusing on lifecycle hooks).
- **Cursor** expects `.cursor/rules/*.mdc` (focusing on multi-model glob matching).

**Model Provider ≠ Agent Runtime.** A Runtime is never owned by a single Model Provider — Cursor and Claude Code can both be driven by Anthropic, OpenAI, or API-compatible providers like DeepSeek, and a single provider's models can show up inside multiple runtimes. That's why Model Provider is tracked separately in the [Model Compatibility Matrix](spec/model-compatibility.md) instead of becoming its own Template.

### Reference vs. Consumer Repositories
- **This Repository (Reference)**: This GitHub repository is the global *Reference Repository*. It contains multiple adapters, the template generator, and the CLI code.
- **Your Repository (Consumer)**: The repository generated by the CLI is a *Consumer Repository*. It should contain exactly **one** Runtime Adapter and **one** Tier, ensuring the AI agent is never confused by competing rule sets.

### Current Reference Runtimes vs. Emerging Runtimes
This repository ships first-class templates for four **Reference Runtimes** today: `claude-code`, `codex`, `gemini-cli`, `cursor`. Other real runtimes — Qwen Code, DeepSeek Harness, Windsurf, GitHub Copilot, and others — are tracked as **Emerging Runtimes** in the [Model Compatibility Matrix](spec/model-compatibility.md) and may graduate to Reference status as their conventions stabilize.

---

## 🏗 The 8-Pillar AI-Native Architecture

This standard elevates the repository from a "book for AI to read" into a "workspace for AI to operate". It defines 8 architectural layers:

### 1. Context (The "What")
*`PROJECT_MAP`, `Domains`, `Architecture`*
Tells the AI what the system is, where things are, and why they were built that way.

### 2. Rules (The "Instructions & Constraints")
*`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`*
Agent instructions and declared constraints. How code must be formatted, how imports must be handled, and what architectural boundaries must be respected.

### 3. Contracts (The "How they connect")
*`Protocols`, `Schemas`, `API Definitions`*
Explicit boundaries between components. AI agents rely on explicit interfaces at meaningful architectural boundaries far more heavily than humans do.

### 4. Skills (The "How to do a specific task")
*`SKILL.md`*
Reusable, atomic capabilities (e.g., "How to generate a database migration in this repo").

### 5. Workflows (The "How to orchestrate")
*`SOPs`*
Multi-step procedures (e.g., "Plan -> Check Invariants -> Implement -> Test -> Verify -> Update Docs").

### 6. Tools (The "How to touch the world")
*`MCP Servers`, `Deterministic CLI Scripts`*
Structured capabilities the agent can use to read the database, fetch logs, or compile code.

### 7. Verification (The "Evidence")
*`Tests`, `Validators`, `Hooks`*
Automated closing of the loop. Code Verification + Agent Behavior Verification. An agent's job isn't done until the validator script returns exit code 0.

### 8. Human / Agent Boundary (The "Trust barrier")
*`MANUAL_TASKS.md`*
A clear delineation of permissions: What the AI can do autonomously, what it must ask permission for (e.g., production deploys), and what humans must do manually.

---

## 📂 Developer Guide

If you want to contribute to the AI-Native Repository Standard itself:

```text
AI-Native-Repo/ (Reference Repository)
│
├── spec/                        # The Standard: Tool-agnostic theories & philosophy
├── cli/                         # Source code for the `npx ai-native-repo` tool
├── template-source/             # The SINGLE Source of Truth for all templates
│   ├── common/                  # Shared docs (Light, Standard, Full)
│   └── runtimes/                # Runtime-specific adapters (Claude, Cursor, etc.)
│
├── scripts/
│   ├── generate-templates.js    # Builds the 12-matrix combinations into cli/templates/
│   └── validate.sh              # CI pipeline to verify repository standard integrity
└── anr.yaml                     # The Machine-readable Manifest
```
