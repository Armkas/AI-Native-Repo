#!/usr/bin/env node
// End-to-end tests: scaffold every runtime × tier × language into a temp dir and check that the
// result is a coherent AI-Native workspace (no broken links, valid skills, working guardrails).
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { parseSkillFrontmatter } = require('../src/yaml.js');

const BIN = path.join(__dirname, '..', 'bin', 'anr.js');
const catalog = require('../../spec/runtime-catalog.json');
const RUNTIMES = Object.keys(catalog.runtimes);
const TIERS = catalog.tiers;
const LANGS = catalog.languages;
const ENTRY = Object.fromEntries(Object.entries(catalog.runtimes).map(([k, v]) => [k, v.entrypoint]));
const SKILL_LINKS = Object.fromEntries(Object.entries(catalog.runtimes).filter(([k, v]) => v.skill_link).map(([k, v]) => [k, v.skill_link]));
const HOOK_CONFIGS = Object.fromEntries(Object.entries(catalog.runtimes).filter(([k, v]) => v.hook_config).map(([k, v]) => [k, v.hook_config]));


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

// Same fingerprint the CLI records in anr.yaml (template.managed_hashes).
function fileHash(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').slice(0, 16);
}

// OpenAI-style strict JSON Schema: every object lists all its properties as required and allows no others.
function strictSchemaProblems(node, at = '#') {
  if (!node || typeof node !== 'object') return [];
  const out = [];
  if (node.type === 'object' && node.properties) {
    const keys = Object.keys(node.properties).sort();
    if (node.additionalProperties !== false) out.push(`${at}: additionalProperties must be false`);
    if (JSON.stringify([...(node.required || [])].sort()) !== JSON.stringify(keys)) out.push(`${at}: required must list every property`);
  }
  for (const [k, v] of Object.entries(node)) {
    if (v && typeof v === 'object') out.push(...strictSchemaProblems(v, `${at}/${k}`));
  }
  return out;
}

