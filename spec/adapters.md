# Runtime Adapters (运行时映射)

This document defines how the universal concepts of the **AI-Native Repository Standard** map to the native mechanisms of specific Agent Runtimes.

> **The semantics are unified, but the runtimes are fragmented.**
> A Runtime Adapter is the translation layer between the universal AI-Native Standard (`docs/`) and the specific tool used by the developer.

## Adapter Responsibilities

An Adapter must fulfill the following responsibilities:
1. **Entry Point Provisioning**: Provide the root instructions file expected by the tool (e.g. `CLAUDE.md`, `.cursor/rules/core.mdc`).
2. **Context Routing**: The adapter MUST route the agent into the `docs/` folder. It must not duplicate the domain rules.
3. **Capability Mapping**: If the Standard specifies a Skill or Hook, the adapter maps it to the tool's native syntax.
4. **Graceful Degradation (N/A)**: If a tool lacks a capability (e.g. Codex has no ignore file), the adapter safely ignores it or maps it to manual steps / CI. **N/A is perfectly acceptable.**

## The Mapping Table

> Runtimes change fast. Every cell below was re-checked against the vendors' official documentation in
> **2026-09**; see [Sources](#sources). When a runtime ships a new mechanism, update the cell and the date.

| Canonical Concept | Claude Code | Codex | Cursor | Gemini CLI |
| :--- | :--- | :--- | :--- | :--- |
| **Project Entry Instructions** | `CLAUDE.md` with an `@AGENTS.md` import (recent versions also read `AGENTS.md` directly when no `CLAUDE.md` exists) | `AGENTS.md` | `AGENTS.md` and/or `.cursor/rules/*.mdc` | `GEMINI.md` with an `@AGENTS.md` import |
| **Skill (Atomic capability)** | `.claude/skills/` → symlink to `.agents/skills/` | `.agents/skills/` (native) | `.agents/skills/` (native; also `.cursor/skills/`) | `.agents/skills/` (native alias of `.gemini/skills/`, takes precedence) |
| **Pre-edit Hook / Guardrail** | `.claude/settings.json` → `PreToolUse` (`Edit\|Write`) | `.codex/hooks.json` → `PreToolUse` (`apply_patch`; input is the patch text) | `.cursor/hooks.json` → `preToolUse` (`Write\|Edit`) | `.gemini/settings.json` → `hooks.BeforeTool` (`write_file\|replace`) |
| **Permission Boundary** | `.claude/settings.json` `permissions` | `.codex/config.toml` approval / sandbox policy | Hooks (`beforeShellExecution`, `beforeReadFile`) | `.gemini/settings.json` |
| **Subagent Definition** | `.claude/agents/` | `.codex/agents/*.toml` | `.cursor/agents/` (also reads `.claude/agents/`, `.codex/agents/`) | `.gemini/agents/` |
| **Tool / MCP Server** | `.mcp.json` | `.codex/config.toml` `[mcp_servers]` | `.cursor/mcp.json` | `.gemini/settings.json` `mcpServers` |
| **Path-Scoped Context** | Nested `CLAUDE.md`, `.claude/rules/*.md` with `paths:` | Nested `AGENTS.md` | `.cursor/rules/*.mdc` (`globs`), nested `AGENTS.md` | Nested `GEMINI.md` |
| **Ignore Config** | `permissions.deny` `Read(...)` rules (also cover `cat` / `head` in Bash) | N/A — keep secrets out of the working tree | `.cursorignore` | `.geminiignore` |

There is **no cross-runtime ignore file**. A file such as `.agentsignore` is read by none of the runtimes
above; do not rely on one to keep secrets away from an agent.

### One Source of Truth for Skills

Skills are semantic assets, so they live **once**, runtime-neutrally, in `.agents/skills/<name>/SKILL.md`
(the open Agent Skills format: YAML frontmatter with `name` matching the directory and a `description`
that tells the runtime *when* to load it). Codex, Cursor and Gemini CLI discover `.agents/skills/` natively.
Claude Code reads only `.claude/skills/`, so `anr init` links that directory to `.agents/skills/` —
never a hand-maintained copy. Copies drift; links cannot.

Claude Code documents a symlink per skill folder (`.claude/skills/<name>` → `../../.agents/skills/<name>`);
linking the whole `.claude/skills` directory, as `anr init` does, is also picked up (verified 2026-09) and
has the advantage that new skills appear without a new link. Do **not** add a `.gemini/skills/` link:
Gemini CLI already reads `.agents/skills/`, and a second path only creates duplicates.

### Guardrails Are Runtime-Neutral Scripts

Hook logic lives in `scripts/` (e.g. `guard-paths.sh`, rules in `.agents/guardrails/protected-paths.txt`).
The runtime adapter only *wires* it. All four reference runtimes now have a blocking pre-edit hook
(exit code `2` blocks the call in each of them). The `full` tier wires `guard-paths.sh` natively where
the payload is documented:

| Runtime | Wiring shipped by `anr init --tier full` | What the script receives |
| :--- | :--- | :--- |
| Claude Code | `.claude/settings.json` `PreToolUse`, matcher `Edit\|Write\|NotebookEdit` | `tool_input.file_path` |
| Gemini CLI | `.gemini/settings.json` `BeforeTool`, matcher `write_file\|replace` | `tool_input.file_path` |
| Codex | `.codex/hooks.json` `PreToolUse`, matcher `apply_patch\|Edit\|Write` | `tool_input.command` = patch text; every `Add / Update / Delete / Move` target is checked |
| Cursor | `.cursor/hooks.json` `preToolUse`, matcher `Write\|Edit` | `input.path` / `tool_input.path` |

Two limits apply to every runtime:

- **Hooks only see the agent's own file tools.** An edit made through a shell command (`sed -i`, `>`)
  bypasses them, so the CI step (`guard-paths.sh ci <base>`) remains the layer that cannot be bypassed.
- **Clone ≠ Trust** (Rule 04). Project-level hooks run only after the human trusts them: Claude Code's
  workspace trust dialog, Codex's trusted-project check (`/hooks`), Gemini CLI's hook fingerprinting.

### Adding New Adapters
If your team uses a different Agent Runtime (e.g., Windsurf, Trae, GitHub Copilot), you do NOT need to reinvent the AI-Native architecture. You simply provide a new column in this table mapping how that tool implements entry points, skills, hooks, and scopes.

If the tool does not support a feature, mark it as **N/A**. The repository remains AI-Native, the runtime simply lacks the capability to execute all of it natively.

### Sources

Official documentation used for the 2026-09 review:

- Claude Code — [Skills](https://code.claude.com/docs/en/skills), [Hooks](https://code.claude.com/docs/en/hooks), [Permissions](https://code.claude.com/docs/en/permissions), [Memory / AGENTS.md / `.claude/rules`](https://code.claude.com/docs/en/memory)
- Codex — [Skills](https://learn.chatgpt.com/docs/build-skills), [Hooks](https://developers.openai.com/codex/hooks), [AGENTS.md](https://developers.openai.com/codex/guides/agents-md)
- Cursor — [Rules](https://cursor.com/docs/context/rules), [Agent Skills](https://cursor.com/docs/skills), [Subagents](https://cursor.com/docs/subagents), [Hooks](https://cursor.com/docs/hooks)
- Gemini CLI — [Agent Skills](https://geminicli.com/docs/cli/skills/), [Hooks](https://geminicli.com/docs/hooks/), [Hooks reference](https://geminicli.com/docs/hooks/reference/), [Subagents](https://geminicli.com/docs/core/subagents/)
