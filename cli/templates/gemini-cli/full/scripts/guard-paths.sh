#!/usr/bin/env bash
# Runtime-neutral path guardrail. Rules live in .agents/guardrails/protected-paths.txt.
#
# Modes:
#   hook (default) — reads a pre-tool-call JSON on stdin and exits 2 to block the call. Understands
#                    a single file path in tool_input (Claude Code PreToolUse, Gemini CLI BeforeTool)
#                    and the patch text of Codex apply_patch (tool_input.command), where every
#                    Add / Update / Delete / Move target is checked.
#   check <path>   — checks a single path as if it were about to be edited.
#   ci <base-ref>  — checks every file changed since <base-ref>. Runtime hooks only see the agent's
#                    own file tools (not shell edits), so CI is the layer that cannot be bypassed.
set -u
ROOT="${CLAUDE_PROJECT_DIR:-${GEMINI_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}}"
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

# Absolute path → same path with its deepest existing ancestor resolved, so symlinked spellings
# (e.g. /var vs /private/var on macOS) compare equal. Works for files that do not exist yet.
canon() {
  local p="$1" rest=""
  while [ ! -d "$p" ] && [ -n "$p" ] && [ "$p" != "/" ]; do rest="/${p##*/}$rest"; p="${p%/*}"; done
  echo "$(cd "${p:-/}" && pwd -P)$rest"
}
ROOT_REAL=$(canon "$ROOT")

# $1 = path, $2 = directory a relative path is relative to (default: current directory).
relpath() {
  local p="$1" base="${2:-$PWD}"
  case "$p" in /*) ;; *) p="$base/${p#./}" ;; esac
  p=$(canon "$p"); p="${p#"$ROOT_REAL"/}"; echo "$p"
}

# Codex apply_patch text → one "<state> <path>" line per file it adds, updates, deletes or moves.
patch_targets() {
  printf '%s\n' "$1" | awk '
    /^\*\*\* Add File: /    { print "new "      substr($0, 15) }
    /^\*\*\* Update File: / { print "existing " substr($0, 18); src = substr($0, 18) }
    /^\*\*\* Delete File: / { print "deleted "  substr($0, 18) }
    /^\*\*\* Move to: /     { print "deleted "  src; print "new " substr($0, 14) }'
}

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
      path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.notebook_path // .tool_input.path // .tool_input.target_file // .input.path // .input.file_path // .input.target_file // empty')
      patch=$(printf '%s' "$input" | jq -r '.tool_input.command // empty | if type == "array" then join("\n") else . end')
      cwd=$(printf '%s' "$input" | jq -r '.cwd // empty')
    else
      path=$(printf '%s' "$input" | grep -oE '"(file_path|notebook_path|target_file|path)"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed -E 's/.*:[[:space:]]*"([^"]*)"$/\1/')
      patch=$(printf '%s' "$input" | awk '{ gsub(/\\n/, "\n"); print }')
      cwd=$(printf '%s' "$input" | grep -oE '"cwd"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed -E 's/.*:[[:space:]]*"([^"]*)"$/\1/')
    fi

    # One "<state> <path>" line per file the call would touch. "auto" = decide from the file system.
    targets=""
    [ -n "$path" ] && targets="auto $path"
    if [[ "$patch" == *'*** Begin Patch'* ]]; then
      targets="$targets
$(patch_targets "$patch")"
    fi
    [ -z "${targets//[[:space:]]/}" ] && exit 0

    while read -r state p; do
      [ -z "$p" ] && continue
      rel=$(relpath "$p" "${cwd:-$PWD}")
      if [ "$state" = auto ]; then state=new; [ -e "$ROOT/$rel" ] && state=existing; fi
      msg=$(violates "$rel" "$state") || {
        echo "⛔ Blocked by guardrail: $msg If this edit is genuinely required, ask the human to make it or to adjust .agents/guardrails/protected-paths.txt." >&2
        exit 2
      }
    done <<< "$targets"
    exit 0 ;;
esac
