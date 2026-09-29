# AI-Native Repository Standard 2.0

[简体中文](repository-standard.zh-CN.md)

## Repository Design Specification for AI Coding Agents

> For the reasoning behind these rules, see [Philosophy](philosophy.md)
> ([简体中文](philosophy.zh-CN.md) · [日本語](philosophy.ja.md)).

---

# 0. The AI-Native Shift

This standard elevates the repository from a passive "book for AI to read" into an active "workspace for AI to operate."

We define the **8-Pillar AI-Native Architecture** that sits alongside your traditional Software Architecture (MVVM, Clean, DDD, etc.):

1. **Context** (Project Map, Domains, Architecture) - *What the system is.*
2. **Rules** (AGENTS.md, Cursor Rules) - *What the agent must/must not do.*
3. **Contracts** (Protocols, Schemas) - *How components collaborate.*
4. **Skills** (SKILL.md) - *How to perform specific atomic tasks.*
5. **Workflows** (SOPs) - *How to orchestrate a complex development process.*
6. **Tools** (MCP, CLI, Scripts) - *How the agent touches the world.*
7. **Verification** (Tests, Validators, Hooks) - *How to prove the agent did it right.*
8. **Human / Agent Boundary** (MANUAL_TASKS.md) - *What decisions must be made by humans.*

---

# I. Context Must Be Earned

## Rule 01 — Context must be loaded on-demand
Do not bloat the agent's context window by injecting all domains, rules, and skills for every task. The global router (`AGENTS.md`) should remain small (< 2KB). Specific context (e.g., a Database Schema or a Feature Development Skill) must only be loaded when the specific task requires it.

## Rule 02 — Progressive Disclosure
Progressive Disclosure is a context-routing policy, not a fixed reading order. The agent should dynamically route to the necessary context:
`Task` → `Project Map` → `Domain / Contract` → `Implementation / Test`

---

# II. Standardize Concepts, Isolate Runtimes

## Rule 03 — Semantic-Agnostic, Runtime-Aware, Model-Tunable
The AI industry requires separating three distinct layers:
1. **The Model / Model Provider** (e.g., OpenAI, Anthropic, Google, DeepSeek, Qwen, Meta, Moonshot, Zhipu, MiniMax): The underlying reasoning engine's provider or family. Never hard-code a specific model version here — providers and families change far less often than model names.
2. **The Agent Runtime** (e.g., Claude Code, Codex, Gemini CLI, Cursor, Qwen Code, DeepSeek Harness): *How* files are read, *when* skills are invoked, and *what* hooks execute.
3. **The Repository Standard** (The semantics): *What* your project is.

Your repository's semantics (Domains, Contracts, Workflows) must be **Model-Agnostic**. However, because different agent runtimes expect configurations in different directories (`.claude/`, `.cursor/rules/`, `.agents/skills/`), your repository's setup must be **Runtime-Aware**. Optionally, a small, isolated layer of prompt/skill wording may be **Model-Tunable** — adjusted for a specific model's context window or instruction style — but this must never leak into the Repository Standard's core semantics.

**Model Provider ≠ Agent Runtime — do not collapse them into one axis.** A Runtime is not owned by a single Model Provider (Cursor and Claude Code can both be driven by Anthropic, OpenAI, or API-compatible providers such as DeepSeek), and a single provider's models can show up inside multiple runtimes (Qwen Code natively runs Qwen but also supports DeepSeek, OpenAI, and Anthropic as configured providers). Because of this, **Model Provider must never become a Template dimension** (there is no `templates/deepseek/` or `templates/qwen/`); it is tracked separately in the [Model Compatibility Matrix](model-compatibility.md).

**Establish Explicit Runtime Ownership.**
While a production project can use multiple agent runtimes concurrently (e.g. Cursor for devs + Claude Code for CI scripts), you must explicitly divide ownership. The business logic (`docs/domains`) remains universal, but you must never duplicate identical business rules across `.cursor/rules/` and `.claude/skills`. Each runtime adapter must cleanly route to the single source of semantic truth.

The same applies to skills and guardrails: canonical skills live once in `.agents/skills/<name>/SKILL.md`, and a runtime that needs its own directory (`.claude/skills`, `.gemini/skills`) receives a **symlink**, not a copy. Guardrail logic lives in runtime-neutral scripts; adapters only wire the trigger (a hook, or a CI step where the runtime has no hooks). See [Runtime Adapters](adapters.md).

---

# III. The Human-Agent Boundary

## Rule 04 — Clone ≠ Trust
Agent scripts, Hooks (e.g., `PreToolUse`), and MCP server configurations can be version-controlled in Git to ensure reproducibility. However, **cloning a repository does not equal trust.** Any automated hook or tool that can execute code or modify the environment must require explicit human authorization before being enabled.

## Rule 05 — Explicit Permission Boundaries (`MANUAL_TASKS.md`)
Every AI-Native repository must define what the AI is allowed to do autonomously versus what requires human intervention.
- **[Autonomous]**: e.g., Write code, run tests, format files.
- **[Approval Required]**: e.g., Production database migrations, pushing to the main branch.
- **[Manual Only]**: e.g., Injecting production secrets, updating DNS records, physical device testing.

---

# IV. Cognitive Structure

## Rule 06 — The Project Map
A concise `< 100 lines` map (e.g., `docs/PROJECT_MAP.md`) must exist to quickly build global awareness of where major components live.

## Rule 07 — Interfaces Before Implementations
Business capabilities must prioritize Interface definitions (Protocols, abstract classes). Interfaces must document responsibilities, inputs, outputs, errors, and side effects.

## Rule 08 — Invariants
Business rules that must never be broken (e.g., "Network failure → fallback" or "High-risk action → explicit confirmation") must be explicitly documented (e.g., `docs/invariants/`), not just hidden in code.

---

# V. Verification

## Rule 09 — Closed-Loop Verification
An AI agent's job is not complete when the code is written. The repository must provide deterministic validators (e.g., `scripts/validate.sh`, linters, type checkers, test suites). The agent must run these tools and confirm a `0` exit code before concluding a task.

---

# VI. Explicit structure, not excessive abstraction

AI-Native ≠ Abstraction-Heavy. Keep architectural boundaries explicit, files small (< 500 lines preferred), and symbol names meaningful. The goal is smaller cognitive boundaries for the AI.