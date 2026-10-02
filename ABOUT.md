# About AI-Native Repository Standard (ANR)

> **"Don't just give AI more context. Give it a native workspace."**

---

## 🌍 Executive Summary & Mission

The **AI-Native Repository Standard (ANR)** is an open-source engineering specification, CLI scaffolding toolchain, and architectural blueprint designed to elevate code repositories from **passive text for AI to read** into **active, deterministic workspaces for AI agents to operate**.

As autonomous coding agents (Claude Code, Cursor, Codex, Gemini CLI) become primary engineering drivers, software repositories require a dedicated **AI Context Architecture** sitting atop conventional application structures (Clean, MVVM, DDD). ANR establishes the industry standard for how AI agents discover knowledge, obey business invariants, execute atomic skills, and verify code correctness autonomously without human babysitting.

---

## ⚡ The Core Problem: Why Conventional Repositories Break AI

By 2026, foundation models have massive context windows and near-human coding capabilities. Yet, teams attempting to scale AI agents across production codebases consistently hit three structural walls:

1. **Context Bloat & Attention Degradation**: Stuffing entire codebases, database schemas, and multi-thousand-word rulebooks into monolithic prompts or `.cursorrules` floods the model's attention span. This leads to needle-in-a-haystack failures, skyrocketing token costs, and catastrophic hallucinations.
2. **The "Brownfield Dilemma" (Legacy Code Friction)**: Most AI project templates assume you are starting from a blank slate. Attempting to force heavy AI rules onto an existing, 100,000-line codebase results in cognitive paralysis, rule collisions, and immediate abandonment by developers.
3. **Runtime Fragmentation & Rule Drift**: Business semantics are universal, but agent runtimes are fragmented. Teams maintain competing, drifting rule sets across `.cursor/rules/*.mdc`, `CLAUDE.md`, `.gemini/settings.json`, and `.agents/skills/`.

---

## 🎯 Signature Advantages & Design Philosophy

ANR solves these problems through several foundational architectural innovations:

### 1. The Dual "Progressive" Architecture (核心杀手锏)

#### A. Progressive Context Disclosure (Preserving AI Attention)
> **Context Must Be Earned.**

Agents should never ingest context all at once. The global root instruction file (`AGENTS.md`) is strictly capped at **< 2 KB**, acting purely as an ultra-lightweight "air traffic controller." The agent discovers context layer-by-layer on demand:

```text
L0  Agent Rules (< 2KB)  →  Global router, behavior boundaries, and red lines
L1  Project Map (< 100L) →  Physical topology map & technology stack declaration
L2  Architecture/Domain  →  Business domain boundaries & high-level domain mechanics
L3  Interface/Contract   →  Explicit RPC protocols, database schemas, and types
L4  Invariants/ADR/Tests →  Inviolable business rules & architectural decision history
L5  Implementation       →  Actual production source code
```

**Result**: Each agent task loads only the minimal context required. Token usage is slashed by up to 80%, and hallucinations are eliminated.

#### B. Progressive Repository Adoption (Zero-Friction for Existing Codebases)
> **No greenfield requirement. Any existing codebase can evolve in 10 minutes.**

Teams do not need to document their entire legacy architecture upfront. Through ANR's tiered complexity model, an existing codebase evolves organically:

* **Day 1 (Tier 1: Light) — 10-Minute Setup**: Zero code rewrites. Scaffold a < 2KB router, let an AI agent scan your directory tree to generate a realistic `PROJECT_MAP.md`, and set red lines in `MANUAL_TASKS.md`. The AI immediately stops hallucinating project structure.
* **Day 30 (Tier 2: Standard) — On-Demand Knowledge**: Only document what you touch. When the AI works on a specific module (e.g., billing), capture `domains/billing.md` inside that PR, and enforce closed-loop verification via the `verify` skill.
* **Day 90 (Tier 3: Full) — Enterprise Guardrails**: Once the team establishes full confidence, activate path guardrails (`protected-paths.txt`) and automated freshness checking in CI.

---

### 2. Three-Layer Decoupling

We strictly separate three distinct layers of modern AI development:

