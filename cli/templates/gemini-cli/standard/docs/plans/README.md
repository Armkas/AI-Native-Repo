# 🧭 Plans (docs/plans/)

> Versioned execution plans. A plan carries the **intent of one task** — goal, acceptance criteria,
> steps, decisions — so the next session (or the next agent) continues instead of starting over.
> Long-lived system knowledge belongs in `domains/`, `contracts/`, `invariants/` and `adr/`, not here.

## When to write one

- The task spans several steps, sessions or agents.
- The task changes a contract, a schema or an invariant.
- The human asked for a plan before implementation.

A one-file fix needs acceptance criteria (in the task), not a plan file.

## Lifecycle

1. Copy [plan-template.md](plan-template.md) to `docs/plans/<yyyy-mm-dd>-<short-slug>.md`, `Status: active`.
2. Get the acceptance criteria confirmed by the human before implementing.
3. Update the step checklist and the decision log as you go — they are the hand-off to the next session.
4. When verification and review pass: `Status: done`, add the final evidence.
5. A decision with lasting architectural impact also gets an ADR in `docs/adr/`.

## Active plans

| Plan | Owner | Status |
| :--- | :--- | :--- |
| _none yet_ | | |
