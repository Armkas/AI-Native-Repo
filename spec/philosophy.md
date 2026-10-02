# AI-Native Repository Standard — Philosophy

[🇨🇳 简体中文](philosophy.zh-CN.md) | [🇯🇵 日本語](philosophy.ja.md)

> **Don't give AI more code. Give AI better structure.**

This document explains the *reasoning* behind the [AI-Native Repo Standard](repository-standard.md).
The Standard tells you **what rules to follow**. This document tells you **why they exist**.

---

## One-sentence definition

> An **AI-Native Repository** is a repository architecture designed for AI coding agents.
> Through a structured knowledge layer, progressive context, explicit domain boundaries,
> interfaces / contracts, invariants, ADRs, dependency indexes, and verifiable tests,
> it lets an AI correctly understand, navigate, modify, and maintain a large codebase
> **using the least possible context**.

The goal is not:

> Let the AI read the entire project.

The goal is:

> **Let the AI understand the entire project without reading all of it.**

## Two planes: AI Context Architecture + Software Architecture

AI-Native Repo is **not** a new MVC, and not “AI-MVVM”. Traditional architecture is not obsolete.

It adds an **Agent Context Layer** on top of existing software architecture.

```text
Knowledge Layer + Code Layer

        ↓

AI Context Architecture
        +
Software Architecture
        ↓
Implementation
```

```text
AI-Native Repository
│
├── AI Context Architecture
│       = how an agent understands, navigates, and verifies code
│
└── Software Architecture
        = how the program runs
```

Software architecture stays conventional:

```text
iOS:
MVVM / TCA / Clean / Feature Architecture

Backend:
DDD / Clean / Hexagonal / Dependency Inversion
```

The full model:

```text
                    AI-Native Repo
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
   AI Context Architecture       Software Architecture
             │                           │
      ┌──────┼──────┐              ┌─────┼─────┐
      │      │      │              │     │     │
     Rules  Maps  Domain          MVVM  DDD   Clean
      │      │      │              │     │     │
 Contracts Invariants ADR       Feature DI  Hexagonal
      │      │      │              │     │     │
      └──────┼──────┘              └─────┼─────┘
             │                           │
             └──────────────┬────────────┘
                            ▼
                           Code
```

**Runtime Architecture** — how the program runs:

```text
View
 ↓
ViewModel
 ↓
UseCase
 ↓
Repository
 ↓
API
```

**Cognitive Architecture** — how an agent understands the program:

```text
Task
 ↓
Map
 ↓
Domain
 ↓
Contract
 ↓
Invariant
 ↓
Test
 ↓
Implementation
```

```text
Runtime Flow     →  how does the program run?
Cognitive Flow   →  how does the AI understand the program?
```

The stack an agent walks is:

```text
Agent Layer            how the AI is supposed to work
Knowledge Layer        what the project is, why, and which rules apply
Software Architecture  MVVM / DDD / Clean / Hexagonal / TCA / …
Implementation         Swift / Python / SQL / infrastructure
```

This standard does **not** prescribe a single runtime architecture. iOS may keep MVVM or TCA; a backend may keep DDD, Clean, Hexagonal, or Vertical Slice. Whatever you choose must still satisfy the AI Context Architecture.

AI-Native ≠ Abstraction-Heavy. Not this:

```text
UserService
IUserService
UserServiceProtocol
BaseUserService
UserServiceFactory
UserServiceAdapter
UserServiceFacade
```

This:

```text
one clear responsibility
        +
one clear Interface
        +
one or few Implementations
        +
clear rules
```

> **Explicit structure, not excessive abstraction.**

The rest of this document (maps, contracts, invariants, ADRs, indexes, tests) is the AI Context Architecture. Feature boundaries and dependency inversion make the runtime plane easier for an agent to use; they do not replace it.

---

# I. Core Ideas

## 1. A project is not only code — it is also knowledge

A traditional project is roughly:

```text
code + a short README + comments
```

An AI-Native project is:

```text
AI Context Architecture  +  Software Architecture  →  Implementation
```

The Knowledge Layer is the AI Context Architecture. The Code Layer holds the runtime architecture and the implementation:

