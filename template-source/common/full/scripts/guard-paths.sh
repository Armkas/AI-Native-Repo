#!/usr/bin/env bash
# Runtime-neutral path guardrail. Rules live in .agents/guardrails/protected-paths.txt.
#
# Modes:
#   hook (default) — reads a tool-call JSON on stdin (Claude Code PreToolUse format:
#                    {"tool_input":{"file_path":"..."}}). Exit 2 blocks the call.
#   check <path>   — checks a single path as if it were about to be edited.
#   ci <base-ref>  — checks every file changed since <base-ref>; for runtimes without hooks.
set -u
ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
RULES="$ROOT/.agents/guardrails/protected-paths.txt"
[ -f "$RULES" ] || exit 0

# $1 = repo-relative path, $2 = "existing" | "new" | "deleted". Prints the violation, returns 1 if blocked.
violates() {
  local rel="$1" state="$2" mode pattern
  while read -r mode pattern; do
    case "$mode" in ''|\#*) continue ;; esac
    # shellcheck disable=SC2254
    case "$rel" in
      $pattern)
        if [ "$mode" = "read-only" ]; then
          echo "'$rel' is read-only for agents (rule: $mode $pattern)."; return 1
        elif [ "$mode" = "append-only" ] && [ "$state" != "new" ]; then
          echo "'$rel' is append-only: create a new file instead of editing or deleting this one (rule: $mode $pattern)."; return 1
        fi ;;
    esac
  done < "$RULES"
  return 0
}

relpath() { local p="$1"; p="${p#"$ROOT"/}"; p="${p#./}"; echo "$p"; }

case "${1:-hook}" in
  check)
    rel=$(relpath "$2"); state=new; [ -e "$ROOT/$rel" ] && state=existing
    msg=$(violates "$rel" "$state") || { echo "⛔ $msg" >&2; exit 2; }
    exit 0 ;;
  ci)
    base="${2:?usage: guard-paths.sh ci <base-ref>}"; bad=0
    while read -r status path rest; do
      # A rename (R*) removes the original path, so it counts as a deletion.
      case "$status" in A) state=new ;; D|R*) state=deleted ;; *) state=existing ;; esac
      msg=$(violates "$path" "$state") || { echo "⛔ $msg"; bad=1; }
    done < <(git -C "$ROOT" diff --name-status "$base"...HEAD)
    exit $bad ;;
  hook|*)
    input=$(cat)
    if command -v jq >/dev/null 2>&1; then
      path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.notebook_path // .tool_input.path // empty')
    else
      path=$(printf '%s' "$input" | grep -oE '"(file_path|notebook_path)"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed -E 's/.*:[[:space:]]*"([^"]*)"$/\1/')
    fi
    [ -z "$path" ] && exit 0
    rel=$(relpath "$path"); state=new; [ -e "$ROOT/$rel" ] && state=existing
    msg=$(violates "$rel" "$state") || {
      echo "⛔ Blocked by guardrail: $msg If this edit is genuinely required, ask the human to make it or to adjust .agents/guardrails/protected-paths.txt." >&2
      exit 2
    }
    exit 0 ;;
esac
