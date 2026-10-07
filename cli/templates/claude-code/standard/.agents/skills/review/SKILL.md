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

Review in a **fresh context**, not the one that wrote the change. If this repository ships a `reviewer`
subagent for your runtime (standard tier and above do), delegate to it; otherwise use a new session or a
different model. Give the reviewer only:

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

The reviewer returns JSON matching [result.schema.json](result.schema.json) — machine-readable, so results
can be collected and compared with human grades (calibration):

```json
{
  "criteria": [
    { "criterion": "expired token returns 401", "verdict": "PASS", "evidence": "tests/auth/test_token.py::test_expired_token_401" },
    { "criterion": "refresh does not extend an expired session", "verdict": "UNKNOWN", "evidence": "" }
  ],
  "rubric": {
    "correctness": { "verdict": "PASS", "evidence": "both criteria traced to code" },
    "invariants":  { "verdict": "PASS", "evidence": "INV-003 untouched" },
    "scope":       { "verdict": "FAIL", "evidence": "reformatted src/legacy/x.ts" },
    "tests":       { "verdict": "PASS", "evidence": "new test fails without the change" },
    "docs":        { "verdict": "PASS", "evidence": "backend_rpc.md updated" },
    "safety":      { "verdict": "PASS", "evidence": "" }
  },
  "notes": ""
}
```

The reviewer does not decide the overall result. Tooling computes it — `FAIL` if any verdict is `FAIL`,
`PASS` only if every verdict is `PASS`, otherwise `UNKNOWN` — and adds a `meta` block (reviewed commit,
judge runtime and model, rubric version). The optional CI workflow (`.github/workflows/ai-review.yml`, full
tier) does exactly that and stays record-only until the reviewer is calibrated.
