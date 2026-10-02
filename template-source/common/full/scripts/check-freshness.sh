#!/usr/bin/env bash
# AI context freshness check — verifies the AI Context Layer has not rotted.
# Usage: bash scripts/check-freshness.sh [--strict]
#   Hard failures: broken relative links, absolute local paths, malformed skills.
#   Warnings (failures with --strict): oversized AGENTS.md, stale paths in the context index, god files.
set -u
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT" || exit 1
STRICT=0; [ "${1:-}" = "--strict" ] && STRICT=1
FAILS=0; WARNS=0
fail() { echo "❌ $*"; FAILS=$((FAILS+1)); }
warn() { echo "⚠️  $*"; WARNS=$((WARNS+1)); }

# Markdown files that make up the AI Context Layer: entry files at any depth, docs/, .agents/, .cursor/rules/.
# git's file list respects .gitignore (no node_modules / build noise); plain `find` is the fallback.
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
if git rev-parse --git-dir >/dev/null 2>&1; then
  git -c core.quotepath=off ls-files --cached --others --exclude-standard -- '*.md' '*.mdc'
else
  find . \( -name node_modules -o -name .git -o -name build -o -name dist \) -prune -o \( -name '*.md' -o -name '*.mdc' \) -type f -print | sed 's|^\./||'
fi | grep -E '^(docs/|\.agents/|\.cursor/rules/)|(^|/)(AGENTS|CLAUDE|GEMINI|MANUAL_TASKS)\.md$' | while IFS= read -r f; do
  [ -f "$f" ] && echo "$f"
done | sort -u > "$TMP/docs"

# 1. Relative links must resolve (links inside fenced code blocks are ignored).
while IFS= read -r f; do
  dir=$(dirname "$f")
  awk '/^[[:space:]]*```/{c=!c; next} !c' "$f" | grep -oE '\]\([^)[:space:]]+\)' | sed -e 's/^](//' -e 's/)$//' |
  while IFS= read -r link; do
    case "$link" in http://*|https://*|mailto:*|\#*|*'<'*|*'['*) continue ;; esac
    target="${link%%#*}"; [ -z "$target" ] && continue
    case "$target" in /*) p="$ROOT$target" ;; *) p="$dir/$target" ;; esac
    [ -e "$p" ] || echo "$f -> $link"
  done
done < "$TMP/docs" > "$TMP/broken"
while IFS= read -r l; do fail "Broken link: $l"; done < "$TMP/broken"

# 2. No absolute local paths — they break on every other machine and after a rename.
# Detects file:///, Windows drive paths (C:\, D:/), UNC (\\server), /Volumes/, /Users/, /home/, /mnt/
ABS='file:///|[a-zA-Z]:[/\\]|\\\\[a-zA-Z0-9_-]+[/\\]|/Volumes/|/Users/[^/ ]+/|/home/[^/ ]+/|/mnt/[^/ ]+/'
while IFS= read -r f; do
  hit=$(grep -nE "$ABS" "$f" | head -1 | cut -c1-120)
  [ -n "$hit" ] && echo "$f: $hit"
done < "$TMP/docs" > "$TMP/abs"
while IFS= read -r l; do fail "Absolute local path (use a relative link): $l"; done < "$TMP/abs"


# 3. Skills must have valid frontmatter: name == directory, non-empty description.
for s in .agents/skills/*/SKILL.md; do
  [ -f "$s" ] || continue
  d=$(basename "$(dirname "$s")")
  head -1 "$s" | grep -q '^---$' || { fail "$s: missing frontmatter"; continue; }
  n=$(awk 'NR>1 && /^---$/{exit} /^name:/{sub(/^name:[[:space:]]*/,""); print}' "$s")
  desc=$(awk 'NR>1 && /^---$/{exit} /^description:/{sub(/^description:[[:space:]]*/,""); print}' "$s")
  [ "$n" = "$d" ] || fail "$s: name '$n' does not match directory '$d'"
  [ -n "$desc" ] || fail "$s: empty description (runtimes use it to decide when to load the skill)"
done

# 4. The router must stay small (Rule 01: <= 2 KB / 2048 bytes).
if [ -f AGENTS.md ]; then
  size=$(wc -c < AGENTS.md | tr -d ' ')
  [ "$size" -gt 2048 ] && fail "AGENTS.md is ${size} bytes (> 2048 budget per Rule 01). Move detail into docs/ or .agents/ and link to it."
fi


# 5. Paths named in the context index must still exist.
if [ -f .agents/context-index.md ]; then
  # Link texts are already covered by check 1, so strip [text](target) first. Only tokens whose first
  # segment is an existing top-level entry are treated as repo paths (skips placeholders, URL prefixes, bucket keys).
  sed -E 's/\[[^]]*\]\([^)]*\)//g' .agents/context-index.md | grep -oE '`[^`]+`' | tr -d '`' | while IFS= read -r p; do
    case "$p" in /*|*' '*|*'<'*|*'['*|*'*'*|*'('*) continue ;; esac  # /api/... is an endpoint, not a file
    case "$p" in */*) ;; *) continue ;; esac
    [ -e "${p%%/*}" ] || continue
    [ -e "${p%/}" ] || echo "$p"
  done | sort -u > "$TMP/stale"
  while IFS= read -r p; do warn "context-index.md references missing path: $p"; done < "$TMP/stale"
fi

# 6. God files (philosophy §37): hand-written sources over 1000 lines.
if git rev-parse --git-dir >/dev/null 2>&1; then
  git ls-files | grep -E '\.(swift|kt|java|ts|tsx|js|jsx|py|go|rs|rb|cs|dart)$' | grep -vE '(generated|\.gen\.|/migrations/|\.d\.ts$)' |
  while IFS= read -r f; do
    [ -f "$f" ] || continue
    n=$(wc -l < "$f" | tr -d ' ')
    [ "$n" -gt 1000 ] && echo "$f ($n lines)"
  done > "$TMP/god"
  while IFS= read -r l; do warn "Large source file: $l"; done < "$TMP/god"
fi

echo "---"
if [ "$FAILS" -gt 0 ] || { [ "$STRICT" -eq 1 ] && [ "$WARNS" -gt 0 ]; }; then
  echo "❌ Freshness check failed: $FAILS error(s), $WARNS warning(s)."; exit 1
fi
echo "✅ Freshness check passed ($WARNS warning(s))."
