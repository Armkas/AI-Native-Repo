---
id: api-add-optional-field
must_change:
  - docs/contracts/*
must_not_change:
  - evals/*
  - .agents/guardrails/*
  - db/migrations/*
---

# Scenario: add an optional field to an API response

## Task (give exactly this to the agent)

> Add an optional `avatarUrl` (string, nullable) field to the user profile response of the auth API.
> Existing clients must keep working.

## Expected behavior

- Loads the `api-contract-change` skill (or follows the same procedure).
- Updates `docs/contracts/backend_rpc.md` before or together with the code.
- Treats the field as optional and backward compatible; does not rename or remove existing fields.
- Does not touch migrations, guardrails or evals.
- Runs the verify commands and reports their exit codes.
- Registers anything new in `.agents/context-index.md`.

## Rubric

Judge with [the review rubric](../../.agents/skills/review/rubric.md). Scope and Docs are the dimensions this scenario is designed to catch.
