# Model Compatibility Matrix

> See [Repository Standard — Rule 03](repository-standard.md#rule-03-normative--separation-of-concerns-model-provider--agent-runtime--repository-standard) for why Model Provider and Agent Runtime are kept as separate axes.

The AI-Native Repository Standard separates the **Model Provider** from the **Agent Runtime**.

While your repository's semantic truth (Context, Contracts, Rules) is **Model-Agnostic**, how it is executed depends on the Runtime, and how effectively the Runtime performs depends on the underlying Model.

This matrix documents the known compatibility between Agent Runtimes and Model Providers/Families. It is informational, not part of the Repository Standard's required templates — **a Model Provider must never become its own Template** (e.g. there is no `templates/deepseek/`); it is always paired with a Runtime × Tier template instead.

## Current Reference Runtimes vs. Emerging Runtimes

This repository ships first-class adapters and templates (`template-source/`, generated into `cli/templates/`, plus `examples/`) for four **Reference Runtimes**:

- `claude-code`, `codex`, `gemini-cli`, `cursor`

Other Agent Runtimes are real and worth tracking, but do not yet have a Reference adapter here — usually because they are new, still in developer preview, or their conventions haven't stabilized. They are listed below as **Emerging Runtimes**. A Runtime graduates from "Emerging" to "Reference" once its adapter conventions are stable enough to standardize (see [Adapters — Adding New Adapters](adapters.md#adding-new-adapters)).

**Emerging Runtimes** (as of this writing): Qwen Code, DeepSeek Harness, Windsurf, GitHub Copilot, Trae, and others. This list changes faster than the Standard itself, so treat it as a snapshot, not a commitment.

## Compatibility Levels
* **Native**: The runtime was built by the model provider or has first-class, optimized support.
* **Supported**: Officially supported via provider configuration or API keys.
* **Compatible**: Can be used via API-compatible endpoints (e.g., OpenAI-compatible wrappers).
* **Experimental**: Developer preview or community workarounds; expect breaking changes.

## Current Matrix

| Runtime | Model Provider | Compatibility | Notes |
|---------|---------------|---------------|-------|
| **Claude Code** | Anthropic | Native | Full lifecycle hooks and MCP support. |
| **Claude Code** | DeepSeek | Compatible | Via Anthropic-compatible API endpoints. |
| **Claude Code** | Qwen | Compatible | Where supported via proxy config. |
| **Codex** | OpenAI | Native | Full native integration. |
| **Codex** | DeepSeek | Compatible | Via DeepSeek's Responses-API-compatible endpoint. |
| **Cursor** | OpenAI | Supported | Auto model selection available. |
| **Cursor** | Anthropic | Supported | Full glob matching support. |
| **Cursor** | Google | Supported | Supported out of the box. |
| **Cursor** | DeepSeek | Supported | Custom model provider config. |
| **Gemini CLI** | Google | Native | Purpose-built for Gemini models. |
| **Qwen Code** *(Emerging)* | Qwen | Native | Built-in provider. |
| **Qwen Code** *(Emerging)* | DeepSeek | Supported | Built-in third-party provider support. |
| **Qwen Code** *(Emerging)* | OpenAI / Anthropic | Supported | Officially supported via API. |
| **DeepSeek Harness** *(Emerging)* | DeepSeek | Native | Developer Preview (`dsh`); expect breaking changes. |
| **DeepSeek Harness** *(Emerging)* | OpenAI / Anthropic | Experimental | Everything-is-a-plugin architecture, still evolving. |

This table will be extended as new Model Providers (e.g. Meta/Llama, Moonshot/Kimi, Zhipu/GLM, MiniMax) publish confirmed Runtime integrations — contributions welcome via PR, no Standard change required.

## Why This Doesn't Become a Template Dimension

If Model Provider became a template axis, `Runtime × Tier` (today 4 × 3 = 12) would become `Runtime × Tier × Model` and grow combinatorially every time a new provider ships an API-compatible endpoint. Instead:

1. **Repository Semantics**: Entirely Model-Agnostic — unaffected by which provider you use.
2. **Runtime Integration**: Runtime-Aware — captured by the existing `template-source/runtimes/<runtime>/` layers (generated into `cli/templates/<runtime>/<tier>`) (e.g. `.cursor/rules`, `.claude/settings.json`).
3. **Model Optimization**: Optional / Model-Tunable — a small, isolated layer (e.g. tuning a skill's wording for a specific model's context window) that never becomes part of the Repository Standard itself.

## Models as Judges

A model that grades work ([Rule 13](repository-standard.md#rule-13-normative--verification-hierarchy--bounded-judges)) is configuration, not part of the standard — the same rule as above applies:
never hard-code a provider into a rubric, a scenario or a directory name.

- **Record it.** Every review or eval result names the judge model (and the agent model it judged). A score that changed
  is unexplainable if the model changed silently.
- **Prefer independence.** A judge from a different context — and, where available, a different model family — than the
  author shares fewer of its blind spots.
- **Pin it in CI.** The optional `ai-review.yml` workflow (full tier) reads the judge model from the repository variable
  `AI_REVIEW_MODEL` and writes it into every result; unset, it records `runtime-default`, which makes results harder to compare.
- **Re-calibrate on change.** Switching the judge model invalidates its calibration against human grades; re-run the
  human sample before letting its verdicts gate anything.
