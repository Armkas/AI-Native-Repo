# AI-Native Repository Standard & Reference Implementation

[🇺🇸 English](README.md) | [🇨🇳 简体中文](README.zh-CN.md) | [🇹🇼 繁體中文](README.zh-TW.md) | [🇯🇵 日本語](README.ja.md) | [🇪🇸 Español](README.es.md) | [🇫🇷 Français](README.fr.md) | [🇩🇪 Deutsch](README.de.md) | [🇷🇺 Русский](README.ru.md) | [🇺🇦 Українська](README.uk.md) | [🇧🇷 Português](README.pt-BR.md) | [🇰🇷 한국어](README.ko.md) | [🇮🇳 हिन्दी](README.hi.md) | [🇸🇦 العربية](README.ar.md)

> **"Vendors standardize how AI enters the repository. ANR standardizes how the repository is architected as a durable engineering asset for AI agents."**

A cross-agent standard, reference architecture, and lifecycle governance platform for structuring, verifying, and maintaining AI-friendly software repositories.

---

## 🤔 Do You Need ANR? (Two Paths to an AI-Friendly Repo)

**You do NOT need to install ANR to build an AI-friendly repository.**  
Modern agent runtimes (Claude Code, OpenAI Codex, Cursor, Gemini CLI, Copilot) already provide native instructions, hooks, and skills. ANR cleanly separates **Runtime Execution (the Agent's Operating System)** from **Repository Context Architecture & Governance (the Codebase's durable engineering layout)**.

### Path A: Zero-Tooling Manual Setup (Recommended for solo developers & prototypes)
If you maintain a personal project or small repository, you don't need any external CLI. Simply adopt the core ANR architectural principles:
1. **Minimal Global Router**: Keep an `AGENTS.md` (or `CLAUDE.md`, `GEMINI.md`) in the root capped at a `<= 2048 bytes` budget. It acts as an air traffic controller, routing to context rather than stuffing the entire project encyclopedia into prompt memory.
2. **Modular Workflows via Agent Skills**: Place repeatable procedural actions into the open [Agent Skills](https://agentskills.io) standard format at `.agents/skills/<skill-name>/SKILL.md`.
3. **Structured Domain & Contract Layers**: Move architecture and domain knowledge into `docs/domains/`, and database schemas / API schemas into `docs/contracts/`.
4. **Task-Relevant Progressive Disclosure**: Ensure agents only read documentation relevant to their current task.
5. **Deterministic Verification**: Define explicit test and build commands that must pass before an agent claims work is "done".
6. **Enforceable Human Boundaries**: Guard sensitive configurations or release scripts with hooks or CI checks.

---

### Path B: The Standardized Lifecycle Platform (ANR CLI — For teams & multi-agent environments)
When managing production systems across teams or multiple AI agents, ANR provides an audited, automated lifecycle framework:
- **Cross-Agent Portability**: Map one single source of semantic truth (`docs/`, `.agents/skills/`) cleanly across Claude Code, Codex, Cursor, and Gemini CLI without duplicating rules.
- **Multi-Repo Governance**: Enforce consistent structural standards, contracts, and human-in-the-loop permission boundaries across tens of microservices or libraries.
- **Day-2 Lifecycle Management**: Use `anr update` with ownership-aware JSON deep merge and `--prune` obsolete detection, and run `anr doctor` to continuously audit against link rot, skill non-compliance, and context bloat.

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
- `standard`: The default. Full Context, Contracts, and Rules architecture for production services, with acceptance criteria, task plans and an independent rubric-based review.
- `full`: High-maturity guardrails. Standard plus path guardrails (read-only / append-only files, enforced by hooks or CI), a context freshness checker, and behavioral evals of the context layer.

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

Never feed an AI agent a monolithic prompt. The global entrypoint (`AGENTS.md`) adheres to a strict design budget of **<= 2048 bytes (2 KiB)** to act as a lightweight "air traffic controller." The agent discovers context layer-by-layer on demand, never loading the entire world upfront:

* **L0: Agent Rules (<= 2048 bytes)** → How should the AI behave? (Global router & boundaries)
* **L1: Project Map (~100 lines)** → What is this project and where is everything? (Physical map)
* **L2: Architecture/Domain** → What business problem does this domain solve?
* **L3: Interface/Contract** → How do components talk to each other?
* **L4: Invariants/Tests** → What rules must NEVER be broken? How to verify?
* **L5: Implementation** → Actual source code

**Only the context required for the current task is loaded.** This reduces irrelevant context and repository-navigation ambiguity in large models.

### 2. Progressive Repository Adoption — Low-Friction Migration for Existing Projects
> **No greenfield requirement. Any existing codebase can adopt ANR incrementally.**

You don't need to document your entire legacy codebase upfront. Through the **Tiered Complexity Model**, an existing repository adopts AI-native practices progressively:

* **Day 1 (Tier 1: Light) — Low-Friction Setup**: Zero code rewrites. Scaffold a <= 2048-byte router, let AI scan your existing tree to generate a realistic `PROJECT_MAP.md`, and set explicit boundaries in `MANUAL_TASKS.md`. Gives the agent an explicit map of the repository structure.
* **Day 30 (Tier 2: Standard) — On-Demand Knowledge**: Only document what you touch. When the AI works on a specific module (e.g. auth), capture `domains/auth.md` in that PR, and enforce deterministic test loops via the `verify` skill.
* **Day 90 (Tier 3: Full) — High-Maturity Guardrails**: Once the team is comfortable, introduce path guardrails (read-only/append-only files), native runtime hooks, and automated freshness checks in CI.


---

## ⚠️ Semantic-Agnostic, Runtime-Aware, Model-Tunable

**"The semantics are unified, but the runtimes are fragmented."**

As of 2026, major coding-agent runtimes increasingly separate three distinct layers:
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
*`SOPs`, `Plans`*
Multi-step procedures (e.g., "Define acceptance criteria -> Check Invariants -> Implement -> Test -> Verify -> Review -> Update Docs"), plus versioned task plans in `docs/plans/` so the next session continues instead of starting over.

### 6. Tools (The "How to touch the world")
*`MCP Servers`, `Deterministic CLI Scripts`, `.agents/tools.md`*
Structured capabilities the agent can use to read the database, fetch logs, or compile code. Every tool is declared in `.agents/tools.md` with its risk level, and credentials never live in committed configuration.

### 7. Verification & Evaluation (The "Evidence")
*`Tests`, `Validators`, `Hooks`, `Review`, `Evals`*
Automated closing of the loop, ordered by reliability. Deterministic checks come first: an agent's job isn't done until they return exit code 0. Only then a **bounded LLM-as-a-judge** reviews what no command can decide — acceptance criteria met, scope kept, docs still true — using a versioned rubric, an independent context, `UNKNOWN` as a valid answer, and no power to override a failing check. Behavioral evals check that the context layer itself leads agents to the right behavior.

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