```text
project
├── knowledge layer          AI Context Architecture
│   ├── agent rules
│   ├── project map
│   ├── architecture
│   ├── domain knowledge
│   ├── interfaces & contracts
│   ├── invariants
│   ├── ADRs
│   └── indexes
│
└── code layer               Software Architecture + Implementation
    ├── iOS                  e.g. Feature + MVVM / Clean
    ├── backend              e.g. Feature + DDD / Hexagonal
    ├── web
    ├── worker
    └── other systems
```

## 2. The goal is understanding, not ingestion

Wrong goal: make the context window big enough to fit the whole project.

Right goal:

> **Small Context → Large Understanding**

## 3. Do not rely on an ever-larger context window

A bigger window does not mean better understanding. A project should actively **reduce**
irrelevant, duplicated, hidden, and redundant information, and **increase** information
density, structure, locatability, and verifiability.

## 4. The AI should *navigate* the project, not *scan* it

Ideal:

```text
question → map → locate domain → locate module → read interface
        → read rules → read tests → (only if needed) read implementation
```

Not:

```text
question → grep the whole repo → read many files → guess the architecture
```

---

# II. The Knowledge Layer

## 5. Knowledge Layer and Code Layer must be logically separated

- Knowledge Layer: *what* the project is, *why* it is designed this way, *where* things are, *which* rules apply.
- Code Layer: *how* it is implemented.

Each must be understandable on its own.

## 6. Documentation is not a copy of the code

Code describes **How**. Documentation describes **What / Why / Where**. Documentation should
not narrate every line of a function; it should state what the function is, why it exists,
what constrains it, and where to find it.

## 7. Documentation acts as a router

`AGENTS.md` is a navigator — it tells the AI *where to go next*. `PROJECT_MAP.md`,
`ARCHITECTURE.md`, and domain docs hold the actual knowledge.

---

# III. Layered Context

## 8. Progressive Disclosure is a context-routing policy, not a fixed reading order

The AI should not get everything at once. It should dynamically request the necessary level of context based on the task:

```text
L0  Agent Rules        →  how should the AI work?
L1  Project Map        →  what is the project? where are things?
L2  Architecture/Domain →  what is this business?
L3  Interface/Contract →  what can this module do?
L4  Invariant/ADR/Tests →  what must not break? why is it this way? how must it behave?
L5  Implementation     →  how exactly is it done?
```

Only go deeper when the current level is insufficient.

## 9. Each level answers exactly one kind of question

(See the mapping in Rule 8.) Do not merge them into one super-document.

## 10. Each level has a context budget

> **Don't spend 1000 lines to convey 10 facts.**

Prefer a short map, short rules, precise interfaces, and precise indexes over one giant document.

---

# IV. Agent Rules

## 11. The root must have a single agent working contract

`AGENTS.md` defines: what the project is, where to start reading, the default reading order,
architecture principles, test rules, modification rules, and prohibitions.

## 12. `AGENTS.md` must not become a mega-prompt

It is not thousands of lines of technical detail. It only tells the agent *how to work* and
*where to find detail*.

## 13. Agent rules may be scoped

```text
AGENTS.md
ios/AGENTS.md
backend/AGENTS.md
```

Rules closer to the code are more specific. Working inside `backend/features/voice/`, the AI
stacks: global rules + backend rules + voice-domain rules.

---

# V. The Project Map

## 14. There must be a global Project Map

It establishes first-level awareness: purpose, top-level directories, subsystems, main domains,
main entry points, core data flow, and where the important documents live.

## 15. The Project Map must be short

Its job is to tell the AI where to go next — not to explain every line. Aim for ~100 lines.

## 16. There must be a Context Index

It answers: **where is X?**

```text
VoiceService   → backend/features/voice/application/
SpeechService  → backend/features/voice/interface/
VoiceSession   → ios/features/voice/interface/
```

## 17. The Context Index should be auto-generated where possible

Machines generate: files, symbols, classes, protocols, functions, references, imports,
dependencies, test ↔ implementation links.
Humans maintain: business meaning, architectural intent, design rationale, business rules.

---

# VI. Code Architecture

