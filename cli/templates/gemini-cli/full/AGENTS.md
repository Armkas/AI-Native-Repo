# [Project Name] — AGENTS.md

> Runtime-neutral entry point for every AI coding agent. Keep this file a **router** (< 2 KB): it points to context, it does not hold it.

## Verify before you claim "done"

```bash
<Typecheck Command>   # e.g. npm run typecheck / mypy . / swift build
<Build Command>       # e.g. npm run build / cargo check
<Test Command>        # e.g. npm test / pytest (if tests are active)
bash scripts/check-freshness.sh   # AI context layer must not rot
```

Full procedure: skill [`verify`](.agents/skills/verify/SKILL.md). If a command cannot run, say so explicitly.

## Guardrails

Protected paths: [.agents/guardrails/protected-paths.txt](.agents/guardrails/protected-paths.txt), enforced by `scripts/guard-paths.sh`. A block is a stop sign — ask the human.

## Scope & status

- **Frozen areas**: [e.g. `legacy/` — do not read or modify]
- **Testing policy**: [e.g. typecheck + build only in this phase]
- **Human boundary**: production, credentials and external consoles → [MANUAL_TASKS.md](MANUAL_TASKS.md)

## Route by task (progressive disclosure)

1. Rules: [.agents/rules/global.md](.agents/rules/global.md)
2. Where things are: [docs/PROJECT_MAP.md](docs/PROJECT_MAP.md) → [.agents/context-index.md](.agents/context-index.md)
3. What it means: [docs/domains/](docs/domains/README.md)
4. How parts connect: [docs/contracts/](docs/contracts/backend_rpc.md)
5. Why it is so / what must never break: [docs/adr/](docs/adr/README.md), [docs/invariants/](docs/invariants/business_invariants.md)
6. Blast radius: [.agents/dependency-map.md](.agents/dependency-map.md)
7. Only then: the `Interface`, then the implementation.

## Skills (load on demand)

Canonical skills live in [.agents/skills/](.agents/skills/). Use the matching one instead of improvising:
`feature-development` · `bug-fix` · `database-migration` · `api-contract-change` · `verify` · `doc-sync`
