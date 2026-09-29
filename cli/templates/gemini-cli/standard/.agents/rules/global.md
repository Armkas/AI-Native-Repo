# Global Rules (.agents/rules/global.md)

> Advisory rules for every agent and every platform. Platform-specific rules go in sibling files (`web.md`, `ios.md`, `backend.md`, ...).
> Rules here are **advisory**. Anything that must be physically impossible belongs in a guardrail (permissions, hooks, CI), not only here.

## Architecture

1. **Interface over implementation** — define or read the `Interface/` contract (responsibility, inputs, outputs, errors, side effects) before touching implementation.
2. **Feature-first** — organize code by business feature, not by file type. Follow [golden_feature_template.md](../../docs/architecture/golden_feature_template.md).
3. **Single source of truth** — business thresholds, enums and config live in one place. No magic literals in UI code.
4. **One file, one responsibility** — aim for ≤ 500 lines per hand-written file; > 1000 lines is a refactor signal.

## Behavior

5. **Never guess business logic** — check [invariants](../../docs/invariants/business_invariants.md) and [ADRs](../../docs/adr/README.md); if still unclear, ask.
6. **Preserve the context budget** — follow the routing in `AGENTS.md`; do not bulk-read unrelated modules.
7. **Docs are code** — if docs and code disagree, find the source of truth and fix the other side (skill `doc-sync`).
8. **Human boundary** — anything in [MANUAL_TASKS.md](../../MANUAL_TASKS.md) under *Approval Required* or *Manual Only* is not yours to do silently.
