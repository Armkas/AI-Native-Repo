# 🤖 AI-Native Repo - Central AI Agent Guide (AGENTS.md)

> **Semantic Truth & Runtime Entry**: This repository is the open-source specification, template, and showcase for the **AI-Native Repository Standard**.
> When working within this repository, all AI agents must adhere to the standards defined in `spec/`.

---

## 🧪 Verification & Quality Assurance Commands

Whenever modifications are made to this repository (spec, templates, or examples), execute the following checks to verify integrity:

```bash
# 1. Structure, template drift, and end-to-end scaffold tests (all runtime × tier × language combos)
./scripts/validate.sh

# 2. Scaffold tests alone (fast loop while editing template-source/)
node scripts/generate-templates.js && node cli/tests/test.js
```

---

## ⚠️ Scope & Status Declaration

- **Primary Mission**: Maintain the [AI-Native Repository Standard](spec/repository-standard.md) and the out-of-the-box [Native Templates](template-source/).
- **Multi-lingual Alignment**: Any conceptual changes to core rules must be reflected in `spec/repository-standard.md`, `spec/repository-standard.zh-CN.md`, `spec/philosophy.md`, `spec/philosophy.zh-CN.md`, `spec/philosophy.ja.md`, and **all** localized `README*.md` files (currently 13 languages — see the language switcher at the top of any `README*.md`). `spec/adapters.md`, `spec/tiers.md`, and `spec/model-compatibility.md` are English-only reference material and are not part of this sync requirement.
- **Semantic-Agnostic, Runtime-Aware, Model-Tunable**: This project specifies an **AI Context Architecture** sitting on top of conventional software architectures (MVVM, Clean, DDD, TCA). It does not invent AI-specific application runtimes, and it keeps Model Provider (OpenAI, Anthropic, Google, DeepSeek, Qwen, ...) strictly separate from Agent Runtime — see [spec/model-compatibility.md](spec/model-compatibility.md).

---

## 🎯 Context Routing Navigation

Before modifying any content, identify the required context area:

1. **Repository Standard (The Rules)**: [spec/repository-standard.md](spec/repository-standard.md)
2. **Philosophy (The Rationale)**: [spec/philosophy.md](spec/philosophy.md) ([简体中文](spec/philosophy.zh-CN.md) · [日本語](spec/philosophy.ja.md))
3. **Runtime Adapters (The Mapping)**: [spec/adapters.md](spec/adapters.md)
4. **Model Compatibility (Model Provider × Runtime)**: [spec/model-compatibility.md](spec/model-compatibility.md)
5. **Tiers (Complexity Profiles)**: [spec/tiers.md](spec/tiers.md)
6. **Native Templates (The Skeletons, Source of Truth)**: [template-source/](template-source/)
   - `common/` (`light/`, `standard/`, `full/`)
   - `runtimes/` (`claude-code/`, `codex/`, `cursor/`, `gemini-cli/`)
   - Layering: `full` = `common/standard` + `common/full`; runtime files = `runtimes/<rt>/base` + tier overlays. Language variants (`*.zh-CN.md`) replace the base file at `anr init --lang`; they must link to base filenames.
   - Canonical skills live in `common/<tier>/.agents/skills/`. Codex, Cursor and Gemini CLI read `.agents/skills/` natively; only Claude Code gets a `.claude/skills` symlink at init. Never keep a copy in `template-source/`.
   - Guardrail logic lives once in `common/full/scripts/guard-paths.sh`; runtime overlays only wire it (`.claude/settings.json`, `.gemini/settings.json`, `.codex/hooks.json`). Runtime facts in `spec/adapters.md` carry a review date — re-verify against official docs before changing them.
   - Generated output for the CLI lives in `cli/templates/` — never hand-edit it, run `scripts/generate-templates.js` instead.
7. **Reference Implementations**: [examples/](examples/) (`claude-code/`, `codex/`, `cursor/`, `gemini-cli/`)

---

## 🏛 Core Inviolable Invariants

1. **Explicit Structure, Not Excessive Abstraction**: Prefer clear responsibilities, boundary-driven interfaces, and concrete documentation over layers of unnecessary facades or proxies.
2. **Docs as Routing Layer, Not Second Copy**: Documentation guides the agent to the right place quickly; it is not a redundant duplicate of the source code.
3. **Canonical Semantic Intent vs Runtime Entry**: `docs/` is the canonical semantic intent of a project; actual runtime behavior is arbitrated by implementation and tests. `AGENTS.md` (or `.cursor/rules/`, `CLAUDE.md`) is a Runtime Entry Point.


---

## 📋 Doc-Sync Checklist

- [ ] When adding/modifying rules in `spec/repository-standard.md`, update `spec/repository-standard.zh-CN.md`, `spec/philosophy*.md`, and **every** `README*.md` (not just English/Chinese/Japanese) accordingly.
- [ ] When adding a new Model Provider or Runtime, update `spec/model-compatibility.md` only — never add a per-model template or a per-model `README` section.
- [ ] Template links, skills frontmatter and guardrails are covered by `cli/tests/test.js`; extend the test when adding a new template capability.
