# 🛑 Business Invariants & Guardrails (business_invariants.md)

> [!CAUTION]
> **Core Agent Directive**:
> This document defines the **non-negotiable business rules (Invariants)** of the system.
> Implementation details may evolve, but **unless the user explicitly requests a business requirement change, no agent may violate these rules**.

---

## 1. Core Business Logic Invariants

1. **Unidirectional State Transitions**:
   - Once an order or session reaches a terminal state ("Completed", "Cancelled"), it must never transition back to "In-Progress".
2. **Quota & Balance Integrity**:
   - Deductions and balance mutations must be processed inside atomic server-side transactions; clients must never report deduction results directly.
   - Pre-condition check `balance >= amount` is mandatory prior to execution; insufficient balance must result in a hard rejection.
3. **Sensitive Operations Re-Authentication**:
   - Account deletion, email/phone unbinding, and high-value transactions must require password re-verification or two-factor authentication.

---

## 2. Platform Compliance & Security Guardrails (If Applicable)

1. **Store & Platform Policies**:
   - Digital goods and in-app purchases must comply with designated app store and distribution guidelines.
   - User-Generated Content (UGC) features must include reporting, blocking, and moderation mechanisms.
2. **Data Privacy & Compliance**:
   - Provide an accessible "Delete Account" flow and terms of service.
   - Never collect background location or device sensors without explicit runtime user consent.
