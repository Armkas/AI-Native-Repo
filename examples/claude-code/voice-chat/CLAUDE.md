@AGENTS.md

# Claude Code Adapter

- Global rules are imported above from `AGENTS.md`; start from `docs/PROJECT_MAP.md`.
- Skills: `.claude/skills` is a link to the canonical `.agents/skills/` — edit skills there, never in a copy.
- Guardrails live in `.claude/settings.json`: secrets are unreadable, force-push is denied, commits and pushes ask the human first.
