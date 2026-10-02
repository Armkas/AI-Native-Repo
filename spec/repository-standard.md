# AI-Native Repository Standard 2.0

[简体中文](repository-standard.zh-CN.md)

## Repository Design Specification for AI Coding Agents

> For the theoretical background and reasoning behind these rules, see [Philosophy](philosophy.md)
> ([简体中文](philosophy.zh-CN.md) · [日本語](philosophy.ja.md)).

---

## Conformance Notation (RFC 2119)
The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHOULD**, **RECOMMENDED**, and **MAY** in this specification are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt).
- **Normative Rules**: Hard requirements verified by validators and tests.
- **Recommended Heuristics**: Practical engineering guidance based on cognitive budget.
- **Informative Rationale**: Background context and design motivations (detailed in Philosophy).

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

# I. Context Management

## Rule 01 (Normative) — Minimal Global Router Budget
The global router (`AGENTS.md`) **MUST** serve strictly as a pointer and directory router, and **MUST NOT** embed deep domain implementations, full schemas, or large documentation dumps.
- To prevent instruction bloat and preserve attention, the router **MUST** adhere to an ANR design budget of **<= 2048 bytes (2 KiB)**.
- Task-specific context **MUST** be loaded on-demand rather than injected into always-on prompt state.

## Rule 02 (Heuristic) — Progressive Disclosure
Context routing **SHOULD** follow a progressive disclosure pattern rather than a monolithic dump:
`Task` → `Project Map` → `Domain / Contract` → `Implementation / Test`

---

# II. Standardize Semantics, Isolate Runtimes

## Rule 03 (Normative) — Separation of Concerns: Model Provider × Agent Runtime × Repository Standard
ANR formalizes the separation of three distinct operational layers:
1. **The Model / Model Provider** (e.g., OpenAI, Anthropic, Google, DeepSeek, Qwen, Meta, Moonshot, Zhipu, MiniMax): The underlying reasoning engine. Models **MUST NOT** be hard-coded into repository paths or template variants.
2. **The Agent Runtime** (e.g., Claude Code, Codex, Gemini CLI, Cursor): *How* files are read, *when* skills are invoked, and *what* hooks execute.
3. **The Repository Standard** (Canonical Semantic Intent): *What* your project is intended to be.

**Model Provider ≠ Agent Runtime — they MUST NOT be collapsed into one axis.**
A Runtime is not owned by a single Model Provider (Cursor and Claude Code can both be driven by Anthropic, OpenAI, or API-compatible providers such as DeepSeek). Providers are tracked in the [Model Compatibility Matrix](model-compatibility.md), never as distinct template directories.

## Rule 04 (Normative) — Single Source of Canonical Intent
Canonical semantic intent **MUST** live in `docs/` and `.agents/`. Runtime-specific adapter files (`CLAUDE.md`, `.cursor/rules/core.mdc`, `GEMINI.md`) **MUST** serve as entrypoint wrappers that route the agent into the canonical intent layer, avoiding duplicated business logic across multiple runtime files.

## Rule 05 (Normative) — Canonical Skills (Agent Skills Open Standard)
All reusable agent skills **MUST** reside canonically in `.agents/skills/<name>/SKILL.md` conforming to the Agent Skills Open Standard:
- Directory name **MUST** match the `name` field in `SKILL.md` frontmatter (lowercase, alphanumeric, and hyphens, <= 64 characters).
- Frontmatter **MUST** contain a non-empty `description` (<= 1024 characters) explaining when and why the skill should be invoked.
- Runtimes with native `.agents/skills` support discover them directly. Runtimes requiring local directories (Claude Code) receive a symlink (`.claude/skills`), never an unmanaged second copy.

---

# III. The Human-Agent Boundary

## Rule 06 (Normative) — Clone ≠ Trust
Agent scripts, hooks, and tool configurations can be version-controlled in Git for reproducibility. However, **cloning a repository does not imply trust.** Any automated hook or tool that executes local code **MUST** require explicit human authorization before being enabled.

## Rule 07 (Normative) — Explicit Permission Boundaries (`MANUAL_TASKS.md`)
Every AI-Native repository **MUST** define explicit permission boundaries in `MANUAL_TASKS.md`:
- **[Autonomous]**: Actions the agent can perform without asking (e.g., editing application source, running test suites, formatting).
- **[Approval Required]**: Sensitive operations requiring confirmation (e.g., database schema migrations, modifying dependencies).
- **[Manual Only]**: Actions exclusively reserved for humans (e.g., injecting production secrets, modifying production DNS, hardware testing).

---

# IV. Cognitive Structure

## Rule 08 (Heuristic) — The Project Map
A concise map (e.g., `docs/PROJECT_MAP.md`) **SHOULD** exist to quickly establish global navigation awareness. It **SHOULD** target approximately <= 100 lines.

## Rule 09 (Normative) — Interfaces Before Implementations
Public and inter-domain boundaries **MUST** prioritize explicit Interface definitions (protocols, abstract types, schemas) before concrete implementations. Interfaces document contracts, inputs, outputs, errors, and side effects.

## Rule 10 (Normative) — Documented Invariants
Inviolable business invariants (e.g., "Payments must be idempotent", "Protected paths are immutable") **MUST** be explicitly documented in `docs/invariants/` and referenced by automated tests.

---

# V. Verification & Quality

## Rule 11 (Normative) — Closed-Loop Deterministic Verification
An AI agent's work is not complete upon code generation. The repository **MUST** provide deterministic verification commands (e.g., linters, type checks, test runners, freshness scripts). The agent **MUST** execute these verifications and confirm a zero exit code (`0`) before concluding a task.

## Rule 12 (Heuristic) — Explicit Structure Over Excessive Abstraction
AI-Native architecture favors explicit, clear boundaries over deep layers of unnecessary indirection, proxies, or facades. Keep source files focused (preferably < 500 lines) to minimize cognitive load.