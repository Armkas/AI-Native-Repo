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
> **2026-10**; see [Sources](#sources). When a runtime ships a new mechanism, update the cell and the date.

| Canonical Concept | Claude Code | Codex | Cursor | Gemini CLI |
| :--- | :--- | :--- | :--- | :--- |
| **Project Entry Instructions** | `CLAUDE.md` with an `@AGENTS.md` import (v2.1.277+ also reads `AGENTS.md` directly, but only when the repository has no `CLAUDE.md`) | `AGENTS.md` | `AGENTS.md` and/or `.cursor/rules/*.mdc` | `GEMINI.md` with an `@AGENTS.md` import |
| **Skill (Atomic capability)** | `.claude/skills/` → symlink to `.agents/skills/` | `.agents/skills/` (native) | `.agents/skills/` (native; also `.cursor/skills/`) | `.agents/skills/` (native alias of `.gemini/skills/`, takes precedence) |
| **Pre-edit Hook / Guardrail** | `.claude/settings.json` → `PreToolUse` (`Edit\|Write`) | `.codex/hooks.json` → `PreToolUse` (`apply_patch`; input is the patch text) | `.cursor/hooks.json` → `preToolUse` (`Write\|Delete`; matcher is a regex on the tool type) | `.gemini/settings.json` → `hooks.BeforeTool` (`write_file\|replace`) |
| **Permission Boundary** | `.claude/settings.json` `permissions` | `.codex/config.toml` approval / sandbox policy | Hooks (`beforeShellExecution`, `beforeReadFile`) | `.gemini/settings.json` |
| **Subagent Definition** | `.claude/agents/` | `.codex/agents/*.toml` | `.cursor/agents/` (also reads `.claude/agents/`, `.codex/agents/`) | `.gemini/agents/` |
| **Tool / MCP Server** | `.mcp.json` | `.codex/config.toml` `[mcp_servers]` | `.cursor/mcp.json` | `.gemini/settings.json` `mcpServers` |
| **Path-Scoped Context** | Nested `CLAUDE.md`, `.claude/rules/*.md` with `paths:` | Nested `AGENTS.md`, only from the repository root down to the directory Codex starts in | `.cursor/rules/*.mdc` (`globs`), nested `AGENTS.md` | Nested `GEMINI.md` |
| **Sandbox** | [Sandboxing](https://code.claude.com/docs/en/sandboxing) (OS-level; also covers subprocesses) | Permission profiles (`default_permissions = ":read-only"` / `":workspace"` in `.codex/config.toml`); the legacy `sandbox_mode` / `--sandbox` still work | Sandbox for agent terminal commands (`sandbox.json`) | `--sandbox` |
| **Private runtime memory** (Rule 20: a cache, not the source of truth) | Auto memory, per repository, under `~/.claude/projects/` | User-level memories, outside the repository | Memories (auto-generated, workspace-scoped) | `save_memory` → `~/.gemini/GEMINI.md`; auto memory |
| **Headless run** (CI review, evals) | `claude --bare -p` · `ANTHROPIC_API_KEY` · `--json-schema` | `codex exec` (read-only by default) · `CODEX_API_KEY` · `--output-schema`; in GitHub Actions `openai/codex-action` | `agent -p --trust --mode ask` (`cursor-agent` is the legacy name; an untrusted folder exits 1 without `--trust`; writes nothing without `--force`) · `CURSOR_API_KEY` | `gemini -p --approval-mode plan` · `GEMINI_API_KEY` |
| **Ignore Config** | `permissions.deny` `Read(...)` rules (also cover `cat` / `head` in Bash) | N/A — keep secrets out of the working tree | `.cursorignore` | `.geminiignore` |

There is **no cross-runtime ignore file**. A file such as `.agentsignore` is read by none of the runtimes
above; do not rely on one to keep secrets away from an agent.

**Nested `AGENTS.md` files are not loaded the same way everywhere.** Cursor applies one when the agent works on
files in its directory. Codex reads them only from the repository root down to the directory it was started in,
never deeper. Claude Code reads a subdirectory's `AGENTS.md` only when the repository has no `CLAUDE.md`; with the
adapter's root `CLAUDE.md` it loads nested `CLAUDE.md` files instead. Gemini CLI loads files named like its context
file (`GEMINI.md`). So the root router also links every nested `AGENTS.md` ("Working in `ios/`? Also read
`ios/AGENTS.md`"), as the examples do.

### One Source of Truth for Skills

Skills are semantic assets, so they live **once**, runtime-neutrally, in `.agents/skills/<name>/SKILL.md`
(the open Agent Skills format: YAML frontmatter with `name` matching the directory and a `description`
that tells the runtime *when* to load it). Codex, Cursor and Gemini CLI discover `.agents/skills/` natively.
Claude Code reads only `.claude/skills/`, so `anr init` links that directory to `.agents/skills/` —
never a hand-maintained copy. Copies drift; links cannot.

Claude Code documents a symlink per skill folder (`.claude/skills/<name>` → `../../.agents/skills/<name>`);
linking the whole `.claude/skills` directory, as `anr init` does, is also picked up (verified 2026-09; per-skill symlinks re-confirmed in the docs 2026-10) and
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
| Cursor | `.cursor/hooks.json` `preToolUse`, matcher `Write\|Edit\|Delete` | `tool_input` path field (`path` / `file_path`); a `Delete` of an existing protected file is blocked too |

Two limits apply to every runtime:

- **Hooks only see the agent's own file tools.** An edit made through a shell command (`sed -i`, `>`)
  bypasses them, so the CI step (`guard-paths.sh ci <base>`) remains the layer that cannot be bypassed.
- **Clone ≠ Trust** (Rule 06). In an interactive session, project-level hooks run only after the human trusts
  them: Claude Code's workspace trust dialog, Codex's trusted-project check (`/hooks`), Cursor's workspace trust,
  Gemini CLI's hook fingerprinting. Headless runs do not ask: `claude -p` runs the project's hooks and `.mcp.json`
  servers in a folder nobody trusted (`--bare` and `--setting-sources user` keep them out), Cursor's `-p` refuses
  an untrusted folder unless `--trust` is passed, Gemini CLI's folder trust is off by default, and Codex ignores an
  untrusted project's `.codex/` layer. Run an agent headlessly only on code you would run yourself.

### Independent Review and Evals

The `review` skill (bounded LLM-as-a-judge, [Rule 13](repository-standard.md#rule-13-normative--verification-hierarchy--bounded-judges)) asks for a context independent of the one that wrote the change.
From the standard tier on, `anr init` ships a read-only `reviewer` subagent that only wires the runtime to the canonical
skill: `.claude/agents/reviewer.md` (`tools: Read, Grep, Glob`), `.codex/agents/reviewer.toml` (`sandbox_mode = "read-only"`),
`.cursor/agents/reviewer.md` (`readonly: true`), `.gemini/agents/reviewer.md` (read-only tools only).

The full tier adds `.github/workflows/ai-review.yml`: opt-in per pull request (`ai-review` label), it runs the reviewer
headlessly with the command in the table above, and `scripts/ai-review-record.sh` validates the JSON against
`result.schema.json`, computes the overall verdict and records judge runtime, model and rubric version. It is
record-only — neither the verdict nor a failed run fails the pull request — until the reviewer has been calibrated
against human grades. The rubric, skill, schema, prompt and recorder are taken from the base branch, so a pull
request cannot loosen the grader it is judged by (Rule 16). Each run is read-only and loads as little of the pull
request's own configuration as the runtime allows:

- **Claude Code**: `--bare`, plus `--setting-sources user` because `--bare` still applies the `env` block of the
  project's `.claude/settings.json`; `--tools Read,Grep,Glob` leaves no shell; `--permission-mode dontAsk`, because the
  default mode of a `-p` run can be `auto`.
- **Codex**: [`openai/codex-action`](https://github.com/openai/codex-action), as OpenAI recommends for GitHub Actions. It keeps the API key in a
  proxy Codex cannot read, and enables the unprivileged user namespaces that the Linux sandbox (bubblewrap) needs and
  Ubuntu 24.04+ runners restrict through AppArmor; a plain `codex exec` there fails every sandboxed command.
- **Cursor**: `--trust`, because a fresh checkout is never a trusted workspace, with `--mode ask` and no `--force`.
- **Gemini CLI**: `--approval-mode plan`.

GitHub runs a pull request's own copy of the workflow, so read changes to `.github/` (and to `.cursor/` or `.gemini/`,
whose configuration those runs load) before adding the label. Behavioral
evals ([Rule 16](repository-standard.md#rule-16-heuristic-normative-in-full--behavioral-evals)) run the agent on a scenario in a separate git worktree, through the runtime's
non-interactive mode or a fresh session; grading (`scripts/eval-check.sh`) is runtime-neutral.

### Adding New Adapters
If your team uses a different Agent Runtime (e.g., Windsurf, Trae, GitHub Copilot), you do NOT need to reinvent the AI-Native architecture. You simply provide a new column in this table mapping how that tool implements entry points, skills, hooks, and scopes.

If the tool does not support a feature, mark it as **N/A**. The repository remains AI-Native, the runtime simply lacks the capability to execute all of it natively.

### Sources

Official documentation used for the 2026-10 review:

- Claude Code — [Skills](https://code.claude.com/docs/en/skills), [Hooks](https://code.claude.com/docs/en/hooks), [Permissions](https://code.claude.com/docs/en/permissions), [Memory / AGENTS.md / `.claude/rules`](https://code.claude.com/docs/en/memory)
- Codex — [Skills](https://learn.chatgpt.com/docs/build-skills), [Hooks](https://learn.chatgpt.com/docs/hooks), [Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents), [AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md), [Permissions](https://learn.chatgpt.com/docs/permissions), [GitHub Action](https://github.com/openai/codex-action)
- Cursor — [Rules](https://cursor.com/docs/context/rules), [Agent Skills](https://cursor.com/docs/skills), [Subagents](https://cursor.com/docs/subagents), [Hooks](https://cursor.com/docs/hooks), [CLI parameters](https://cursor.com/docs/cli/reference/parameters)
- Agent Skills format — [Specification](https://agentskills.io/specification)
- Headless runs — [Claude Code](https://code.claude.com/docs/en/headless), [Codex](https://learn.chatgpt.com/docs/non-interactive-mode), [Cursor CLI](https://cursor.com/docs/cli/headless), [Gemini CLI](https://geminicli.com/docs/cli/headless/) · Subagents — [Claude Code](https://code.claude.com/docs/en/sub-agents)
- Gemini CLI — [Agent Skills](https://geminicli.com/docs/cli/skills/), [Hooks](https://geminicli.com/docs/hooks/), [Hooks reference](https://geminicli.com/docs/hooks/reference/), [Subagents](https://geminicli.com/docs/core/subagents/), [Trusted folders](https://geminicli.com/docs/cli/trusted-folders/)
