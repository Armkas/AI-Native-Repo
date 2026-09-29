---
name: database-migration
description: Safe procedure for any database schema change — new append-only migration, backfill plan, schema docs. Use when adding or altering tables, columns, indexes, constraints, policies or database functions.
---

# Database Migration

## Rules

- **Append-only** — create a new, timestamped migration file. Never edit a migration that has already been applied anywhere.
- **Replayable** — a fresh environment must be rebuildable from the migrations alone. No dependency on manual console changes.
- **Production is human-approved** — applying to production is listed under *Approval Required* in `MANUAL_TASKS.md`.

## Steps

1. Read the current table definitions in `docs/contracts/database_schema.md`.
2. Create `<migrations-dir>/<timestamp>_<verb>_<subject>.sql` (or your tool's equivalent).
3. For existing rows: decide defaults / backfill explicitly; prefer additive, backward-compatible changes (old clients must not break).
4. Apply to the local or dev environment and confirm it succeeds.
5. Update generated types / models that mirror the schema.
6. Update `docs/contracts/database_schema.md`.
7. Run the `verify` skill.
