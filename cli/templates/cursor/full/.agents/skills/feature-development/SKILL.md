---
name: feature-development
description: End-to-end workflow for adding or extending a business feature — define done, check invariants, define the interface, implement, verify, review, sync docs. Use when the user asks for a new feature, screen, endpoint or capability.
---

# Feature Development (workflow skill)

This skill orchestrates other skills. Do the steps in order; do not skip ahead to implementation.

1. **Define done** — write the acceptance criteria: observable, checkable statements ("an expired token returns 401", not "auth works"). Include what is out of scope. Not given? Propose them and confirm with the human. Multi-step or multi-session work → create a plan from `docs/plans/plan-template.md`.
2. **Locate** — find the feature in `docs/PROJECT_MAP.md` and `.agents/context-index.md`. New feature? Pick its domain in `docs/domains/`.
3. **Check the rules** — read `docs/invariants/` and any ADR in `docs/adr/` that touches this area. If the request conflicts with an invariant, stop and ask.
4. **Assess blast radius** — check `.agents/dependency-map.md` for who depends on what you will change.
5. **Interface first** — create or change the contract in `Interface/` (responsibility, inputs, outputs, errors, side effects) following `docs/architecture/golden_feature_template.md`.
   - Schema change → run the `database-migration` skill.
   - Request/response change → run the `api-contract-change` skill.
6. **Implement with tests** — orchestration in the implementation layer, rendering only in views. Each acceptance criterion gets a test that would fail without the change. Keep files focused (≤ 500 lines).
7. **Verify** — run the `verify` skill. Exit code `0` is required before going further.
8. **Review** — run the `review` skill: every acceptance criterion PASS with evidence.
9. **Sync docs** — run the `doc-sync` skill; a new feature must be registered in `docs/PROJECT_MAP.md`, `docs/domains/` and `.agents/context-index.md`. Close the plan, if there is one.
10. **Human steps** — console configuration, secrets, store listings → `MANUAL_TASKS.md`.
