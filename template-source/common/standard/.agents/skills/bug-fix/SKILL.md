---
name: bug-fix
description: Workflow for fixing a defect — reproduce, find the root cause, fix minimally, verify, record. Use when the user reports a bug, crash, wrong behavior or failing check.
---

# Bug Fix (workflow skill)

1. **Reproduce** — get a concrete failing case (steps, input, log, failing command). If you cannot reproduce it, say so before changing code.
2. **Locate via contracts** — route through `.agents/context-index.md` to the owning `Interface`; check whether the contract or the implementation is wrong.
3. **Check intent** — read the relevant `docs/invariants/` and `docs/adr/`. Behavior that looks like a bug may be deliberate.
4. **Root cause, not symptom** — fix where the defect originates. Keep the diff minimal; no drive-by refactors.
5. **Look for siblings** — the same mistake often exists in parallel code paths (other platforms, other handlers). Fix or report them.
6. **Verify** — run the `verify` skill; re-run the original failing case.
7. **Record** — if the fix changed a contract or revealed an undocumented rule, run `doc-sync` (add the rule to `docs/invariants/` if it must never regress).
