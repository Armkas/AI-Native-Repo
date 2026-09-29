# Runtime Adapters (运行时映射)

This document defines how the universal concepts of the **AI-Native Repository Standard** map to the native mechanisms of specific Agent Runtimes.

> **The semantics are unified, but the runtimes are fragmented.**
> A Runtime Adapter is the translation layer between the universal AI-Native Standard (`docs/`) and the specific tool used by the developer.

## Adapter Responsibilities

An Adapter must fulfill the following responsibilities:
1. **Entry Point Provisioning**: Provide the root instructions file expected by the tool (e.g. `CLAUDE.md`, `.cursor/rules/core.mdc`).
2. **Context Routing**: The adapter MUST route the agent into the `docs/` folder. It must not duplicate the domain rules.
3. **Capability Mapping**: If the Standard specifies a Skill or Hook, the adapter maps it to the tool's native syntax.
4. **Graceful Degradation (N/A)**: If a tool lacks a capability (e.g. Cursor lacks lifecycle hooks), the adapter safely ignores it or maps it to manual steps. **N/A is perfectly acceptable.**

## The Mapping Table

| Canonical Concept | Claude Code | Codex / OpenAI | Cursor | Gemini CLI |
| :--- | :--- | :--- | :--- | :--- |
| **Project Entry Instructions** | `CLAUDE.md` (`@AGENTS.md` import) | `AGENTS.md` | `AGENTS.md` / `.cursor/rules/core.mdc` | `GEMINI.md` (`@AGENTS.md` import) |
| **Skill (Atomic capability)** | `.claude/skills/` → symlink to `.agents/skills/` | `.agents/skills/` (native) | Routed to `.agents/skills/` by `core.mdc` | `.gemini/skills/` → symlink to `.agents/skills/` |
| **Verification Hook / Guardrail** | `.claude/settings.json` `PreToolUse` → `scripts/guard-paths.sh` | CI: `scripts/guard-paths.sh ci <base>` | CI: `scripts/guard-paths.sh ci <base>` | CI: `scripts/guard-paths.sh ci <base>` |
| **Permission Boundary** | `.claude/settings.json` `permissions` | Codex approval / sandbox config | N/A (Manual) | Gemini CLI settings |
| **Subagent Definition** | `.claude/agents/` | `.agents/subagents/` | N/A | `.gemini/agents/` |
| **Tool / MCP Server** | `.mcp.json` / settings | Codex config | `.cursor/mcp.json` | Gemini MCP settings |
| **Path-Scoped Context** | Nested `CLAUDE.md` / `AGENTS.md` | Nested `AGENTS.md` | `.cursor/rules/*.mdc` (globs) | Nested `GEMINI.md` |
| **Ignore Config** | `permissions.deny` `Read(...)` rules | `.agentsignore` (convention) | `.cursorignore` | `.geminiignore` |

### One Source of Truth for Skills

Skills are semantic assets, so they live **once**, runtime-neutrally, in `.agents/skills/<name>/SKILL.md`
(the open Agent Skills format: YAML frontmatter with `name` matching the directory and a `description`
that tells the runtime *when* to load it). A runtime that insists on its own directory gets a **symlink**,
created by `anr init`, never a hand-maintained copy. Copies drift; links cannot.

### Guardrails Are Runtime-Neutral Scripts

Hook logic lives in `scripts/` (e.g. `guard-paths.sh`, rules in `.agents/guardrails/protected-paths.txt`).
The runtime adapter only *wires* it: a `PreToolUse` hook where the runtime supports one, a CI step
(`guard-paths.sh ci origin/main`) where it does not. The rule is written once; only the trigger differs.

### Adding New Adapters
If your team uses a different Agent Runtime (e.g., Windsurf, Trae, GitHub Copilot), you do NOT need to reinvent the AI-Native architecture. You simply provide a new column in this table mapping how that tool implements entry points, skills, hooks, and scopes.

If the tool does not support a feature (e.g., Windsurf does not have native subagents), mark it as **N/A**. The repository remains AI-Native, the runtime simply lacks the capability to execute all of it natively.
