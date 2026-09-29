---
name: verify
description: Closed-loop verification before claiming a task is done. Use after any code change, before reporting completion, and whenever the user asks "does it build / does it work".
---

# Verify

A task is not finished until verification returns exit code `0`. "The code looks right" is not evidence.

## Steps

1. **Local first** — run the narrowest check for what you touched (one package, one target, one test file).
2. **Then global** — run the commands declared in `AGENTS.md`, in order:
   typecheck (`<Typecheck Command>`) → build (`<Build Command>`) → tests (`<Test Command>`, if active).
3. **On failure** — fix the cause and re-run from step 1. Never delete, skip or loosen a check to make it pass.
4. **Cannot run?** — missing toolchain, simulator, device or credentials: say so explicitly and add what the human must run to `MANUAL_TASKS.md`.
5. **Docs** — if the change touched an interface, contract or schema, run the `doc-sync` skill before reporting.

## Report

List each command, its exit status, and anything skipped with the reason.