The runtime pattern (MVVM, DDD, Clean, …) is chosen per project. What this standard requires is that the runtime code has **clear boundaries** an agent can land in.

## 18. Organize by feature / domain, not by file type

```text
features/            NOT   controllers/
├── voice/                 services/
├── navigation/            models/
├── account/               utils/
└── billing/
```

## 19. The feature is the AI's primary context boundary

A task should ideally land inside `features/voice/` rather than touching dozens of scattered
files across `services/`, `models/`, `controllers/`, `utils/`.

## 20. Domain boundaries must be explicit

Each domain defines: what it owns, what it does not own, what it depends on, who uses it,
what interfaces it exposes, its rules, and its tests.

---

# VII. Interface / Contract (Boundary-Driven)

## 21. Explicit boundaries, not abstraction for abstraction's sake

Do not force an interface on every internal function. Interfaces should be introduced at meaningful architectural boundaries where they provide:
- dependency direction
- isolation
- substitution or mocking for tests
- provider abstraction
- external system boundary
- explicit domain boundary

Swift `protocol`, Python `Protocol`, or the equivalent interface / trait / abstract type.
Explicit structure means: one clear responsibility → one interface → few implementations. A pile of unused adapters is harder for an agent, not easier.

## 22. Interfaces are read before implementations

First: *what can this do?* Then: *how does it do it?*

## 23. An interface is more than method signatures

A good interface expresses: responsibility, input, output, errors, side effects, constraints.

```text
SpeechService
  Responsibility: Audio → Text
  Errors:         provider error → domain error
  Side effects:   must NOT execute user commands
  Constraints:    network failure may fall back
```

## 24. Separate the API contract from the domain contract

HTTP request/response is not the same thing as a domain service interface.

---

# VIII. Implementation

## 25. Implementation is separated from interface

```text
voice/
├── interface/        defines the capability
├── application/      orchestrates it
├── domain/           models it
└── infrastructure/   provides it
```

## 26. Default is "not expanded" — not "assumed correct"

Do not read the implementation when you don't need it. But do **not** assume it is always
correct. Drill down when: tests fail, behavior is abnormal, the contract can't explain it, or a
bug is suspected in the implementation.

---

# IX. Business Rules & Enforcement

## 27. Rules must be classified: Advisory vs Enforced

Instruction ≠ Enforcement. Do not assume writing "never delete data" in an `AGENTS.md` file will physically prevent an agent from doing it. Rules must be separated into three layers:

1. **Agent Instructions / Declared Constraints** (`CLAUDE.md`, `.cursor/rules/`): Tells the agent how it *should* behave.
2. **Guardrails / Enforcement** (`PreToolUse` Hooks, CI, Permissions, Branch Protection): Physically stops or detects violations.
3. **Verification / Evidence** (Tests, Lint, Build): Proves the result is correct.

## 27.1 Business rules must exist independently

Not buried only in implementation code:

```text
silence > 20s        → end continuous voice
network disconnected  → fall back
high-risk action      → require user confirmation
```

## 28. Invariants are cross-implementation constraints

Implementations may be swapped. Invariants should not change unless the product requirement
changes. Before modifying code, the AI checks the invariants first: *do they still hold?*

---

# X. ADRs

## 29. Every important architectural decision records its "why"

Why WebSocket? Why a Repository? Why can't the router call the database directly? Why this
caching strategy?

## 30. An ADR records the alternatives

Problem, decision, rationale, rejected alternatives, cost, and the conditions under which it
should be revisited. This stops an AI from mistaking **deliberate complexity** for
**code that can be freely simplified**.

---

# XI. Dependencies

## 31–33. The project can answer three questions

```text
Who does X depend on?      VoiceService → SpeechService, LLMService, Validator
Who uses X?                SpeechService ← VoiceService, VoiceSession
What breaks if I change X? SpeechService → VoiceService, VoiceRouter, VoiceSessionTests, ...
```

## 34. Dependency / impact maps should be auto-generated

`SYMBOL_INDEX`, `DEPENDENCY_GRAPH`, and `IMPACT_GRAPH` are machine-knowable. Don't ask humans
to maintain them by hand.

---

# XII. Naming

## 35. Names are the AI's index

