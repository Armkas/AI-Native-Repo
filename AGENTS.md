# AI-Native Repo — AGENTS.md

> Reference repository of the AI-Native Repository Standard: spec, templates, CLI, examples.
> This file is a router (<= 2048 bytes) and follows the standard it defines.

## Verify before you claim "done"

```bash
./scripts/validate.sh    # structure, template drift, links, every runtime × tier × language scaffold
node scripts/generate-templates.js && node cli/tests/test.js   # fast loop while editing templates
```

## Route by task

1. The rules: [spec/repository-standard.md](spec/repository-standard.md) · why: [spec/philosophy.md](spec/philosophy.md)
2. Runtimes: [spec/adapters.md](spec/adapters.md) · models: [spec/model-compatibility.md](spec/model-compatibility.md) · tiers: [spec/tiers.md](spec/tiers.md)
3. Templates (source of truth): [template-source/](template-source/) — `cli/templates/` is generated, never hand-edited
4. CLI: `cli/src/`, tests in `cli/tests/test.js`
5. Reference implementations: [examples/](examples/)

## Skills (load on demand)

- [`template-change`](.agents/skills/template-change/SKILL.md) — any edit under `template-source/`, `cli/`, `scripts/` or `examples/`
- [`spec-sync`](.agents/skills/spec-sync/SKILL.md) — any conceptual change: spec, philosophy and all 13 READMEs

## Invariants

1. Explicit structure, not excessive abstraction.
2. Docs route to knowledge; they are not a second copy of the code.
3. `docs/` holds canonical intent; behavior is arbitrated by implementation and tests. Runtime files only route.
4. Model Provider ≠ Agent Runtime — never a per-model template ([model-compatibility](spec/model-compatibility.md)).
5. Deterministic checks first; a model's judgement never overrides a failing check.

## Human boundary

Rule changes, CLI behavior changes, releases and publishing → [MANUAL_TASKS.md](MANUAL_TASKS.md).
