# 🛑 Business Invariants & Guardrails (business_invariants.md)

> [!CAUTION]
> **Core Agent Directive**:
> This document defines the **non-negotiable business rules (Invariants)** of the system.
> Implementation details may evolve, but **unless the user explicitly requests a business requirement change, no agent may violate these rules**.

Every invariant has a stable ID. IDs are never reused or renumbered. A test that protects an invariant
names its ID (e.g. `test_INV_002_rejects_overdraft`, or a comment `// INV-002`), so `grep -r INV-002`
shows how the rule is enforced — and an ID with no hit shows a rule that is only written down.

---

## 1. Core Business Logic Invariants

- **INV-001 — Unidirectional state transitions**: once an order or session reaches a terminal state ("Completed", "Cancelled"), it never transitions back to "In-Progress".
- **INV-002 — Server-side balance integrity**: deductions and balance mutations run inside atomic server-side transactions; clients never report deduction results. `balance >= amount` is checked before execution; insufficient balance is a hard rejection.
- **INV-003 — Re-authentication for sensitive operations**: account deletion, email/phone unbinding and high-value transactions require password re-verification or two-factor authentication.

---

## 2. Platform Compliance & Security Guardrails (If Applicable)

- **INV-101 — Store policies**: digital goods and in-app purchases comply with the target store's payment rules; user-generated content has reporting, blocking and moderation.
- **INV-102 — Data deletion**: users can delete their account and data from inside the product.
- **INV-103 — Consent before sensors**: background location and device sensors are never used without explicit runtime consent.
