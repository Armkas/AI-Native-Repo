---
name: feature-development
description: End-to-end workflow for adding or extending a business feature — plan, check invariants, define the interface, implement, verify, sync docs. Use when the user asks for a new feature, screen, endpoint or capability.
---

# Feature Development (workflow skill)

This skill orchestrates other skills. Do the steps in order; do not skip ahead to implementation.

1. **Locate** — find the feature in `docs/PROJECT_MAP.md` and `.agents/context-index.md`. New feature? Pick its domain in `docs/domains/`.
2. **Check the rules** — read `docs/invariants/` and any ADR in `docs/adr/` that touches this area. If the request conflicts with an invariant, stop and ask.
3. **Assess blast radius** — check `.agents/dependency-map.md` for who depends on what you will change.
4. **Interface first** — create or change the contract in `Interface/` (responsibility, inputs, outputs, errors, side effects) following `docs/architecture/golden_feature_template.md`.
   - Schema change → run the `database-migration` skill.
   - Request/response change → run the `api-contract-change` skill.
5. **Implement** — orchestration in the implementation layer, rendering only in views. Keep files focused (≤ 500 lines).
6. **Verify** — run the `verify` skill.
7. **Sync docs** — run the `doc-sync` skill; a new feature must be registered in `docs/PROJECT_MAP.md`, `docs/domains/` and `.agents/context-index.md`.
8. **Human steps** — console configuration, secrets, store listings → `MANUAL_TASKS.md`.
