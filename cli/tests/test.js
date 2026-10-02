#!/usr/bin/env node
// End-to-end tests: scaffold every runtime × tier × language into a temp dir and check that the
// result is a coherent AI-Native workspace (no broken links, valid skills, working guardrails).
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const BIN = path.join(__dirname, '..', 'bin', 'anr.js');
const RUNTIMES = ['claude-code', 'codex', 'gemini-cli', 'cursor'];
const TIERS = ['light', 'standard', 'full'];
const LANGS = ['en', 'zh-CN', 'ja'];
const ENTRY = { 'claude-code': 'CLAUDE.md', codex: 'AGENTS.md', 'gemini-cli': 'GEMINI.md', cursor: '.cursor/rules/core.mdc' };
const SKILL_LINKS = { 'claude-code': '.claude/skills' };
// Native pre-edit hook config per runtime (full tier).
const HOOK_CONFIGS = { 'claude-code': '.claude/settings.json', 'gemini-cli': '.gemini/settings.json', codex: '.codex/hooks.json', cursor: '.cursor/hooks.json' };

let failures = 0;
let checks = 0;
function check(cond, msg) {
  checks++;
  if (!cond) { failures++; console.error(`  ❌ ${msg}`); }
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    if (e.isSymbolicLink()) return [];
    return e.isDirectory() ? walk(p) : [p];
  });
}

function brokenLinks(root) {
  const broken = [];
  for (const f of walk(root).filter(f => /\.(md|mdc)$/.test(f))) {
    const text = fs.readFileSync(f, 'utf8').replace(/^\s*```[\s\S]*?^\s*```/gm, '');
    for (const m of text.matchAll(/\]\(([^)\s]+)\)/g)) {
      const link = m[1];
      if (/^(https?:|mailto:|#)/.test(link) || /[<\[]/.test(link)) continue;
      const target = link.split('#')[0];
      if (!fs.existsSync(path.resolve(path.dirname(f), target))) broken.push(`${path.relative(root, f)} -> ${link}`);
    }
  }
  return broken;
}

