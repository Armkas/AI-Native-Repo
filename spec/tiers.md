# AI-Native Repository Tiers

The AI-Native Repository Standard introduces **Tiers** to define the complexity, maturity, and automation profile of a repository. 
Which rules are required in which tier is defined in the [Conformance by Tier](repository-standard.md#conformance-by-tier) table of the Standard.
Tier is completely orthogonal to the Agent Runtime (e.g., Claude Code, Cursor) and the Model Provider (e.g., Anthropic, OpenAI, DeepSeek) — see [Model Compatibility Matrix](model-compatibility.md).

You choose a Tier based on your team's needs, not the tool you use.

## Tier 1: Light
**Goal:** Provide the core benefits of AI navigation with minimal setup overhead.
**Best for:** Prototypes, personal projects, new repositories, or teams taking their first step into AI-native engineering.

**Core Capabilities:**
- **Context:** `PROJECT_MAP.md` + minimal architecture overview.
- **Rules:** Root instruction entrypoint (e.g., `CLAUDE.md` or `.cursor/rules/core.mdc`).
- **Skills/Workflows:** 0 to 1 core skill.
- **Verification:** Basic testing.
- **Human Boundary:** Minimal but explicit.

**Ships (`anr init --tier light`):** `AGENTS.md` router, runtime adapter, `docs/PROJECT_MAP.md`, `docs/architecture/overview.md`, `MANUAL_TASKS.md` (the three permission levels: Autonomous / Approval Required / Manual Only), skill `verify`.

*Philosophy:* Establish Context Routing first, before building heavy automation infrastructure.

## Tier 2: Standard
**Goal:** The recommended default for production software teams.
**Best for:** Most active production repositories with a small to mid-sized team.

**Core Capabilities:**
- **Context:** Project Map, Domain Docs, Explicit Contracts, Invariants, ADRs.
- **Rules:** Root instructions + scoped local rules.
- **Skills/Workflows:** Several core reusable workflows (Feature Dev, Bug Fix, Verification), acceptance criteria before implementation, versioned plans for multi-session work.
- **Verification:** Unit tests, linting, CI, repository validation — then an independent, rubric-based `review` for what commands cannot decide (bounded LLM-as-a-judge).
- **Human Boundary:** Explicit `MANUAL_TASKS.md` for production and destructive actions.

**Ships (`anr init --tier standard`):** everything in Light, plus `.agents/rules/global.md`, `.agents/context-index.md`, `.agents/dependency-map.md`, `.agents/tools.md` (tool inventory with risk levels, Rule 19), domains / contracts / ADR docs, invariants with stable `INV-` IDs, `docs/plans/` (plan template), skills `feature-development`, `bug-fix`, `database-migration`, `api-contract-change`, `verify`, `review` (with `rubric.md` and `result.schema.json`), `doc-sync`, and a read-only `reviewer` subagent for the chosen runtime. `npx ai-native-repo index` generates `.agents/generated/code-index.md` (interface symbols, feature modules, invariant coverage) on demand. Claude Code additionally gets `.claude/settings.json` permission boundaries (deny secrets and force-push, ask before push).

*Philosophy:* A balanced workspace where AI has structured knowledge and deterministic guardrails.

## Tier 3: Full
**Goal:** Advanced, high-maturity Agent Workspace with deterministic guardrails.
**Best for:** High-maturity, long-term, large-scale production repositories.

**Core Capabilities:**
- **Context:** Generated context indexes, dependency maps, machine-readable manifest (`anr.yaml`), automated freshness checks.
- **Rules:** Detailed scoped rules, strict distinction between Advisory Rules and Guardrails.
- **Skills/Workflows:** Full set of standard skills, lifecycle hooks, MCP tool integrations.
- **Verification:** Level 1 (Static freshness & schema checks) + Level 2 (Native runtime pre-edit hooks & unbypassable CI guardrails) + Level 3 (Behavioral evals of the context layer: deterministic grader first, model judge second).
- **Human Boundary:** Strict permission boundaries and detailed manual task escalation.

**Ships (`anr init --tier full`):** everything in Standard, plus `.agents/guardrails/protected-paths.txt` (read-only / append-only paths) enforced by `scripts/guard-paths.sh` (wired as a native pre-edit hook in Claude Code, Codex, Gemini CLI, and Cursor), `.github/workflows/ai-guardrail.yml` (remote CI layer that shell edits cannot bypass), `scripts/check-freshness.sh` (detects broken links, absolute paths, malformed skills, oversized router, stale index paths, and god files; reports which `INV-` IDs no test references yet), `evals/` with a sample scenario plus `scripts/eval-check.sh` (deterministic grader: files that must / must not change), and the opt-in, record-only `.github/workflows/ai-review.yml` with `scripts/ai-review-record.sh` (headless review per pull request; needs the runtime's API key as a repository secret). `check-freshness.sh` also fails on credentials in committed agent / MCP configs and flags MCP servers missing from the tool inventory. A human can approve a deliberate change to a protected path with the `guardrail-override` pull-request label.

*Philosophy:* Maximum automation, but with strictly controlled Context Cost and rigid, dual-layer verification closed-loops.