const REVIEWER = {
  'claude-code': '.claude/agents/reviewer.md',
  'codex': '.codex/agents/reviewer.toml',
  'cursor': '.cursor/agents/reviewer.md',
  'gemini-cli': '.gemini/agents/reviewer.md',
};
const HAS_JQ = spawnSync('jq', ['--version']).status === 0;

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
        if (tier === 'light') {
          const router = fs.readFileSync(agents, 'utf8');
          check(/data|数据/.test(router) && /docs\//.test(router) && /memory|记忆/.test(router), `${label}: light AGENTS.md must state Rules 17 (external content is data) and 20 (knowledge in the repo)`);
        }
        // Rule 07: the human / agent boundary has exactly these three permission levels, in every tier and language.
        const manual = fs.readFileSync(path.join(dir, 'MANUAL_TASKS.md'), 'utf8');
        check(['[Autonomous]', '[Approval Required]', '[Manual Only]'].every(t => manual.includes(t)), `${label}: MANUAL_TASKS.md must define [Autonomous] / [Approval Required] / [Manual Only]`);
        for (const name of fs.existsSync(skillsDir) ? fs.readdirSync(skillsDir) : []) {
          const content = fs.readFileSync(path.join(skillsDir, name, 'SKILL.md'), 'utf8');
          const res = parseSkillFrontmatter(content, name);
          check(res.valid, `${label}: skill '${name}' violates Agent Skills standard: ${res.error}`);
        }
        if (tier !== 'light') {
          check(fs.readdirSync(skillsDir).length >= 5, `${label}: standard/full should ship the core skill set`);
          check(fs.existsSync(path.join(skillsDir, 'review', 'rubric.md')), `${label}: standard/full should ship the review skill with its rubric`);
          check(fs.existsSync(path.join(dir, 'docs', 'plans', 'plan-template.md')), `${label}: standard/full should ship the plan template`);
          check(/INV-\d+/.test(fs.readFileSync(path.join(dir, 'docs', 'invariants', 'business_invariants.md'), 'utf8')), `${label}: invariants need stable INV- IDs (Rule 10)`);
          check(fs.existsSync(path.join(dir, '.agents', 'tools.md')), `${label}: standard/full should ship the tool inventory (Rule 19)`);
          const schema = JSON.parse(fs.readFileSync(path.join(skillsDir, 'review', 'result.schema.json'), 'utf8'));
          const problems = strictSchemaProblems(schema);
          check(problems.length === 0, `${label}: review result.schema.json must be strict-mode compatible: ${problems.join('; ')}`);
          // Reviewer subagent: read-only wiring to the canonical review skill, never a second copy of it.
          const reviewer = path.join(dir, REVIEWER[runtime]);
          check(fs.existsSync(reviewer), `${label}: missing reviewer subagent ${REVIEWER[runtime]}`);
          if (fs.existsSync(reviewer)) {
            const text = fs.readFileSync(reviewer, 'utf8');
            check(/name\s*[:=]\s*"?reviewer"?/.test(text) && /description\s*[:=]/.test(text), `${label}: reviewer subagent needs name and description`);
            check(text.includes('.agents/skills/review/SKILL.md'), `${label}: reviewer subagent must route to the canonical review skill`);
            const readOnly = { 'claude-code': /^tools: Read, Grep, Glob$/m, 'codex': /^sandbox_mode = "read-only"$/m, 'cursor': /^readonly: true$/m, 'gemini-cli': /^tools:\n(  - (read_file|grep_search|glob|list_directory)\n)+---/m }[runtime];
            check(readOnly.test(text), `${label}: reviewer subagent must be read-only`);
          }
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
          const fresh = run('bash', ['scripts/check-freshness.sh', '--strict'], { cwd: dir });
          check(fresh.status === 0, `${label}: check-freshness.sh --strict (what CI runs) failed on a fresh scaffold\n${fresh.stdout}`);

          // Rule 19: no credentials in committed tool config; configured MCP servers must be inventoried.
          fs.writeFileSync(path.join(dir, '.mcp.json'), JSON.stringify({ mcpServers: { gh: { command: 'x', env: { T: 'ghp_' + 'a'.repeat(36) } } } }));
          check(run('bash', ['scripts/check-freshness.sh'], { cwd: dir }).status === 1, `${label}: check-freshness.sh must fail on a credential in .mcp.json`);
          fs.writeFileSync(path.join(dir, '.mcp.json'), JSON.stringify({ mcpServers: { 'risk-assessment-tool-server': { command: 'task-runner-mcp-server-v2' } } }));
          check(!run('bash', ['scripts/check-freshness.sh'], { cwd: dir }).stdout.includes('credential'), `${label}: names containing "sk-" (risk-, task-) must not be reported as credentials`);
          fs.writeFileSync(path.join(dir, '.mcp.json'), JSON.stringify({ mcpServers: { gh: { command: 'x', env: { T: '${GITHUB_TOKEN}' } } } }));
          const noInventory = run('bash', ['scripts/check-freshness.sh', '--strict'], { cwd: dir });
          check(noInventory.status === 1 && noInventory.stdout.includes('tools.md'), `${label}: an MCP server missing from .agents/tools.md must be flagged`);
          fs.rmSync(path.join(dir, '.mcp.json'));

          // Optional CI review: workflow wiring and the runtime-neutral recorder.
          const wf = path.join(dir, '.github', 'workflows', 'ai-review.yml');
          check(fs.existsSync(wf), `${label}: full tier should ship the opt-in ai-review workflow`);
          if (fs.existsSync(wf)) {
            const y = fs.readFileSync(wf, 'utf8');
            check(y.includes("contains(github.event.pull_request.labels.*.name, 'ai-review')"), `${label}: ai-review must be opt-in via the ai-review label`);
            // The PR body is attacker-controlled: it may only appear once, as an env value, never inside a run script.
            const bodyUses = y.split('\n').filter(l => l.includes('github.event.pull_request.body'));
            check(bodyUses.length === 1 && /^\s+PR_BODY: \$\{\{ github\.event\.pull_request\.body \}\}$/.test(bodyUses[0]), `${label}: PR body must reach the reviewer through env, not script interpolation`);
            check(/git checkout "\$AI_REVIEW_BASE" -- "\$p"/.test(y) && y.includes('.agents/skills/review .github/ai-review scripts/ai-review-record.sh'),
              `${label}: the reviewer's rubric, skill, prompt and recorder must come from the base branch (Rule 16)`);
            check((y.match(/continue-on-error: true/g) || []).length === 2 && y.includes('if-no-files-found: ignore'),
              `${label}: a failed reviewer run must not fail the pull request (record-only)`);
            if (runtime === 'claude-code') check(y.includes('--permission-mode dontAsk'), `${label}: headless Claude reviewer must run with --permission-mode dontAsk`);
            if (runtime === 'codex') check(y.includes(`jq 'del(."$schema", .title)'`), `${label}: Codex must receive the schema without metadata keywords`);
            // A headless run never shows the interactive trust dialogs (Rule 06): the reviewer loads no configuration
            // from the pull request it can avoid, and stays read-only on every runtime.
            if (runtime === 'claude-code') check(y.includes('claude --bare -p') && y.includes('--setting-sources user') && y.includes('--tools "Read,Grep,Glob"'),
              `${label}: headless Claude reviewer must run --bare, read no project settings and have only read tools`);
            if (runtime === 'codex') check(y.includes('uses: openai/codex-action@v1') && /^\s+sandbox: read-only$/m.test(y),
              `${label}: Codex reviewer must run through openai/codex-action (key proxy, Linux sandbox setup) in the read-only sandbox`);
            if (runtime === 'cursor') check(y.includes('agent -p') && /^\s+--trust \\$/m.test(y) && /^\s+--mode ask \\$/m.test(y) && !/^\s+(--force|-f|--yolo)\b/m.test(y),
              `${label}: headless Cursor reviewer must pass --trust (a CI checkout is never trusted) and --mode ask, never --force`);
            if (runtime === 'gemini-cli') check(y.includes('--approval-mode plan') && !/--yolo|auto_edit/.test(y), `${label}: headless Gemini reviewer must run in read-only plan mode`);
            for (const ref of ['.github/ai-review/prompt.md', 'scripts/ai-review-record.sh']) {
              check(y.includes(ref) && fs.existsSync(path.join(dir, ref)), `${label}: ai-review.yml references missing ${ref}`);
            }
            check(fs.readFileSync(path.join(dir, '.github', 'ai-review', 'prompt.md'), 'utf8').includes('.agents/skills/review/result.schema.json'), `${label}: the CI review prompt must name the result schema`);
          }
          if (HAS_JQ) {
            const sample = (v) => JSON.stringify({ criteria: [{ criterion: 'c', verdict: v, evidence: 'e' }],
              rubric: Object.fromEntries(['correctness', 'invariants', 'scope', 'tests', 'docs', 'safety'].map(k => [k, { verdict: 'PASS', evidence: '' }])), notes: '' });
            const record = (body) => {
              fs.writeFileSync(path.join(dir, 'review-out.json'), body);
              const r = run('bash', ['scripts/ai-review-record.sh', runtime, 'review-out.json', 'review-result.json'], { cwd: dir });
              const out = r.status === 0 ? JSON.parse(fs.readFileSync(path.join(dir, 'review-result.json'), 'utf8')) : null;
              return { status: r.status, out };
            };
            const pass = record(sample('PASS'));
            check(pass.status === 0 && pass.out.overall === 'PASS' && pass.out.meta.judge.runtime === runtime, `${label}: recorder must compute PASS and add meta`);
            check(record(sample('FAIL')).out.overall === 'FAIL', `${label}: any FAIL verdict must make overall FAIL`);
            check(record(sample('UNKNOWN')).out.overall === 'UNKNOWN', `${label}: UNKNOWN without FAIL must make overall UNKNOWN`);
            check(record('```json\n' + sample('PASS') + '\n```').status === 0, `${label}: recorder must accept fenced JSON`);
            check(record('{"criteria":[],"rubric":{},"notes":""}').status === 1, `${label}: recorder must reject output that does not match the schema`);
            for (const f of ['review-out.json', 'review-result.json']) fs.rmSync(path.join(dir, f), { force: true });
          }

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
          const cursorDelete = run('bash', ['scripts/guard-paths.sh'], {
            cwd: dir, env: { ...process.env, CLAUDE_PROJECT_DIR: '' },
            input: JSON.stringify({ tool_name: 'Delete', tool_input: { path: path.join(dir, 'db/migrations/001_init.sql') }, cwd: dir }),
          }).status;
          check(cursorDelete === 2, `${label}: Cursor Delete of an existing migration must be blocked`);
          if (runtime === 'cursor') {
            const matcher = JSON.parse(fs.readFileSync(path.join(dir, '.cursor', 'hooks.json'), 'utf8')).hooks.preToolUse[0].matcher;
            check(new RegExp(`^(?:${matcher})$`).test('Delete'), `${label}: Cursor preToolUse matcher must include Delete`);
          }

          // Behavioral eval grader: the shipped scenario fails on an untouched tree and passes once the contract changes.
          const scenario = 'evals/scenarios/api-add-optional-field.md';
          run('git', ['add', '-A'], { cwd: dir });
          run('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'scaffold'], { cwd: dir });
          check(run('bash', ['scripts/eval-check.sh', scenario], { cwd: dir }).status === 1, `${label}: eval-check.sh must fail when must_change is not met`);
          fs.appendFileSync(path.join(dir, 'docs', 'contracts', 'backend_rpc.md'), '\n<!-- avatarUrl -->\n');
          check(run('bash', ['scripts/eval-check.sh', scenario], { cwd: dir }).status === 0, `${label}: eval-check.sh must pass when the scenario is satisfied`);
          fs.appendFileSync(path.join(dir, scenario), '\n');
          check(run('bash', ['scripts/eval-check.sh', scenario], { cwd: dir }).status === 1, `${label}: eval-check.sh must fail when the agent edits evals/`);
          run('git', ['checkout', '-q', '--', '.'], { cwd: dir });

          // Test CI layer: guard-paths.sh ci <base-ref> prevents bypassing hooks via shell/git
          run('git', ['config', 'user.name', 'CI Test'], { cwd: dir });
          run('git', ['config', 'user.email', 'ci@example.com'], { cwd: dir });
          run('git', ['commit', '-m', 'base commit', '--allow-empty'], { cwd: dir });
          fs.writeFileSync(path.join(dir, '.env'), 'SECRET=test\n');
          run('git', ['add', '.env'], { cwd: dir });
          run('git', ['commit', '-m', 'add secret env'], { cwd: dir });
          const ciCheck = run('bash', ['scripts/guard-paths.sh', 'ci', 'HEAD~1'], { cwd: dir });
          check(ciCheck.status === 1, `${label}: guard-paths.sh ci must fail when protected paths are committed in git`);
          run('git', ['reset', '--hard', 'HEAD~1'], { cwd: dir });

          fs.writeFileSync(path.join(dir, 'docs', 'urls.md'), 'See [docs](https://example.com/a) and `https://<host>/cb`.\n');
          const urls = run('bash', ['scripts/check-freshness.sh'], { cwd: dir });
          check(urls.status === 0, `${label}: check-freshness.sh must not treat https:// URLs as absolute local paths\n${urls.stdout}`);
          fs.writeFileSync(path.join(dir, 'docs', 'win.md'), 'Built at C:\\Users\\me\\proj\n');
          const win = run('bash', ['scripts/check-freshness.sh'], { cwd: dir });
          check(win.status === 1, `${label}: check-freshness.sh must flag Windows drive paths`);
          fs.rmSync(path.join(dir, 'docs', 'win.md'));

          const longCompat = path.join(dir, '.agents', 'skills', 'compat-test', 'SKILL.md');
          fs.mkdirSync(path.dirname(longCompat), { recursive: true });
          fs.writeFileSync(longCompat, `---\nname: compat-test\ndescription: Test skill.\ncompatibility: ${'x'.repeat(501)}\n---\n`);
          check(run('bash', ['scripts/check-freshness.sh'], { cwd: dir }).status === 1, `${label}: check-freshness.sh must reject compatibility over 500 chars`);
          fs.rmSync(path.dirname(longCompat), { recursive: true });

          fs.writeFileSync(path.join(dir, 'docs', 'broken.md'), '[x](nope.md) /Users/someone/project/\n');
          const bad = run('bash', ['scripts/check-freshness.sh'], { cwd: dir });
          check(bad.status === 1, `${label}: check-freshness.sh must fail on broken links / absolute paths`);

        }
      }
    }
  }

  // --- CLI Command & Lifecycle Suite ---
  const cliTestDir = path.join(tmpRoot, 'cli-test-suite');
  fs.mkdirSync(cliTestDir, { recursive: true });

  // 0. Agent Skills frontmatter: optional `compatibility` is 1-500 chars when present (agentskills.io/specification)
  const fm = (extra) => `---\nname: demo\ndescription: Demo skill for tests.\n${extra}---\n# Demo\n`;
  check(parseSkillFrontmatter(fm(''), 'demo').valid, 'skill without compatibility must be valid');
  check(parseSkillFrontmatter(fm('compatibility: Requires git and jq\n'), 'demo').valid, 'skill with a short compatibility must be valid');
  check(!parseSkillFrontmatter(fm(`compatibility: ${'x'.repeat(501)}\n`), 'demo').valid, 'compatibility over 500 chars must be rejected');
  check(!parseSkillFrontmatter(fm('compatibility:\n'), 'demo').valid, 'an empty compatibility must be rejected');

  // 1. Version, List, Doctor
  const ver = run('node', [BIN, 'version']);
  check(ver.status === 0 && ver.stdout.includes('Standard Version: 2.0'), 'anr version should report standard 2.0');
  const lst = run('node', [BIN, 'list']);
  check(lst.status === 0 && lst.stdout.includes('claude-code') && lst.stdout.includes('standard'), 'anr list should show runtimes and tiers');
  const doc = run('node', [BIN, 'doctor'], { cwd: cliTestDir });
  check(doc.status === 0, 'anr doctor should exit 0');

  // 2. Dry Run: Must cause ZERO filesystem mutations
  const dryDir = path.join(cliTestDir, 'dry-run-target');
  fs.mkdirSync(dryDir, { recursive: true });
  const dry = run('node', [BIN, 'init', dryDir, '--runtime', 'cursor', '--tier', 'light', '--lang', 'en', '--dry-run']);
  check(dry.status === 0, 'init --dry-run should exit 0');
  check(fs.readdirSync(dryDir).length === 0, 'init --dry-run must write ZERO files to disk');

  // 3. Preflight Atomic Conflict: No partial writes when conflict exists
  const conflictDir = path.join(cliTestDir, 'conflict-target');
  fs.mkdirSync(conflictDir, { recursive: true });
  fs.writeFileSync(path.join(conflictDir, 'AGENTS.md'), '# Conflicting AGENTS file\n');
  const conflictRun = run('node', [BIN, 'init', conflictDir, '--runtime', 'cursor', '--tier', 'light', '--lang', 'en']);
  check(conflictRun.status === 2, 'init on conflicting target must exit with code 2');
  const filesAfterConflict = fs.readdirSync(conflictDir);
  check(filesAfterConflict.length === 1 && filesAfterConflict[0] === 'AGENTS.md',
    'init on conflict must abort cleanly without writing partial template files');

  // 4. Force Overwrite: Overwrites conflict cleanly
  const forceRun = run('node', [BIN, 'init', conflictDir, '--runtime', 'cursor', '--tier', 'light', '--lang', 'en', '--force']);
  check(forceRun.status === 0, 'init --force on conflicting target must succeed with exit 0');
  check(fs.readdirSync(conflictDir).length > 1, 'init --force should scaffold all files');

  // 5. Update / Sync Lifecycle: Updates infrastructure cleanly
  const updateDir = path.join(cliTestDir, 'update-target');
  fs.mkdirSync(updateDir, { recursive: true });
  run('node', [BIN, 'init', updateDir, '--runtime', 'claude-code', '--tier', 'standard', '--lang', 'en']);
  // Simulate an older template version
  const updateManifest = path.join(updateDir, 'anr.yaml');
  fs.writeFileSync(updateManifest, fs.readFileSync(updateManifest, 'utf8').replace(/template:\s*\n\s*version:\s*"[^"]+"/, 'template:\n  version: "1.0.0"'));

  
  // Dry run update: ensures zero mutations
  const updateDry = run('node', [BIN, 'update', updateDir, '--dry-run']);
  check(updateDry.status === 0, 'anr update --dry-run should exit 0');
  check(fs.readFileSync(updateManifest, 'utf8').includes('version: "1.0.0"'), 'update --dry-run must not modify manifest');

  // Real update: updates version and succeeds
  const updateReal = run('node', [BIN, 'update', updateDir]);
  check(updateReal.status === 0, 'anr update should exit 0');
  check(!fs.readFileSync(updateManifest, 'utf8').includes('version: "1.0.0"'), 'anr update should update template version');

  // 6. JSON Deep Merge: Verify user custom keys and permissions are preserved
  const claudeSettings = path.join(updateDir, '.claude', 'settings.json');
  const userSettings = JSON.parse(fs.readFileSync(claudeSettings, 'utf8'));
  userSettings.custom_user_key = 'user_value_preserved';
  userSettings.permissions = userSettings.permissions || {};
  userSettings.permissions.deny = userSettings.permissions.deny || [];
  userSettings.permissions.deny.push('Read(custom-secrets/**)');
  fs.writeFileSync(claudeSettings, JSON.stringify(userSettings, null, 2));

  // Run update again
  const mergeUpdate = run('node', [BIN, 'update', updateDir]);
  check(mergeUpdate.status === 0, 'anr update with custom JSON settings should exit 0');
  const afterMerge = JSON.parse(fs.readFileSync(claudeSettings, 'utf8'));
  check(afterMerge.custom_user_key === 'user_value_preserved', 'anr update must preserve user custom keys in JSON configs');
  check(afterMerge.permissions.deny.includes('Read(custom-secrets/**)'), 'anr update must preserve user custom permission rules');

  // 7. Manifest Corruption: Must abort cleanly with non-zero exit and no silent fallback
  const corruptDir = path.join(cliTestDir, 'corrupt-manifest-target');
  fs.mkdirSync(corruptDir, { recursive: true });
  fs.writeFileSync(path.join(corruptDir, 'anr.yaml'), 'schema_version: "99.0"\nrepository:\n  kind: "unknown-kind"\n');
  const corruptRun = run('node', [BIN, 'update', corruptDir]);
  check(corruptRun.status !== 0, 'anr update on invalid schema manifest must fail and exit non-zero');

  // 8. Doctor Command on Consumer Workspace
  const docConsumer = run('node', [BIN, 'doctor'], { cwd: updateDir });
  check(docConsumer.status === 0 && docConsumer.stdout.includes('Doctor inspection complete'), 'anr doctor should pass on initialized consumer repo');

  // 9. Obsolete File Detection and Prune Support
  const obsoleteDir = path.join(cliTestDir, 'obsolete-target');
  fs.mkdirSync(obsoleteDir, { recursive: true });
  run('node', [BIN, 'init', obsoleteDir, '--runtime', 'claude-code', '--tier', 'standard', '--lang', 'en']);
  fs.mkdirSync(path.join(obsoleteDir, 'scripts'), { recursive: true });
  const customScript = path.join(obsoleteDir, 'scripts', 'deprecated-tool.sh');
  fs.writeFileSync(customScript, '#!/bin/bash\necho "deprecated"\n');
  const obsoleteManifest = path.join(obsoleteDir, 'anr.yaml');
  let obsYaml = fs.readFileSync(obsoleteManifest, 'utf8');
  obsYaml = obsYaml.replace('managed_files:', 'managed_files:\n    - "scripts/deprecated-tool.sh"');
  // Recorded fingerprint = the file is still exactly what anr wrote, so --prune may delete it.
  obsYaml = obsYaml.replace('managed_hashes:', `managed_hashes:\n    scripts/deprecated-tool.sh: "${fileHash(customScript)}"`);
  fs.writeFileSync(obsoleteManifest, obsYaml);

  // Update without --prune: file must be detected as obsolete and preserved
  const updateNoPrune = run('node', [BIN, 'update', obsoleteDir]);
  check(updateNoPrune.status === 0, 'anr update with obsolete file should exit 0');
  check(updateNoPrune.stdout.includes('Obsolete'), 'anr update should detect obsolete file');
  check(fs.existsSync(customScript), 'anr update without --prune must not delete obsolete file');
  const manifestNoPrune = fs.readFileSync(obsoleteManifest, 'utf8');
  check(manifestNoPrune.includes('sync_status: "partial"'), 'update without prune should have sync_status: partial when obsolete files remain');
  check(manifestNoPrune.includes('scripts/deprecated-tool.sh'), 'obsolete file should be recorded in manifest obsolete_files');

  // Update with --prune: managed obsolete file should be safely deleted
  const updateWithPrune = run('node', [BIN, 'update', obsoleteDir, '--prune']);
  check(updateWithPrune.status === 0, 'anr update --prune should exit 0');
  check(!fs.existsSync(customScript), 'anr update --prune must remove managed obsolete file');
  const manifestWithPrune = fs.readFileSync(obsoleteManifest, 'utf8');
  check(manifestWithPrune.includes('sync_status: "synced"'), 'update with prune should transition sync_status to synced');
  check(!manifestWithPrune.includes('obsolete_files:'), 'obsolete_files should be cleaned up after prune');

  // 10. Malformed JSON Safety: Must abort and never overwrite invalid user config with template
  const invalidJsonDir = path.join(cliTestDir, 'invalid-json-target');
  fs.mkdirSync(invalidJsonDir, { recursive: true });
  run('node', [BIN, 'init', invalidJsonDir, '--runtime', 'claude-code', '--tier', 'standard', '--lang', 'en']);
  const corruptSettingsPath = path.join(invalidJsonDir, '.claude', 'settings.json');
  const badJsonContent = '{\n  "custom_key": "unclosed_string\n';
  fs.writeFileSync(corruptSettingsPath, badJsonContent);
  const badJsonRun = run('node', [BIN, 'update', invalidJsonDir]);
  check(badJsonRun.status !== 0, 'anr update on malformed user JSON config must fail and exit non-zero');
  check(fs.readFileSync(corruptSettingsPath, 'utf8') === badJsonContent, 'anr update must preserve malformed user config without overwriting');

  // 11. User-Owned Skill Directory Protection & Managed Copy Mirror Sync
  const mirrorDir = path.join(cliTestDir, 'mirror-target');
  fs.mkdirSync(mirrorDir, { recursive: true });
  run('node', [BIN, 'init', mirrorDir, '--runtime', 'claude-code', '--tier', 'standard', '--lang', 'en']);
  const claudeSkillsPath = path.join(mirrorDir, '.claude', 'skills');

  // 11a. User-owned directory protection: directory without ANR marker must NOT be deleted or overwritten
  fs.rmSync(claudeSkillsPath, { recursive: true, force: true });
  fs.mkdirSync(claudeSkillsPath, { recursive: true });
  const userSkillFile = path.join(claudeSkillsPath, 'my-user-skill', 'SKILL.md');
  fs.mkdirSync(path.dirname(userSkillFile), { recursive: true });
  fs.writeFileSync(userSkillFile, '# User Owned Skill\n');

  const userOwnedUpdate = run('node', [BIN, 'update', mirrorDir]);
  check(userOwnedUpdate.status === 0, 'anr update with user-owned skill directory should exit 0');
  check(fs.existsSync(userSkillFile), 'anr update must preserve user-owned skill directory without deleting or overwriting');

  // 11b. Managed copy mirror: directory WITH .anr-managed-mirror marker is safely synchronized
  fs.writeFileSync(path.join(claudeSkillsPath, '.anr-managed-mirror'), JSON.stringify({ managed_by: 'anr' }));
  const canonicalSkill = path.join(mirrorDir, '.agents', 'skills', 'test-sync', 'SKILL.md');
  fs.mkdirSync(path.dirname(canonicalSkill), { recursive: true });
  fs.writeFileSync(canonicalSkill, '---\nname: "test-sync"\ndescription: "A skill for testing mirror sync."\n---\n# Test\n');
  const mirrorUpdateRun = run('node', [BIN, 'update', mirrorDir]);
  check(mirrorUpdateRun.status === 0, 'anr update on concrete managed mirror directory should succeed');
  check(fs.existsSync(path.join(claudeSkillsPath, 'test-sync', 'SKILL.md')), 'anr update must synchronize concrete managed mirror directory from .agents/skills');

  // 12. Strict Manifest Schema Validation
  const strictTestDir = path.join(cliTestDir, 'strict-schema-target');
  fs.mkdirSync(strictTestDir, { recursive: true });
  run('node', [BIN, 'init', strictTestDir, '--runtime', 'claude-code', '--tier', 'standard', '--lang', 'en']);
  const strictManifestPath = path.join(strictTestDir, 'anr.yaml');
  const validManifestRaw = fs.readFileSync(strictManifestPath, 'utf8');

  // 12a. Missing required entrypoint key
  fs.writeFileSync(strictManifestPath, validManifestRaw.replace('canonical_intent: "docs/"', 'hello: "garbage"'));
  const test12a = run('node', [BIN, 'validate'], { cwd: strictTestDir });
  check(test12a.status !== 0, 'manifest with missing canonical_intent entrypoint must fail validation');

  // 12b. Absolute path in entrypoint
  fs.writeFileSync(strictManifestPath, validManifestRaw.replace('canonical_intent: "docs/"', 'canonical_intent: "/etc/shadow"'));
  const test12b = run('node', [BIN, 'validate'], { cwd: strictTestDir });
  check(test12b.status !== 0, 'manifest with absolute path in entrypoint must fail validation');

  // 12c. Invalid sync_status enum
  fs.writeFileSync(strictManifestPath, validManifestRaw.replace('sync_status: "synced"', 'sync_status: "unknown_status"'));
  const test12c = run('node', [BIN, 'validate'], { cwd: strictTestDir });
  check(test12c.status !== 0, 'manifest with invalid sync_status enum must fail validation');

  // 12d. Path traversal in managed_files
  fs.writeFileSync(strictManifestPath, validManifestRaw.replace('- "AGENTS.md"', '- "../../../etc/passwd"'));
  const test12d = run('node', [BIN, 'validate'], { cwd: strictTestDir });
  check(test12d.status !== 0, 'manifest with path traversal in managed_files must fail validation');

  // 13. Update must never silently overwrite a file the user edited (skills are meant to be customized)
  const editDir = path.join(cliTestDir, 'user-edit-target');
  fs.mkdirSync(editDir, { recursive: true });
  run('node', [BIN, 'init', editDir, '--runtime', 'claude-code', '--tier', 'standard', '--lang', 'en']);
  const editedSkill = path.join(editDir, '.agents', 'skills', 'verify', 'SKILL.md');
  fs.appendFileSync(editedSkill, '\n6. Project-specific step added by the user.\n');
  const editUpdate = run('node', [BIN, 'update', editDir]);
  check(editUpdate.status === 0, 'anr update with a user-edited skill should exit 0');
  check(fs.readFileSync(editedSkill, 'utf8').includes('Project-specific step'), 'anr update must preserve a user-edited skill without --force');
  check(fs.readFileSync(path.join(editDir, 'anr.yaml'), 'utf8').includes('sync_status: "partial"'), 'a preserved user edit must leave sync_status partial');
  const editForce = run('node', [BIN, 'update', editDir, '--force']);
  check(editForce.status === 0 && !fs.readFileSync(editedSkill, 'utf8').includes('Project-specific step'), 'anr update --force must replace a user-edited file');

  // 14. A pristine file from an older template is updated without --force
  const staleSkill = path.join(editDir, '.agents', 'skills', 'bug-fix', 'SKILL.md');
  fs.writeFileSync(staleSkill, '---\nname: bug-fix\ndescription: Older template wording.\n---\n# Old\n');
  const editManifest = path.join(editDir, 'anr.yaml');
  fs.writeFileSync(editManifest, fs.readFileSync(editManifest, 'utf8')
    .replace(/(\.agents\/skills\/bug-fix\/SKILL\.md: )"[0-9a-f]+"/, `$1"${fileHash(staleSkill)}"`));
  const staleUpdate = run('node', [BIN, 'update', editDir]);
  check(staleUpdate.status === 0 && !fs.readFileSync(staleSkill, 'utf8').includes('Older template wording'),
    'anr update must refresh a file that is unmodified since the previous template version');

  // 15. --prune must not delete obsolete files the user modified
  const modScript = path.join(obsoleteDir, 'scripts', 'modified-tool.sh');
  fs.writeFileSync(modScript, '#!/bin/bash\necho "original"\n');
  let modYaml = fs.readFileSync(obsoleteManifest, 'utf8')
    .replace('managed_files:', 'managed_files:\n    - "scripts/modified-tool.sh"')
    .replace('managed_hashes:', `managed_hashes:\n    scripts/modified-tool.sh: "${fileHash(modScript)}"`);
  fs.writeFileSync(obsoleteManifest, modYaml);
  fs.appendFileSync(modScript, 'echo "user change"\n');
  const pruneModified = run('node', [BIN, 'update', obsoleteDir, '--prune']);
  check(pruneModified.status === 0 && fs.existsSync(modScript), 'anr update --prune must preserve an obsolete file the user modified');

  // 16. Repeated updates must not duplicate hook entries in merged runtime configs
  const hookDir = path.join(cliTestDir, 'hook-dup-target');
  fs.mkdirSync(hookDir, { recursive: true });
  run('node', [BIN, 'init', hookDir, '--runtime', 'claude-code', '--tier', 'full', '--lang', 'en']);
  const hookSettings = path.join(hookDir, '.claude', 'settings.json');
  const hs = JSON.parse(fs.readFileSync(hookSettings, 'utf8'));
  hs.permissions.allow = ['Bash(npm test)'];
  fs.writeFileSync(hookSettings, JSON.stringify(hs, null, 2));
  for (let i = 0; i < 3; i++) run('node', [BIN, 'update', hookDir]);
  const afterHooks = JSON.parse(fs.readFileSync(hookSettings, 'utf8'));
  check(afterHooks.hooks.PreToolUse.length === 1, `repeated anr update must not duplicate hook entries (found ${afterHooks.hooks.PreToolUse.length})`);
  check(afterHooks.permissions.allow.includes('Bash(npm test)'), 'repeated anr update must keep user permissions');

  // 17. anr index: deterministic code index + --check for staleness
  const idxDir = path.join(cliTestDir, 'index-target');
  fs.mkdirSync(path.join(idxDir, 'src', 'features', 'billing', 'interface'), { recursive: true });
  fs.mkdirSync(path.join(idxDir, 'docs', 'invariants'), { recursive: true });
  fs.mkdirSync(path.join(idxDir, 'tests'), { recursive: true });
  fs.writeFileSync(path.join(idxDir, 'src', 'features', 'billing', 'interface', 'IBilling.ts'),
    'export interface IBilling { charge(): void }\nexport type Money = number;\nconst internal = 1;\n');
  fs.writeFileSync(path.join(idxDir, 'src', 'features', 'billing', 'Billing.ts'), 'export class Billing {}\n');
  fs.writeFileSync(path.join(idxDir, 'docs', 'invariants', 'rules.md'), '- **INV-001**: never charge twice\n- **INV-002**: refunds are logged\n');
  fs.writeFileSync(path.join(idxDir, 'tests', 'billing.test.ts'), "test('INV_001 charges once', () => {});\n");
  fs.mkdirSync(path.join(idxDir, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(idxDir, 'assets', 'diagram.png'), Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0]), Buffer.from('INV-002')]));
  const idx = run('node', [BIN, 'index', idxDir]);
  const idxFile = path.join(idxDir, '.agents', 'generated', 'code-index.md');
  check(idx.status === 0 && fs.existsSync(idxFile), 'anr index must write .agents/generated/code-index.md');
  const idxText = fs.existsSync(idxFile) ? fs.readFileSync(idxFile, 'utf8') : '';
  check(idxText.includes('`interface IBilling`') && idxText.includes('`type Money`') && !idxText.includes('internal'), 'anr index must list exported interface symbols only');
  check(idxText.includes('`src/features/billing/`'), 'anr index must list feature modules');
  check(/`INV-001` \| \[`tests\/billing\.test\.ts`\]/.test(idxText) && idxText.includes('`INV-002` | ⚠️ none yet'), 'anr index must report invariant coverage (ID or underscore form)');
  check(!idxText.includes('assets/diagram.png'), 'anr index must not scan binary files for invariant references');
  check(run('node', [BIN, 'index', idxDir, '--check']).status === 0, 'anr index --check must pass right after generation');
  fs.appendFileSync(path.join(idxDir, 'src', 'features', 'billing', 'interface', 'IBilling.ts'), 'export function refund() {}\n');
  check(run('node', [BIN, 'index', idxDir, '--check']).status === 1, 'anr index --check must fail when the index is stale');
  check(brokenLinks(path.join(idxDir, '.agents')).length === 0, 'links in the generated index must resolve');
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}

if (failures) {
  console.error(`\n❌ ${failures}/${checks} checks failed.`);
  process.exit(1);
}
console.log(`\n✅ All ${checks} checks passed.`);
