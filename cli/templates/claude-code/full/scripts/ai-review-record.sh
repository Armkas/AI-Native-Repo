#!/usr/bin/env bash
# Turns a reviewer's JSON output into the recorded review result (review skill, Rule 13).
# Usage: bash scripts/ai-review-record.sh <runtime> <reviewer-output> [out-file]   (default out: .ai-review/result.json)
#   - accepts bare JSON or JSON wrapped in a ``` fence
#   - checks the shape of .agents/skills/review/result.schema.json (criteria, six rubric dimensions, notes)
#   - computes `overall`: FAIL if any verdict is FAIL, PASS only if every verdict is PASS, otherwise UNKNOWN
#   - adds `meta`: reviewed commit, base, judge runtime + model ($AI_REVIEW_MODEL), rubric version
#     (last commit touching rubric.md on $AI_REVIEW_BASE when set — the copy CI reviews with — else on HEAD)
#   - appends a table to $GITHUB_STEP_SUMMARY when it is set
# The reviewer never decides `overall` itself. Requires jq. Exit 0 = recorded, 1 = invalid output.
set -euo pipefail
RUNTIME="${1:?usage: ai-review-record.sh <runtime> <reviewer-output> [out-file]}"
IN="${2:?usage: ai-review-record.sh <runtime> <reviewer-output> [out-file]}"
OUT="${3:-.ai-review/result.json}"
command -v jq >/dev/null 2>&1 || { echo "ai-review-record: jq is required" >&2; exit 1; }

json=$(sed -e '/^[[:space:]]*```/d' "$IN")
if ! printf '%s' "$json" | jq -e '
    def verdict: . == "PASS" or . == "FAIL" or . == "UNKNOWN";
    (.criteria | type == "array")
    and all(.criteria[]; (.criterion | type == "string") and (.verdict | verdict) and (.evidence | type == "string"))
    and ((.rubric | keys) == ["correctness", "docs", "invariants", "safety", "scope", "tests"])
    and all(.rubric[]; (.verdict | verdict) and (.evidence | type == "string"))
    and (.notes | type == "string")' >/dev/null 2>&1; then
  echo "❌ Reviewer output does not match .agents/skills/review/result.schema.json: $IN" >&2
  exit 1
fi

rubric_version=$(git log -1 --format=%h "${AI_REVIEW_BASE:-HEAD}" -- .agents/skills/review/rubric.md 2>/dev/null || true)
commit=$(git rev-parse HEAD 2>/dev/null || echo unknown)
mkdir -p "$(dirname "$OUT")"
printf '%s' "$json" | jq \
  --arg runtime "$RUNTIME" --arg model "${AI_REVIEW_MODEL:-runtime-default}" \
  --arg commit "$commit" --arg base "${AI_REVIEW_BASE:-}" --arg rubric "${rubric_version:-unknown}" '
  ([.criteria[].verdict] + [.rubric[].verdict]) as $v
  | { meta: { reviewed_commit: $commit, base: $base, judge: { runtime: $runtime, model: $model }, rubric_version: $rubric },
      overall: (if ($v | index("FAIL")) != null then "FAIL" elif ($v | all(. == "PASS")) then "PASS" else "UNKNOWN" end) }
    + .' > "$OUT"

overall=$(jq -r .overall "$OUT")
echo "AI review recorded in $OUT — overall: $overall (record-only)"

if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  jq -r '
    def cell: tostring | gsub("\\|"; "/") | gsub("\n"; " ");
    "## AI review (record-only): \(.overall)\n",
    "Judge: `\(.meta.judge.runtime)` / `\(.meta.judge.model)` · rubric `\(.meta.rubric_version)` · commit `\(.meta.reviewed_commit[0:7])`\n",
    "| Criterion | Verdict | Evidence |", "| :--- | :--- | :--- |",
    (.criteria[] | "| \(.criterion | cell) | \(.verdict) | \(.evidence | cell) |"),
    "", "| Rubric | Verdict | Evidence |", "| :--- | :--- | :--- |",
    (.rubric | to_entries[] | "| \(.key) | \(.value.verdict) | \(.value.evidence | cell) |"),
    "", (if .notes != "" then "Notes: \(.notes | cell)\n" else empty end),
    "> Record-only: this verdict does not block the merge until the reviewer has been calibrated against human grades (Rule 13)."
  ' "$OUT" >> "$GITHUB_STEP_SUMMARY"
fi
