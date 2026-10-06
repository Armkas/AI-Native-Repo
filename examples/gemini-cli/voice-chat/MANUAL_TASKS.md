# 📋 Human / Agent Boundary (MANUAL_TASKS.md)

> What an agent may do alone, what needs a "yes", and what only a human does. Silence is not approval.

## 1. [Autonomous]

- Edit Swift sources, tests and `docs/` in this repository
- Run `swift build` and `swift test`
- Local branches and local commits

## 2. [Approval Required]

- Adding or upgrading a Swift package dependency or a speech provider SDK
- Changing an invariant in `docs/invariants/` or a public protocol in `Interface/`
- `git push`, opening or merging pull requests

## 3. [Manual Only]

- Speech provider API keys and other secrets
- Signing, provisioning profiles, App Store Connect
- Real-device checks: microphone permission prompt, offline → on-device fallback, 20 s silence end

## 4. Pending human tasks

- [ ] **Device check — fallback**: on a real iPhone in airplane mode, dictate a sentence; the transcript must still appear (INV-VOICE-002). *Human-owned: physical device.*
