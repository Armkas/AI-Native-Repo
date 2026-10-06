# 🧪 Behavioral Evals (evals/)

> Does this repository's context layer — `AGENTS.md`, `docs/`, `.agents/skills/`, guardrails — actually
> lead an agent to do the right thing? Unit tests check the code. **Evals check the agent working on it.**
> Run them when you change the router, a skill, a rule or the model you use, and compare with the last run.

## Grader hierarchy

Cheapest and most reliable first. A later grader never overrides a failing earlier one.

| Order | Grader | Decides | How |
| :--- | :--- | :--- | :--- |
| 1 | **Deterministic** | Which files changed / did not change; whether the project's checks pass | `bash scripts/eval-check.sh <scenario>` and the verify commands in `AGENTS.md` |
| 2 | **Model judge** | Whether the result meets the scenario's rubric (intent, scope, docs) | A fresh session given the scenario, the diff and [the review rubric](../.agents/skills/review/rubric.md) |
| 3 | **Human** | Calibration of the judge; anything the judge marks `UNKNOWN` | Grade a sample by hand, compare with the judge |

## A scenario

`scenarios/<id>.md` — frontmatter for the deterministic grader, then the task and what good looks like.
See [api-add-optional-field.md](scenarios/api-add-optional-field.md).

```yaml
must_change:        # each glob must match at least one changed file
must_not_change:    # no changed file may match these globs (always include evals/*)
```

## Running one

1. Start from a clean commit in an **isolated worktree** (`git worktree add ../eval-<id> HEAD`), so the run cannot touch your working copy.
2. Give the agent the scenario's *Task* section only — in your runtime's non-interactive mode (for example `claude -p`, `codex exec`, `gemini -p`) or a fresh interactive session.
3. When it finishes, in the worktree: `bash scripts/eval-check.sh evals/scenarios/<id>.md HEAD` (exit `0` = pass), then the verify commands.
4. Only if 3 passes: run the model judge with the scenario's *Expected behavior*, the diff and the rubric.
5. Record the result (below), then remove the worktree.

## Recording results

Append one row per run. Without the versions, a score change cannot be explained.

| Date | Scenario | Agent runtime + model | Repo commit | Deterministic | Judge (model) | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| | | | | | | |

## Rules

- The agent under evaluation must not edit `evals/` — every scenario lists `evals/*` under `must_not_change`.
- Scenarios are small and concrete. Three good scenarios that run every time beat thirty that never run.
- A judge is calibrated before it gates anything: compare it with human grades on 10–20 runs first.
- Product AI features (if your product calls an LLM) need their own evals — datasets, rubrics and baselines
  for *your* model calls. Keep them separate from these repository evals, and keep the model provider
  configurable rather than built into the dataset format.
