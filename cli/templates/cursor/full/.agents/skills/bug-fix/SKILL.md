---
name: bug-fix
description: Workflow for fixing a defect — reproduce as a failing test, find the root cause, fix minimally, verify, record. Use when the user reports a bug, crash, wrong behavior or failing check.
---

# Bug Fix (workflow skill)

1. **Reproduce** — get a concrete failing case (steps, input, log, failing command). If you cannot reproduce it, say so before changing code.
2. **Capture it as a test** — write an automated test that fails *because of* the bug. It becomes the regression test. If the stack makes that impossible (device-only, third-party UI), record the exact manual reproduction steps instead and say so.
3. **Locate via contracts** — route through `.agents/context-index.md` to the owning `Interface`; check whether the contract or the implementation is wrong.
4. **Check intent** — read the relevant `docs/invariants/` and `docs/adr/`. Behavior that looks like a bug may be deliberate.
5. **Root cause, not symptom** — fix where the defect originates. Keep the diff minimal; no drive-by refactors. Never weaken the new test to make it pass.
6. **Look for siblings** — the same mistake often exists in parallel code paths (other platforms, other handlers). Fix or report them.
7. **Verify** — run the `verify` skill; the test from step 2 must now pass.
8. **Record** — if the fix changed a contract or revealed an undocumented rule, run `doc-sync` (a rule that must never regress gets an invariant ID in `docs/invariants/`, and the test names that ID).
