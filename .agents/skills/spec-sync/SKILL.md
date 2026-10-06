---
name: spec-sync
description: Multi-lingual synchronization checklist for conceptual changes to the AI-Native Repository Standard — which spec, philosophy and README files must change together, and which are English-only. Use whenever a rule, pillar, tier or core concept is added, removed or changed.
---

# Spec Sync

A conceptual change is not done until every language says the same thing.

## Must change together

| What changed | Files |
| :--- | :--- |
| A rule (text, number, MUST/SHOULD level, tier applicability) | `spec/repository-standard.md`, `spec/repository-standard.zh-CN.md` (including the *Conformance by Tier* table) |
| The reasoning behind a rule | `spec/philosophy.md`, `spec/philosophy.zh-CN.md`, `spec/philosophy.ja.md` |
| A pillar, tier, or anything the README describes | **all 13** `README*.md` — the language switcher at the top of `README.md` lists them |
| What a tier ships | `spec/tiers.md`, and the `standard` / `full` bullets in every README |

English-only reference material, outside this sync requirement: `spec/adapters.md`, `spec/tiers.md`, `spec/model-compatibility.md`. `ABOUT.md` is English-only too, but keep its pillar table true.

## Rules

- A new Model Provider or Runtime goes into `spec/model-compatibility.md` only — never a per-model template or README section.
- Rule numbers are stable. Add new rules at the end of the relevant section; do not renumber existing ones (other files link to them).
- Anchors are derived from headings: renaming a rule heading breaks links such as `repository-standard.md#rule-03-...`. Search for the old anchor before renaming.
- Translations carry the same meaning, not word-for-word text. Keep code, file names and rule IDs untranslated.
- The three philosophy files share one section numbering. Add a section to all three at the same number (use a sub-number such as `36.1` instead of shifting later sections).

## Check

```bash
grep -c '^## Rule' spec/repository-standard.md        # must equal the next line
grep -c '^## 规则' spec/repository-standard.zh-CN.md
for f in spec/philosophy*.md; do grep -oE '^## [0-9.–]+' "$f" | md5sum; done   # three identical hashes
./scripts/validate.sh                                   # includes a link check over spec/ and README*.md
```
