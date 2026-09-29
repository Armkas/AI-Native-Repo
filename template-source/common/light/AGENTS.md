# [Project Name] — AGENTS.md

> Runtime-neutral entry point for every AI coding agent. Light tier: route first, automate later.

## Verify before you claim "done"

```bash
<Build Command>   # e.g. npm run build / cargo check / swift build
<Test Command>    # e.g. npm test / pytest (if tests exist)
```

Full procedure: skill [`verify`](.agents/skills/verify/SKILL.md). If a command cannot run, say so explicitly.

## Scope & status

- **Frozen areas**: [e.g. `legacy/` — do not read or modify]
- **Human boundary**: production, credentials and external consoles → [MANUAL_TASKS.md](MANUAL_TASKS.md)

## Route by task

1. Where things are: [docs/PROJECT_MAP.md](docs/PROJECT_MAP.md)
2. How it is built: [docs/architecture/overview.md](docs/architecture/overview.md)
3. Only then: read the implementation you need — no blanket grep of the whole repo.

## Rules

- Keep one responsibility per file; name things after the business concept.
- Never guess business logic — ask when it is ambiguous.
