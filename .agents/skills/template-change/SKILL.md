---
name: template-change
description: How to change templates, the anr CLI or the examples in this reference repository without drift — layering rules, language variants, skills, guardrails, router budget, tests. Use for any edit under template-source/, cli/, scripts/ or examples/.
---

# Template Change

## Where things live

- **Source of truth**: `template-source/`. `cli/templates/` is generated — never hand-edit it; run `node scripts/generate-templates.js`.
- **Layering** (`spec/runtime-catalog.json`): common `light` = [light], `standard` = [standard], `full` = [standard, full]; runtime files = `runtimes/<rt>/base` + tier overlays. Later layers overwrite earlier ones.
- **Language variants**: `*.zh-CN.md` / `*.ja.md` replace the base file at `anr init --lang`. They must link to **base** filenames (`MANUAL_TASKS.md`, not `MANUAL_TASKS.zh-CN.md`).
- **Skills**: canonical in `common/<tier>/.agents/skills/<name>/SKILL.md`. Codex, Cursor and Gemini CLI read `.agents/skills/` natively; only Claude Code gets a `.claude/skills` symlink at init. Never keep a copy in `template-source/`.
- **Guardrails**: logic lives once in `common/full/scripts/guard-paths.sh`; runtime overlays (`.claude/settings.json`, `.gemini/settings.json`, `.codex/hooks.json`, `.cursor/hooks.json`) only wire it.
- **Reviewer subagents** live in `runtimes/<rt>/standard/` (one per runtime, read-only, routing to the canonical `review` skill); the opt-in CI review is `runtimes/<rt>/full/.github/workflows/ai-review.yml`, sharing `common/full/.github/ai-review/prompt.md` and `common/full/scripts/ai-review-record.sh`. Only the steps that install and run the reviewer differ per runtime (Codex runs through `openai/codex-action`); `cli/tests/test.js` pins each runtime's read-only, trust-aware flags.
- **`anr index`** lives in `cli/src/indexer.js`; the examples commit its output, and `validate.sh` fails when it is stale (`node cli/bin/anr.js index examples/<rt>/voice-chat`).
- **Runtime facts** in `spec/adapters.md` carry a review date — re-verify against the vendor's official docs before changing a cell, and update the date.

## Rules

1. Every template `AGENTS.md`, in every language, stays <= 2048 bytes (`wc -c`). Chinese and Japanese variants run out first.
2. A new template capability gets a check in `cli/tests/test.js` (links, skill frontmatter, guardrails and the eval grader are already covered there).
3. `anr update` must never overwrite or delete a file the user edited: it compares the file with its fingerprint in `anr.yaml` (`template.managed_hashes`). Any change to update / prune semantics needs a test for the user-edited case, and is [Approval Required](../../../MANUAL_TASKS.md).
4. The manifest format is defined in three places that must agree: `cli/src/yaml.js` (validation), `cli/src/commands.js` (writing) and `spec/anr.schema.json`.
5. `examples/<runtime>/voice-chat` are four standalone consumer repos that differ only in the runtime adapter. Change all four the same way; run `swift build && swift test` in one of them.
6. The CLI has zero runtime dependencies. Keep it that way.

## Steps

1. Edit `template-source/` (or `cli/`, `scripts/`, `examples/`).
2. `node scripts/generate-templates.js && node cli/tests/test.js`
3. `./scripts/validate.sh` — must exit `0`.
4. If the change alters what the standard *means*, run the `spec-sync` skill.