$$\text{Model Provider} \quad\neq\quad \text{Agent Runtime} \quad\neq\quad \text{Repository Standard}$$

1. **Model Provider** (OpenAI, Anthropic, Google, DeepSeek, Qwen, Meta): Determines raw reasoning capability. Never hard-code a specific model version into repository rules.
2. **Agent Runtime** (Claude Code, Codex, Cursor, Gemini CLI): Determines *how* files are discovered, *when* skills are invoked, and *what* lifecycle hooks execute.
3. **Repository Standard** (ANR): The single source of semantic truth for your system (`docs/`).

Business domain semantics are **Model-Agnostic** and **Runtime-Aware**. A single project can be navigated by Cursor in local development and Claude Code in CI without maintaining duplicate domain documentation.

---

### 3. The 8-Pillar Architecture

ANR defines 8 operational pillars that turn codebases into agent workshops:

| Pillar | Focus | Implementation Artifacts |
| :--- | :--- | :--- |
| **1. Context** | "What is this?" | `docs/PROJECT_MAP.md`, `docs/domains/`, `docs/architecture/` |
| **2. Rules** | "Constraints & Directions" | `AGENTS.md`, `.cursor/rules/`, `CLAUDE.md`, `GEMINI.md` |
| **3. Contracts** | "How components connect" | `docs/contracts/`, API schemas, database schemas |
| **4. Skills** | "How to do atomic tasks" | `.agents/skills/<name>/SKILL.md` (Open Agent Skills standard) |
| **5. Workflows** | "How to orchestrate processes"| Standard Operating Procedures (SOPs), feature dev workflows |
| **6. Tools** | "How to touch the world" | MCP Servers, deterministic CLI utilities, build tools |
| **7. Verification** | "Closed-loop proof" | Automated test runners, linters, pre-edit blocking hooks |
| **8. Boundaries** | "Human-Agent trust barrier" | `MANUAL_TASKS.md` (Autonomous vs. Approval vs. Manual Only) |

---

### 4. Deterministic Verification & Real-Time Guardrails

* **Done Means Exit Code 0**: An AI agent's job is not complete when code is written; it is complete only when local automated verification produces deterministic proof of success.
* **Native Pre-Edit Blocking Hooks**: Through `scripts/guard-paths.sh`, ANR wires native pre-edit hooks into Claude Code (`PreToolUse`), Gemini CLI (`BeforeTool`), Codex (`PreToolUse`), and Cursor (`preToolUse`). If an agent attempts to edit sensitive files (e.g., historical migrations, `.env`), the call is blocked in real-time with exit code `2` before the file is touched.

---

## 🛠 What ANR Provides Out-of-the-Box

1. **The Official Specification (`spec/`)**:
   - [Repository Standard](spec/repository-standard.md) ([简体中文](spec/repository-standard.zh-CN.md))
   - [Philosophy & Rationale](spec/philosophy.md) ([简体中文](spec/philosophy.zh-CN.md) · [日本語](spec/philosophy.ja.md))
   - [Runtime Adapters Mapping](spec/adapters.md)
   - [Complexity Tiers](spec/tiers.md)
   - [Model Compatibility Matrix](spec/model-compatibility.md)
2. **The CLI Scaffolding Tool (`anr`)**:
   - Zero external dependencies, pure Node.js CLI:
     ```bash
     npx ai-native-repo init . --runtime cursor --tier standard
     ```
   - 12 pre-built template matrices (4 Runtimes × 3 Tiers).
3. **Reference Implementations (`examples/`)**:
   - Production-ready reference implementations across Claude Code, Cursor, Codex, and Gemini CLI.
4. **Multi-Lingual Global Alignment**:
   - Full specification and documentation synchronized across 13 languages.

---

## 📜 License & Governance

The AI-Native Repository Standard is an open, vendor-neutral standard stewarded by the community under the **MIT License**. We welcome contributions from developers, researchers, and toolmakers worldwide.

* **GitHub Repository**: [https://github.com/Armkas/AI-Native-Repo](https://github.com/Armkas/AI-Native-Repo)
* **Author & Lead Maintainer**: Armkas
* **Standard Version**: 2.0