Prefer `SpeechRecognitionService`, `NavigationRouteCalculator`, `VoiceCommandRouter`.
Avoid `Manager`, `Helper`, `Utils`, `Common`, `Worker`, `Handler` unless they carry a real,
specific meaning.

## 36. One file, one core responsibility

No 2000-line `MegaManager.swift` that owns network, database, navigation, voice, analytics, and
UI. File boundaries *are* context boundaries.

---

# XIII. Tests & Verification

## 37. Verification must be Deterministic and Closed-Loop

Do not accept an agent's self-assertion that "the code looks correct."
Verification must be split into two categories:
1. **Code Verification**: Unit tests, integration tests, builds, static analysis.
2. **Agent Behavior Verification**: Tests that ensure the agent successfully activates required workflows, handles forbidden actions correctly, and respects context limits.

They are both a verification mechanism and **executable knowledge**.

## 38. Test names express behavior

`testNetworkFailureFallsBackToLocalRecognition()`, not `test1()`.

## 39. Verify locally first, then globally

```text
change → focused unit test → integration test → (when needed) full suite
```

Do not permanently run only a single script just to save tokens.

---

# XIV. Generated Content

## 40. The source of truth must be singular

If something is generated (`generated/`), mark it **DO NOT EDIT**. Change the source, then
regenerate.

---

# XV. Doc / Code Conflicts

## 41. Documentation is not absolute truth

It can be stale. The hierarchy of truth:

```text
actual test / actual behavior
 → current implementation
 → contract
 → documentation
 → comments
```

On a conflict, do not silently patch one side. Identify the conflict and fix the correct
source of truth.

---

# XVI. Avoiding Meaningless Context & Token Noise Reduction

## 42. Explicitly configure context exclusion to isolate noise

`build/`, `DerivedData/`, `Pods/`, `node_modules/`, `.venv/`, `cache/`, `logs/`,
binaries (`.gguf`, `.bin`), and secrets (`.env*`) must be explicitly excluded.
Use each Runtime's own mechanism: `permissions.deny` `Read(...)` rules in Claude Code, `.cursorignore` in Cursor,
`.geminiignore` in Gemini CLI. There is no cross-runtime ignore file — a `.agentsignore` is read by no
major runtime, and Codex has no ignore file at all — so secrets belong outside the working tree, not
behind a convention. Never burn context budget on compiler outputs or binary noise.

## 42.1 Semantic Truth vs Runtime Entry

In a heterogeneous AI landscape (Claude Code, Gemini, Windsurf, Cursor), different tools load different root instructions (`CLAUDE.md`, `GEMINI.md`, `.cursor/rules/*.mdc`).
The architectural principle: **`docs/` holds the Semantic Truth, while the runtime-specific file acts purely as the Runtime Entry**.
Do not duplicate business knowledge into `.cursor/rules/` and `CLAUDE.md`. Instead, those runtime adapters should route the agent into the shared `docs/` repository standard.

## 42.2 Human-in-the-Loop Boundaries & Tools (`MANUAL_TASKS.md`)

AI cannot and should not attempt actions requiring third-party administrative web dashboards, production secrets, or real-device testing.
Isolate these tasks cleanly in `MANUAL_TASKS.md` with explicit checkboxes to establish a transparent human-agent collaboration contract. When delegating a task to a human, the document should explain *why* it is human-owned.

## 42.3 Tools & MCP are Structured Capabilities, Not Inherent Safety

Do not assume MCP (Model Context Protocol) is inherently "safe". Tools must be **Structured, Permissioned, and Capability-Bounded**.
Assign risk levels to tools:
- **Read Only**: (e.g. read DB schema)
- **Local Mutation**: (e.g. format code, run local test)
- **External Mutation**: (e.g. call development API)
- **Production / Destructive**: (e.g. production DB write, publish release) - Requires strict guardrails or human escalation.

---

# XVII. AI Workflow

## 43. Locate first, then go deep, verify with commands, and prevent doc rot

```text
task → Agent Rules → Project Map → Domain → Interface → Invariant/ADR
     → relevant tests → dependency/impact → implementation → modify → verification commands → doc-sync
```

