#!/usr/bin/env node
// End-to-end tests: scaffold every runtime × tier × language into a temp dir and check that the
// result is a coherent AI-Native workspace (no broken links, valid skills, working guardrails).
const fs = require('fs');
const os = require('os');
const path = require('path');
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
          const content = fs.readFileSync(path.join(skillsDir, name, 'SKILL.md'), 'utf8');
          const res = parseSkillFrontmatter(content, name);
          check(res.valid, `${label}: skill '${name}' violates Agent Skills standard: ${res.error}`);
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
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}

if (failures) {
  console.error(`\n❌ ${failures}/${checks} checks failed.`);
  process.exit(1);
}
console.log(`\n✅ All ${checks} checks passed.`);
