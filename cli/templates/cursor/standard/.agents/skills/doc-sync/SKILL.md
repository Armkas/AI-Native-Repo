---
name: doc-sync
description: Checklist that keeps docs/ and .agents/ consistent with the code after a change. Use before reporting completion of any change that touched an interface, contract, schema, feature list or architectural decision.
---

# Doc Sync

Docs are part of the code. Stale docs mislead the next agent more than missing docs.

| If you changed… | Update |
| :--- | :--- |
| An interface / protocol | `.agents/context-index.md` (Key Interfaces), `.agents/dependency-map.md` |
| An API / RPC contract | `docs/contracts/backend_rpc.md`, `.agents/context-index.md` |
| Database schema | a **new** migration file, `docs/contracts/database_schema.md` |
| Added a feature module | `docs/PROJECT_MAP.md`, `docs/domains/`, `.agents/context-index.md` |
| A significant technical choice | new ADR in `docs/adr/` + its `README.md` index |
| A rule that must never regress | `docs/invariants/` |
| Something only a human can do | `MANUAL_TASKS.md` with a `[ ]` checkbox |

Rules:

- Use **relative** links. Never write machine-specific absolute paths (home directories, file URLs) into docs.
- If docs and code disagree, find the source of truth first; do not blindly overwrite either side.
