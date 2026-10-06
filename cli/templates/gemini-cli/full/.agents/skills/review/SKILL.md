---
name: review
description: Independent, rubric-based review (bounded LLM-as-a-judge) of a finished change against its acceptance criteria, the invariants and the repository rules. Use after the verify skill passes on any non-trivial change, before reporting completion or opening a pull request.
---

# Review (bounded LLM-as-a-judge)

Commands decide what commands can decide. This skill judges only what they cannot: does the change do
what was asked, stay in scope, respect the invariants, and leave the docs true?

## Preconditions

- `verify` has passed. A reviewer never overrides a failing check — if one fails, stop and fix it.
- The acceptance criteria are written down (task description or `docs/plans/`). No criteria → write them first.

## Independence

Review in a **fresh context**, not the one that wrote the change: a subagent, a new session, or a
different model if your runtime offers one. Give the reviewer only:

1. the acceptance criteria,
2. the diff (`git diff <base>` plus new files),
3. the invariants, contracts and ADRs the change touches,
4. [rubric.md](rubric.md).

The author's explanation is not evidence; the reviewer checks the diff, the tests and the command output.

## Steps

1. **Criteria** — for each acceptance criterion: `PASS`, `FAIL` or `UNKNOWN`, with evidence
   (file:line, test name, command output). No evidence → `UNKNOWN`, never `PASS`.
2. **Rubric** — judge each dimension in [rubric.md](rubric.md) on its own. Do not average them into one score.
3. **Act** — any `FAIL` → fix, run `verify` again, review again. `UNKNOWN` → add a test that settles it, or ask the human.
4. **Record** — put the result in the pull request description or the plan's decision log, and name the model that reviewed.

## Output

```text
criterion                                   verdict   evidence
expired token returns 401                   PASS      tests/auth/test_token.py::test_expired_token_401
refresh does not extend an expired session  UNKNOWN   no test covers it
rubric: correctness PASS · invariants PASS · scope FAIL (reformatted src/legacy/x.ts) · tests PASS · docs PASS · safety PASS
```
