---
name: verify
description: Closed-loop verification before claiming a task is done. Use after any code change, before reporting completion, and whenever the user asks "does it build / does it work".
---

# Verify

A task is not finished until verification returns exit code `0`. "The code looks right" is not evidence.

## Steps

1. Run the build command declared in `AGENTS.md` (`<Build Command>`).
2. Run the test command if the project has tests (`<Test Command>`).
3. If either fails: fix the cause, then re-run from step 1. Do not weaken or skip checks to make them pass.
4. If a command cannot run here (missing toolchain, device, credentials): say so explicitly and list what the human must run.

## Report

State which commands ran and their result. Never claim success for a step that did not run.