## 43.1 Executable verification commands are mandatory
After modifying code, AI must execute explicit verification commands (typecheck, build, lint) rather than assuming correctness.

## 43.2 Doc-Sync Anti-Corruption
Whenever an interface, contract, or database schema changes, the corresponding index, map, and contract documents must be updated synchronously.

## 44. Do not scan the whole repo without a reason

Full-repo context is for tasks that genuinely need it (e.g. "analyze every dependency in the
project").

## 45. Context expands progressively with the question

```text
L0 don't know where the problem is
L1 know it's Voice
L2 know it's VoiceSession
L3 know it's SpeechService
L4 found a test failure
L5 read only that implementation
```

This is **Progressive Context Expansion**.

---

# XVIII. Knowledge is organized around questions

## 46. Docs should let the AI answer concrete questions

```text
change voice        → voice.md
know the interface  → interface
know why            → ADR
know what's frozen  → invariants
know what's impacted → dependency / impact
confirm behavior    → tests
```

This beats "dump everything into `architecture.md`".

---

# XIX. Cross-Platform Projects

## 47. The Knowledge Layer is platform-independent

iOS-only, FastAPI-only, or iOS + FastAPI — the knowledge-layer thinking does not change.

## 48. The Code Layer grows and shrinks with the actual systems

```text
iOS only:   docs/ ios/
backend:    docs/ backend/
full-stack: docs/ ios/ backend/ web/
```

## 49. Cross-system business shares one domain

`docs/domains/voice.md` can describe `iOS Voice → API → FastAPI Voice → LLM` in one place.
Domain knowledge is not bound to one language.

---

# XX. Automation

## 50. If a machine can know it, let the machine own it

Machine: symbols, references, imports, dependencies, file locations, call graphs, test mapping.
Human: why, intent, business rules, architecture decisions.

## 51. The doc system should be auto-verifiable

`anr validate` (Current): verify interface contracts, domain doc integrity, `AGENTS.md` router size budget, and execute freshness check scripts.

## 52. The doc system should be auto-generatable

`anr index` (Planned): generate `context-index.md`, `symbol-index.md`, and `dependency-map.md`.

## 53. Provide an init and update capability

`anr init` & `anr update` (Current): scaffold and synchronize `AGENTS.md`, `.agents/`, `docs/` across 12 template combinations so any project can adopt and evolve the AI-Native structure without drift.

---

# XXI. The Most Important Architectural Idea

## 54–58. Don't make the AI guess

| Traditional | AI-Native |
|---|---|
| code → AI guesses → architecture | architecture → code |
| business rules hidden in code | invariants + domain knowledge |
| "why is this like this?" — nobody knows | ADR |
| global search for where something is | Context Index |
| large context to understand a small problem | Progressive Disclosure |

---

# XXII. The Final Model

```text
                    AI-Native Repo
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
   AI Context Architecture       Software Architecture
             │                           │
      ┌──────┼──────┐              ┌─────┼─────┐
      │      │      │              │     │     │
     Rules  Maps  Domain          MVVM  DDD   Clean
      │      │      │              │     │     │
 Contracts Invariants ADR       Feature DI  Hexagonal
      │      │      │              │     │     │
      └──────┼──────┘              └─────┼─────┘
             │                           │
             └──────────────┬────────────┘
                            ▼
                           Code
```

Cognitive Architecture sits on Runtime Architecture:

```text
                         AI TASK
                            │
                            ▼
          ┌─────────────────────────────────┐
          │     AI Context Architecture     │
          │                                 │
          │  AGENTS → Map → Domain          │
          │  Contract → Invariant / ADR     │
          │  Tests → Dependency / Impact    │
          └────────────────┬────────────────┘
                           ▼
          ┌─────────────────────────────────┐
          │     Software Architecture       │
          │  MVVM / TCA / Clean / DDD / …   │
          └────────────────┬────────────────┘
                           ▼
          ┌─────────────────────────────────┐
          │     Implementation              │
          └────────────────┬────────────────┘
                           ▼
                 MODIFY → TEST → UPDATE KNOWLEDGE
```

---

> **AI-Native Repo is not about giving AI more code.
> It is about giving AI better structure.**