function frontmatter(file) {
  const m = fs.readFileSync(file, 'utf8').match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  return Object.fromEntries(m[1].split('\n').map(l => l.match(/^(\w+):\s*(.*)$/)).filter(Boolean).map(x => [x[1], x[2]]));
}

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { encoding: 'utf8', ...opts });
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'anr-test-'));
try {
  for (const runtime of RUNTIMES) {
    for (const tier of TIERS) {
      for (const lang of LANGS) {
        const label = `${runtime}/${tier}/${lang}`;
        const dir = path.join(tmpRoot, `${runtime}-${tier}-${lang}`);
        console.log(`• ${label}`);

        const r = run('node', [BIN, 'init', dir, '--runtime', runtime, '--tier', tier, '--lang', lang]);
        check(r.status === 0, `${label}: init exited ${r.status}\n${r.stdout}${r.stderr}`);

        check(fs.existsSync(path.join(dir, ENTRY[runtime])), `${label}: missing entry ${ENTRY[runtime]}`);
        check(fs.existsSync(path.join(dir, 'anr.yaml')), `${label}: missing anr.yaml`);

        const agents = path.join(dir, 'AGENTS.md');
        check(fs.statSync(agents).size <= 2048, `${label}: AGENTS.md exceeds 2 KB router budget`);
        if (lang === 'zh-CN') check(/[一-鿿]/.test(fs.readFileSync(agents, 'utf8')), `${label}: AGENTS.md is not the zh-CN variant`);
        if (lang === 'ja') check(/[ぁ-んァ-ヶ]/.test(fs.readFileSync(path.join(dir, 'MANUAL_TASKS.md'), 'utf8')), `${label}: MANUAL_TASKS.md is not the ja variant`);

        const variants = walk(dir).filter(f => /\.(zh-CN|ja)\.[^.]+$/.test(f));
        check(variants.length === 0, `${label}: leftover language variants: ${variants.map(f => path.relative(dir, f)).join(', ')}`);

        const broken = brokenLinks(dir);
        check(broken.length === 0, `${label}: broken links:\n    ${broken.join('\n    ')}`);

        const skillsDir = path.join(dir, '.agents', 'skills');
        check(fs.existsSync(path.join(skillsDir, 'verify', 'SKILL.md')), `${label}: missing core skill 'verify'`);
        for (const name of fs.existsSync(skillsDir) ? fs.readdirSync(skillsDir) : []) {
          const fm = frontmatter(path.join(skillsDir, name, 'SKILL.md'));
          check(fm && fm.name === name && fm.description, `${label}: skill '${name}' has invalid frontmatter`);
        }
        if (tier !== 'light') {
          check(fs.readdirSync(skillsDir).length >= 5, `${label}: standard/full should ship the core skill set`);
        }

        if (SKILL_LINKS[runtime]) {
          const link = path.join(dir, SKILL_LINKS[runtime]);
          check(fs.existsSync(path.join(link, 'verify', 'SKILL.md')), `${label}: ${SKILL_LINKS[runtime]} does not resolve to the skills`);
          check(fs.lstatSync(link).isSymbolicLink(), `${label}: ${SKILL_LINKS[runtime]} should be a symlink, not a copy`);
        }

        if (runtime !== 'claude-code') {
          check(!fs.existsSync(path.join(dir, '.gemini', 'skills')) && !fs.existsSync(path.join(dir, '.claude', 'skills')),
            `${label}: runtimes that read .agents/skills/ natively must not get a duplicate skills directory`);
        }

        if (tier === 'full' && HOOK_CONFIGS[runtime]) {
          let hooks = null;
          try { hooks = JSON.parse(fs.readFileSync(path.join(dir, HOOK_CONFIGS[runtime]), 'utf8')).hooks; } catch { /* reported below */ }
          check(hooks, `${label}: ${HOOK_CONFIGS[runtime]} missing, invalid or without hooks`);
          const scripts = JSON.stringify(hooks || {}).match(/scripts\/[\w.-]+/g) || [];
          check(scripts.length > 0, `${label}: full tier should wire scripts/guard-paths.sh as a native pre-edit hook`);
          for (const s of scripts) check(fs.existsSync(path.join(dir, s)), `${label}: hook references missing ${s}`);
        }

        const settings = path.join(dir, '.claude', 'settings.json');
        if (runtime === 'claude-code' && tier !== 'light') {
          let parsed = null;
          try { parsed = JSON.parse(fs.readFileSync(settings, 'utf8')); } catch { /* reported below */ }
          check(parsed && parsed.permissions, `${label}: .claude/settings.json missing or invalid`);
          const hookCmds = JSON.stringify((parsed && parsed.hooks) || {}).match(/scripts\/[\w.-]+/g) || [];
          for (const s of hookCmds) check(fs.existsSync(path.join(dir, s)), `${label}: hook references missing ${s}`);
          if (tier === 'full') check(hookCmds.length > 0, `${label}: full tier should wire the guardrail hook`);
        }

        // Re-running init must be idempotent.
        const again = run('node', [BIN, 'init', dir, '--runtime', runtime, '--tier', tier, '--lang', lang]);
        check(again.status === 0, `${label}: second init should skip identical files (exit ${again.status})`);

        if (tier === 'full') {
          run('git', ['init', '-q'], { cwd: dir });
          run('git', ['add', '-A'], { cwd: dir });
          const fresh = run('bash', ['scripts/check-freshness.sh'], { cwd: dir });
          check(fresh.status === 0, `${label}: check-freshness.sh failed on a fresh scaffold\n${fresh.stdout}`);

          const guard = (file, create) => {
            const abs = path.join(dir, file);
            if (create) { fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, '-- x\n'); }
            return run('bash', ['scripts/guard-paths.sh'], {
              cwd: dir, env: { ...process.env, CLAUDE_PROJECT_DIR: dir },
              input: JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: abs } }),
            }).status;
          };
          check(guard('db/migrations/001_init.sql', true) === 2, `${label}: editing an existing migration must be blocked`);
          check(guard('db/migrations/002_new.sql', false) === 0, `${label}: creating a new migration must be allowed`);
          check(guard('.env', false) === 2, `${label}: .env must be read-only`);
          check(guard('src/app.ts', false) === 0, `${label}: ordinary files must not be blocked`);

          // Codex apply_patch: tool_input.command holds the patch text, paths are relative to cwd.
          const codexPatch = (body) => run('bash', ['scripts/guard-paths.sh'], {
            cwd: dir, env: { ...process.env, CLAUDE_PROJECT_DIR: '' },
            input: JSON.stringify({ tool_name: 'apply_patch', cwd: dir, tool_input: { command: `*** Begin Patch\n${body}\n*** End Patch` } }),
          }).status;
          check(codexPatch('*** Update File: db/migrations/001_init.sql\n@@\n-x\n+y') === 2, `${label}: apply_patch editing an existing migration must be blocked`);
          check(codexPatch('*** Delete File: db/migrations/001_init.sql') === 2, `${label}: apply_patch deleting a migration must be blocked`);
          check(codexPatch('*** Update File: db/migrations/001_init.sql\n*** Move to: db/old.sql') === 2, `${label}: apply_patch moving a migration must be blocked`);
          check(codexPatch('*** Add File: db/migrations/003_next.sql\n+-- y') === 0, `${label}: apply_patch adding a new migration must be allowed`);
          check(codexPatch('*** Update File: src/app.ts\n@@\n-a\n+b') === 0, `${label}: apply_patch on ordinary files must not be blocked`);

          // Cursor preToolUse: input.path
          const cursorGuard = (file, create) => {
            const abs = path.join(dir, file);
            if (create) { fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, '-- x\n'); }
            return run('bash', ['scripts/guard-paths.sh'], {
              cwd: dir, env: { ...process.env, CLAUDE_PROJECT_DIR: '' },
              input: JSON.stringify({ tool_name: 'Write', input: { path: abs } }),
            }).status;
          };
          check(cursorGuard('db/migrations/001_init.sql', true) === 2, `${label}: Cursor Write editing an existing migration must be blocked`);
          check(cursorGuard('db/migrations/002_new.sql', false) === 0, `${label}: Cursor Write creating a new migration must be allowed`);

          fs.writeFileSync(path.join(dir, 'docs', 'broken.md'), '[x](nope.md) /Users/someone/project/\n');
          const bad = run('bash', ['scripts/check-freshness.sh'], { cwd: dir });
          check(bad.status === 1, `${label}: check-freshness.sh must fail on broken links / absolute paths`);
        }
      }
    }
  }
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}

if (failures) {
  console.error(`\n❌ ${failures}/${checks} checks failed.`);
  process.exit(1);
}
console.log(`\n✅ All ${checks} checks passed.`);
