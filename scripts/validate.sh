#!/bin/bash
# AI-Native Repository Validator
# Validates structure, links, and integrity of the repository standard.

set -e
echo "Starting AI-Native Repository Validation..."

FAILS=0

function check_dir() {
    if [ ! -d "$1" ]; then
        echo "❌ FAIL: Required directory '$1' is missing."
        FAILS=$((FAILS+1))
    else
        echo "✅ PASS: Directory '$1' exists."
    fi
}

function check_file() {
    if [ ! -f "$1" ]; then
        echo "❌ FAIL: Required file '$1' is missing."
        FAILS=$((FAILS+1))
    else
        echo "✅ PASS: File '$1' exists."
    fi
}

function check_no_string() {
    local str="$1"
    local path="$2"
    local include="${3:-*}"
    if grep -r --include="$include" "$str" "$path" 2>/dev/null; then
        echo "❌ FAIL: Found deprecated string '$str' in $path."
        FAILS=$((FAILS+1))
    else
        echo "✅ PASS: Deprecated string '$str' is clean in $path."
    fi
}

# 1. Structural Checks
echo "--- Structural Checks ---"
check_dir "spec"
check_dir "examples/claude-code"
check_dir "examples/codex"
check_dir "examples/gemini-cli"
check_dir "examples/cursor"
check_dir "template-source"
check_dir "cli"

check_file "AGENTS.md"
check_file "anr.yaml"
check_file "spec/repository-standard.md"
check_file "spec/philosophy.md"
check_file "spec/adapters.md"
check_file "spec/tiers.md"
check_file "cli/package.json"

# 2. Template Integrity Checks (Testing generated templates)
echo "--- Template Integrity ---"

echo "Checking for template drift..."
TMP_GEN=$(mktemp -d)
node scripts/generate-templates.js "$TMP_GEN" > /dev/null
if diff -r -q "$TMP_GEN" cli/templates > /dev/null 2>&1; then
    echo "✅ PASS: Generated templates are in sync."
else
    echo "❌ FAIL: cli/templates is out of sync with template-source! Run 'node scripts/generate-templates.js' and commit."
    FAILS=$((FAILS+1))
fi
rm -rf "$TMP_GEN"


if [ ! -d "cli/templates" ]; then
    echo "❌ FAIL: cli/templates missing. Run 'node scripts/generate-templates.js' first."
    FAILS=$((FAILS+1))
else
    check_dir "cli/templates/claude-code/light"
    check_dir "cli/templates/claude-code/standard"
    check_dir "cli/templates/claude-code/full"
    check_dir "cli/templates/codex/light"
    check_dir "cli/templates/codex/standard"
    check_dir "cli/templates/codex/full"
    check_dir "cli/templates/gemini-cli/light"
    check_dir "cli/templates/gemini-cli/standard"
    check_dir "cli/templates/gemini-cli/full"
    check_dir "cli/templates/cursor/light"
    check_dir "cli/templates/cursor/standard"
    check_dir "cli/templates/cursor/full"
    
    check_file "cli/templates/claude-code/standard/CLAUDE.md"
    check_file "cli/templates/codex/standard/AGENTS.md"
    check_file "cli/templates/gemini-cli/standard/GEMINI.md"
    check_file "cli/templates/cursor/standard/.cursor/rules/core.mdc"
    check_file "cli/templates/claude-code/standard/.agents/skills/verify/SKILL.md"
    check_file "cli/templates/claude-code/full/scripts/check-freshness.sh"
    check_file "cli/templates/claude-code/full/.claude/settings.json"
    check_file "cli/templates/gemini-cli/full/.gemini/settings.json"
    check_file "cli/templates/codex/full/.codex/hooks.json"
    check_file "cli/templates/cursor/full/.cursor/hooks.json"
fi

# Every runtime config (hooks, permissions, MCP) must be valid JSON, or the runtime silently ignores it.
echo "--- JSON Config Checks ---"
while IFS= read -r f; do
    if node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$f" 2>/dev/null; then
        echo "✅ PASS: $f is valid JSON."
    else
        echo "❌ FAIL: $f is not valid JSON."
        FAILS=$((FAILS+1))
    fi
done < <(find template-source examples -name '*.json' -not -path '*/node_modules/*')

# 3. End-to-end scaffold tests (links, skills, guardrails for every runtime × tier × language)
echo "--- Scaffold Tests ---"
TEST_LOG=$(mktemp)
if node cli/tests/test.js > "$TEST_LOG" 2>&1; then
    echo "✅ PASS: $(tail -1 "$TEST_LOG")"
else
    cat "$TEST_LOG"
    echo "❌ FAIL: CLI scaffold tests failed."
    FAILS=$((FAILS+1))
fi

# 4. The reference repository follows its own standard (Rule 01 router budget, Rule 07 boundaries, links)
echo "--- Self-Conformance ---"
for f in AGENTS.md examples/*/voice-chat/AGENTS.md; do
    size=$(wc -c < "$f" | tr -d ' ')
    if [ "$size" -le 2048 ]; then echo "✅ PASS: $f is $size bytes (<= 2048)."; else echo "❌ FAIL: $f is $size bytes (> 2048, Rule 01)."; FAILS=$((FAILS+1)); fi
done
for f in MANUAL_TASKS.md examples/*/voice-chat/MANUAL_TASKS.md; do
    if grep -q '\[Autonomous\]' "$f" && grep -q '\[Approval Required\]' "$f" && grep -q '\[Manual Only\]' "$f"; then
        echo "✅ PASS: $f defines the three permission levels."
    else
        echo "❌ FAIL: $f must define [Autonomous] / [Approval Required] / [Manual Only] (Rule 07)."; FAILS=$((FAILS+1))
    fi
done
if [ "$(grep -c '^## Rule' spec/repository-standard.md)" = "$(grep -c '^## 规则' spec/repository-standard.zh-CN.md)" ]; then
    echo "✅ PASS: EN and ZH standards have the same number of rules."
else
    echo "❌ FAIL: spec/repository-standard.md and .zh-CN.md differ in rule count."; FAILS=$((FAILS+1))
fi
PHILO_NUMS=$(for f in spec/philosophy.md spec/philosophy.zh-CN.md spec/philosophy.ja.md; do grep -oE '^## [0-9]+(–[0-9]+)?(\.[0-9]+)?' "$f" | tr '\n' ' '; echo; done | sort -u | wc -l | tr -d ' ')
if [ "$PHILO_NUMS" = "1" ]; then
    echo "✅ PASS: EN / ZH / JA philosophy share one section numbering."
else
    echo "❌ FAIL: spec/philosophy*.md section numbers differ between languages."; FAILS=$((FAILS+1))
fi
if node scripts/check-links.js spec README*.md ABOUT.md AGENTS.md CLAUDE.md GEMINI.md MANUAL_TASKS.md .agents examples; then
    echo "✅ PASS: links and anchors resolve."
else
    echo "❌ FAIL: broken links or anchors (see above)."; FAILS=$((FAILS+1))
fi

# 5. Drift & Stale Path Checks
echo "--- Stale Content Detection ---"
check_no_string "template/" "AGENTS.md"
check_no_string "examples/ios" "AGENTS.md"
check_no_string "template/" "CLAUDE.md"
check_no_string "template/" "GEMINI.md"
check_no_string "file:///" "template-source" "*.md"

if [ $FAILS -gt 0 ]; then
    echo "❌ VALIDATION FAILED with $FAILS errors."
    exit 1
else
    echo "🎉 VALIDATION PASSED! The repository meets the AI-Native structural standard."
    exit 0
fi
