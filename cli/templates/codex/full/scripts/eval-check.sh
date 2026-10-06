#!/usr/bin/env bash
# Deterministic grader for behavioral evals (evals/README.md). Run it after the agent finished a scenario.
# Usage: bash scripts/eval-check.sh <evals/scenarios/<id>.md> [base-ref]   (base-ref defaults to HEAD)
#   Changed files = committed since <base-ref> + staged + unstaged + untracked.
#   must_change:     every glob must match at least one changed file
#   must_not_change: no changed file may match any glob
#   Globs use shell pattern rules on the repo-relative path; * also matches /.
# Exit 0 = pass, 1 = fail, 2 = usage error. A model judge runs only after this passes.
set -u
SCENARIO="${1:?usage: eval-check.sh <scenario.md> [base-ref]}"
BASE="${2:-HEAD}"
ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || { echo "eval-check: not a git repository" >&2; exit 2; }
[ -f "$SCENARIO" ] || { echo "eval-check: scenario not found: $SCENARIO" >&2; exit 2; }
git -C "$ROOT" rev-parse --verify -q "$BASE" >/dev/null || { echo "eval-check: unknown base ref: $BASE" >&2; exit 2; }

# "<key> <glob>" for every list item under must_change / must_not_change in the frontmatter.
rules=$(awk '
  NR == 1 && $0 != "---" { exit }
  NR > 1 && $0 == "---"  { exit }
  /^[a-z_]+:/            { key = $1; sub(/:$/, "", key); next }
  /^[[:space:]]+-[[:space:]]/ && (key == "must_change" || key == "must_not_change") {
    v = $0; sub(/^[[:space:]]+-[[:space:]]+/, "", v); gsub(/^["'\'']|["'\'']$/, "", v); print key, v }
' "$SCENARIO")
[ -n "$rules" ] || { echo "eval-check: no must_change / must_not_change rules in $SCENARIO" >&2; exit 2; }

changed=$( { git -C "$ROOT" diff --name-only "$BASE"; git -C "$ROOT" ls-files --others --exclude-standard; } | sort -u)

fails=0
while read -r key glob; do
  hits=""
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    # shellcheck disable=SC2254
    case "$f" in $glob) hits="$hits $f" ;; esac
  done <<< "$changed"
  if [ "$key" = must_change ]; then
    if [ -n "$hits" ]; then echo "PASS  must_change      $glob ->$hits"; else echo "FAIL  must_change      $glob -> no changed file matches"; fails=$((fails+1)); fi
  else
    if [ -z "$hits" ]; then echo "PASS  must_not_change  $glob"; else echo "FAIL  must_not_change  $glob ->$hits"; fails=$((fails+1)); fi
  fi
done <<< "$rules"

echo "---"
echo "changed files: $(printf '%s\n' "$changed" | grep -c .)"
if [ "$fails" -gt 0 ]; then echo "❌ eval-check failed: $fails rule(s)."; exit 1; fi
echo "✅ eval-check passed."
