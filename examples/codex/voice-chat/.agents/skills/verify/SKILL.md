---
name: verify
description: Closed-loop verification before claiming a task is done in this Swift project. Use after any code change, before reporting completion, and whenever the user asks "does it build / does it work".
---

# Verify

A task is not finished until verification returns exit code `0`. "The code looks right" is not evidence.

1. `swift build` — fix the first real error, then re-run.
2. `swift test` — all tests pass. Never delete, skip or loosen a test to make it pass.
3. Changed behavior covered by an invariant? Its `test_INV_…` test must still pass, and the invariant text must still be true.
4. Device-only behavior (microphone permission, airplane mode): say it was not verified here, and add the check to `MANUAL_TASKS.md`.

## Report

```text
swift build   exit 0
swift test    exit 0   5 tests
device check  skipped: needs a real iPhone (added to MANUAL_TASKS.md)
```
