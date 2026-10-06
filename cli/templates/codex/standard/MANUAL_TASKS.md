# 📋 Human / Agent Boundary (MANUAL_TASKS.md)

> [!NOTE]
> The permission contract between humans and AI agents. Agents read this file before any action that is
> more than editing code and running checks. Silence is not approval.
> These rules are **advisory**: anything that must be physically impossible also belongs in a guardrail
> (runtime permissions, hooks, CI, branch protection).

---

## 1. [Autonomous] — the agent may do these without asking

- Read and edit application source, tests and docs inside this repository
- Run the verification commands declared in `AGENTS.md` (typecheck, build, lint, tests)
- Keep `docs/` and `.agents/` in sync with the code it changed
- Create local branches and local commits for the current task

## 2. [Approval Required] — propose, explain the impact, then wait for an explicit "yes"

- Adding, removing or upgrading dependencies
- Database schema changes (apply to a local / dev database only after approval)
- Breaking changes to a public API, RPC contract or data format
- Changing CI, hooks, guardrails, permission settings or this file
- `git push`, opening or merging pull requests
- Deleting files, data or branches the agent did not create in this task

## 3. [Manual Only] — humans do these; the agent prepares exact instructions and stops

- Production secrets, credentials and environment variables
- Production deploys, production database migrations, DNS and certificates
- Third-party consoles: app stores, OAuth providers, payment, push notification keys, webhooks
- Physical device and hardware testing (camera, microphone, location, offline / reconnect)
- Overriding a guardrail or a failing required check

> When an agent reaches a [Manual Only] step, it adds a checkbox under **Pending** below, says *why* the
> step is human-owned, and tells the user. It never works around the boundary.

---

## 4. Pending human tasks

<!-- Example entries — replace them with your own. -->

- [ ] **Example — production migration**: review `<migrations-dir>/<file>` and run `<your-migration-command>` against production. *Human-owned: production write.*
- [ ] **Example — OAuth redirect**: add `https://<prod-domain>/auth/callback` to the provider's allowlist. *Human-owned: third-party console.*
- [ ] **Example — device check**: verify the microphone permission prompt on a real iPhone and Android device. *Human-owned: physical hardware.*
