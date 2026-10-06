const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');
const { parseYAML, stringifyYAML, validateManifest, parseSkillFrontmatter } = require('./yaml.js');

// Load canonical catalog as Single Source of Truth
const catalog = require('./runtime-catalog.json');
const RUNTIMES = Object.keys(catalog.runtimes);
const TIERS = catalog.tiers;
const LANGS = catalog.languages;
const CLI_VERSION = require('../package.json').version;
const VARIANT_RE = /^(.+)\.(zh-CN|ja)(\.[^.]+)$/;

// Content fingerprint recorded in anr.yaml (template.managed_hashes). A file whose current content still
// matches the recorded fingerprint is pristine template output and may be updated or pruned safely;
// anything else has been edited by the user and is never touched without --force.
function fileHash(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').slice(0, 16);
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function versionCommand() {
  console.log(`AI-Native Repository CLI version ${CLI_VERSION}`);
  console.log(`Standard Version: 2.0 (ANR 2.0 Final Specification)`);
}

function listCommand() {
  console.log("Available Agent Runtimes:");
  RUNTIMES.forEach((r, i) => {
    const meta = catalog.runtimes[r];
    console.log(`  ${i + 1}. ${r.padEnd(12)} - ${meta.name} (Entry: ${meta.entrypoint})`);
  });
  console.log("\nAvailable Tiers (Complexity Profiles):");
  TIERS.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
  console.log("\nSupported Languages:");
  LANGS.forEach((l, i) => console.log(`  ${i + 1}. ${l}`));
}

function doctorCommand() {
  const cwd = process.cwd();
  console.log("Running AI-Native Repository Doctor on:", cwd);
  console.log("──────────────────────────────────────────────────");

  const manifestPath = path.join(cwd, 'anr.yaml');
  if (!fs.existsSync(manifestPath)) {
    console.log("❌ No anr.yaml manifest found in current directory.");
    console.log("   Suggestion: run `anr init .` to scaffold an AI-Native repository.");
    return;
  }


  let manifestInfo;
  try {
    const raw = fs.readFileSync(manifestPath, 'utf8');
    const parsed = parseYAML(raw);
    manifestInfo = validateManifest(parsed, catalog);
    console.log(`✅ Manifest valid: ${parsed.repository.kind} (Schema: ${parsed.schema_version})`);
  } catch (err) {
    console.log(`❌ Invalid anr.yaml manifest: ${err.message}`);
    process.exit(1);
  }

  if (manifestInfo.kind === 'reference') {
    console.log("ℹ️  Repository Kind: Reference Repository");
    console.log("   - Canonical spec   :", fs.existsSync(path.join(cwd, 'spec')) ? "✓ spec/ exists" : "✗ missing");
    console.log("   - Template source  :", fs.existsSync(path.join(cwd, 'template-source')) ? "✓ template-source/ exists" : "✗ missing");
    console.log("   - CLI source       :", fs.existsSync(path.join(cwd, 'cli')) ? "✓ cli/ exists" : "✗ missing");
    console.log("Doctor check passed for Reference Repository.");
    return;
  }

  // Consumer Diagnostics
  console.log(`ℹ️  Runtime: ${manifestInfo.runtime} | Tier: ${manifestInfo.tier} | Lang: ${manifestInfo.language}`);
  console.log(`ℹ️  Template Version: ${manifestInfo.version} (Sync Status: ${manifestInfo.syncStatus})`);
  if (manifestInfo.obsoleteFiles && manifestInfo.obsoleteFiles.length > 0) {
    console.log(`  ⚠ Unpruned obsolete files: ${manifestInfo.obsoleteFiles.join(', ')} (run 'anr update --prune')`);
  }

  // Context Layer Checks
  const hasMap = fs.existsSync(path.join(cwd, 'docs', 'PROJECT_MAP.md'));
  const hasDomains = fs.existsSync(path.join(cwd, 'docs', 'domains'));
  const hasContracts = fs.existsSync(path.join(cwd, 'docs', 'contracts'));
  console.log("Context Architecture:");
  console.log(`  ${hasMap ? '✓' : '✗'} docs/PROJECT_MAP.md`);
  console.log(`  ${hasDomains ? '✓' : '✗'} docs/domains/`);
  console.log(`  ${hasContracts ? '✓' : '✗'} docs/contracts/`);

  // Router Check
  const agentsPath = path.join(cwd, 'AGENTS.md');
  if (fs.existsSync(agentsPath)) {
    const size = fs.statSync(agentsPath).size;
    if (size <= 2048) {
      console.log(`  ✓ AGENTS.md router within <= 2048-byte budget (${size} bytes)`);
    } else {
      console.log(`  ✗ AGENTS.md router exceeds 2048-byte budget (${size} bytes)`);
    }
  } else {
    console.log("  ✗ AGENTS.md missing");
  }

  // Skills Check against Agent Skills Open Standard
  const skillsDir = path.join(cwd, '.agents', 'skills');
  if (fs.existsSync(skillsDir)) {
    const skills = fs.readdirSync(skillsDir, { withFileTypes: true }).filter(d => d.isDirectory());
    console.log(`Skills (${skills.length} detected):`);
    for (const s of skills) {
      const skillFile = path.join(skillsDir, s.name, 'SKILL.md');
      if (!fs.existsSync(skillFile)) {
        console.log(`  ✗ ${s.name}: missing SKILL.md`);
        continue;
      }
      const content = fs.readFileSync(skillFile, 'utf8');
      const res = parseSkillFrontmatter(content, s.name);
      if (res.valid) {
        console.log(`  ✓ ${s.name} (valid Agent Skills standard)`);
      } else {
        console.log(`  ✗ ${s.name}: non-compliant frontmatter (${res.error})`);
      }
    }
  }

  // Symlinks & Mirrors Check
  const skillLinkRel = catalog.runtimes[manifestInfo.runtime].skill_link;
  if (skillLinkRel) {
    const linkPath = path.join(cwd, skillLinkRel);
    const markerPath = path.join(linkPath, '.anr-managed-mirror');
    if (isSymlink(linkPath)) {
      console.log(`  ✓ ${skillLinkRel} symlink healthy`);
    } else if (fs.existsSync(linkPath)) {
      if (fs.existsSync(markerPath) || manifestInfo.skillMirror === 'managed-copy') {
        console.log(`  ✓ ${skillLinkRel} managed copy mirror active (auto-synchronized on update)`);
      } else {
        console.log(`  ℹ ${skillLinkRel} is user-owned (preserved without ANR management)`);
      }
    } else {
      console.log(`  ✗ ${skillLinkRel} missing`);
    }
  }

  console.log("──────────────────────────────────────────────────");
  console.log("✅ Doctor inspection complete.");
}

function validateCommand(args) {
  const isCI = args.includes('--ci');
  const cwd = process.cwd();
  
  const manifestPath = path.join(cwd, 'anr.yaml');
  if (!fs.existsSync(manifestPath)) {
    console.error("❌ FAIL: anr.yaml missing. Run `anr init .` to scaffold.");
    process.exit(1);
  }

  let manifestObj;
  let validationResult;
  try {
    const raw = fs.readFileSync(manifestPath, 'utf8');
    manifestObj = parseYAML(raw);
    validationResult = validateManifest(manifestObj, catalog);
  } catch (err) {
    console.error(`❌ FAIL: Invalid anr.yaml manifest: ${err.message}`);
    process.exit(1);
  }

  // 1. Reference Repository
  if (validationResult.kind === 'reference') {
    const canonicalScript = path.join(cwd, 'scripts', 'validate.sh');
    if (fs.existsSync(canonicalScript)) {
      if (!isCI) console.log("Running canonical reference validator (scripts/validate.sh)...");
      try {
        const { execSync } = require('child_process');
        execSync(`bash "${canonicalScript}"`, { stdio: 'inherit' });
        process.exit(0);
      } catch (err) {
        process.exit(1);
      }
    }
  }

  // 2. Consumer Repository
  let fails = 0;
  if (!isCI) console.log("✅ PASS: anr.yaml schema is valid (ANR 2.0).");

  // Validate canonical router (AGENTS.md budget <= 2048 bytes per Rule 01)
  const agentsPath = path.join(cwd, 'AGENTS.md');
  if (fs.existsSync(agentsPath)) {
    const size = fs.statSync(agentsPath).size;
    if (size > 2048) {
      console.error(`❌ FAIL: AGENTS.md is ${size} bytes (> 2048 bytes budget per Rule 01).`);
      fails++;
    } else {
      if (!isCI) console.log(`✅ PASS: AGENTS.md router satisfies <= 2048 bytes budget (${size} bytes).`);
    }
  }

  // Validate skills against Agent Skills open standard
  const skillsDir = path.join(cwd, '.agents', 'skills');
  if (fs.existsSync(skillsDir)) {
    try {
      const skills = fs.readdirSync(skillsDir, { withFileTypes: true }).filter(d => d.isDirectory());
      for (const s of skills) {
        const skillFile = path.join(skillsDir, s.name, 'SKILL.md');
        if (!fs.existsSync(skillFile)) {
          console.error(`❌ FAIL: Skill '${s.name}' missing SKILL.md`);
          fails++;
        } else {
          const content = fs.readFileSync(skillFile, 'utf8');
          const res = parseSkillFrontmatter(content, s.name);
          if (!res.valid) {
            console.error(`❌ FAIL: Skill '${s.name}' violates Agent Skills standard: ${res.error}`);
            fails++;
          }
        }
      }
    } catch {}
  }

  const freshness = path.join(cwd, 'scripts', 'check-freshness.sh');
  if (fs.existsSync(freshness)) {
    try {
      require('child_process').execSync(`bash "${freshness}" --strict`, { stdio: isCI ? 'pipe' : 'inherit' });
    } catch (err) {
      if (isCI && err.stdout) process.stdout.write(err.stdout);
      fails++;
    }
  }

  if (fails > 0) {
    if (!isCI) console.log(`\n❌ VALIDATION FAILED with ${fails} errors.`);
    process.exit(1);
  } else {
    if (!isCI) console.log("\n🎉 VALIDATION PASSED! The project satisfies the AI-Native specification.");
    process.exit(0);
  }
}

async function initCommand(args) {
  let target = '.';
  let runtime = '';
  let tier = '';
  let lang = 'en';
  let isDryRun = false;
  let isForce = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--runtime') runtime = args[++i];
    else if (args[i] === '--tier') tier = args[++i];
    else if (args[i] === '--lang') lang = args[++i];
    else if (args[i] === '--dry-run') isDryRun = true;
    else if (args[i] === '--force') isForce = true;
    else if (!args[i].startsWith('-')) target = args[i];
  }

  const targetDir = path.resolve(process.cwd(), target);

  if (!LANGS.includes(lang)) {
    console.error(`❌ Unknown --lang '${lang}'. Available: ${LANGS.join(', ')}`);
    process.exit(1);
  }

  while (!runtime || !RUNTIMES.includes(runtime)) {
    console.log("Available Runtimes:");
    RUNTIMES.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
    let ans = await prompt("Select Runtime (1-4): ");
    runtime = RUNTIMES[parseInt(ans) - 1];
    if (!runtime) console.log("❌ Invalid choice. Please select a number between 1 and 4.\n");
  }

  while (!tier || !TIERS.includes(tier)) {
    console.log("Available Tiers:");
    TIERS.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
    let ans = await prompt("Select Tier (1-3): ");
    tier = TIERS[parseInt(ans) - 1];
    if (!tier) console.log("❌ Invalid choice. Please select a number between 1 and 3.\n");
  }

  console.log(`\nInitializing AI-Native Repository...`);
  console.log(`Target : ${targetDir}`);
  console.log(`Runtime: ${runtime}`);
  console.log(`Tier   : ${tier}`);
  console.log(`Lang   : ${lang}`);
  if (isDryRun) console.log(`[DRY RUN] No files will be written.\n`);

  const templateDir = path.join(__dirname, '..', 'templates', runtime, tier);
  if (!fs.existsSync(templateDir)) {
    console.error(`❌ Error: Template not found at ${templateDir}.`);
    process.exit(1);
  }

  // Preflight: Collect all file actions to prevent partial writes
  const actions = collectFileActions(templateDir, targetDir, lang, isForce);
  const managedHashes = Object.fromEntries(actions.map(a => [a.relPath, a.hash]));

  // Manifest action
  const manifestPath = path.join(targetDir, 'anr.yaml');
  const manifestContent = generateConsumerManifest(runtime, tier, lang, managedHashes);
  if (fs.existsSync(manifestPath)) {
    const existing = fs.readFileSync(manifestPath, 'utf8');
    if (existing === manifestContent) {
      actions.push({ type: 'SKIP', relPath: 'anr.yaml', reason: 'identical' });
    } else {
      actions.push({
        type: isForce ? 'OVERWRITE' : 'CONFLICT',
        relPath: 'anr.yaml',
        srcContent: manifestContent,
        destPath: manifestPath
      });
    }
  } else {
    actions.push({
      type: 'CREATE',
      relPath: 'anr.yaml',
      srcContent: manifestContent,
      destPath: manifestPath
    });
  }

  // Abort on conflicts
  const conflicts = actions.filter(a => a.type === 'CONFLICT');
  if (conflicts.length > 0) {
    console.error(`\n❌ Initialization aborted: ${conflicts.length} conflicting files already exist with different content:`);
    conflicts.forEach(c => console.error(`  ! ${c.relPath}`));
    console.error(`\nNo files were written to prevent a partial state.`);
    console.error(`Options:`);
    console.error(`  - Pass --force to overwrite existing files`);
    console.error(`  - Run 'anr update' to upgrade an existing AI-Native repository`);
    process.exit(2);
  }

  // Execution Phase
  for (const act of actions) {
    if (act.type === 'SKIP') {
      console.log(`  Skip     : ${act.relPath} (${act.reason || 'identical'})`);
    } else if (act.type === 'OVERWRITE' || act.type === 'CREATE') {
      const verb = act.type === 'OVERWRITE' ? 'Overwrite' : 'Create   ';
      console.log(`  ${verb}: ${act.relPath}`);
      if (!isDryRun) {
        fs.mkdirSync(path.dirname(act.destPath), { recursive: true });
        if (act.srcContent !== undefined) {
          fs.writeFileSync(act.destPath, act.srcContent);
        } else {
          fs.copyFileSync(act.srcPath, act.destPath);
          fs.chmodSync(act.destPath, fs.statSync(act.srcPath).mode);
        }
      }
    }
  }

  linkSkills(targetDir, runtime, templateDir, isDryRun, isForce);

  if (!isDryRun) {
    console.log(`\n✅ Success! Your repository is now an AI-Native workspace.`);
  }
}

function generateConsumerManifest(runtime, tier, lang, managedHashes = {}) {
  const managedFiles = Object.keys(managedHashes);
  const runtimeEntry = catalog.runtimes[runtime].entrypoint || 'AGENTS.md';
  const manifestObj = {
    schema_version: '2.0',
    repository: {
      kind: 'consumer-repository',
      standard: 'AI-Native Repository Standard'
    },
    runtime: {
      name: runtime,
      tier: tier,
      language: lang
    },
    entrypoints: {
      canonical_intent: 'docs/',
      semantic_router: 'AGENTS.md',
      runtime_entrypoint: runtimeEntry,
      skills: '.agents/skills/'
    },
    template: {
      version: CLI_VERSION,
      sync_status: 'synced',
      managed_files: managedFiles.length > 0 ? managedFiles : undefined,
      managed_hashes: managedFiles.length > 0 ? managedHashes : undefined
    }
  };
  return stringifyYAML(manifestObj);
}

function planLanguageFiles(srcDir, lang) {
  const out = new Map();
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (entry.isDirectory()) continue;
    const m = entry.name.match(VARIANT_RE);
    if (m) {
      if (m[2] === lang) out.set(m[1] + m[3], entry.name);
    } else if (!out.has(entry.name)) {
      out.set(entry.name, entry.name);
    }
  }
  return out;
}

function collectFileActions(srcDir, destDir, lang, isForce, relBase = '') {
  const actions = [];
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      actions.push(...collectFileActions(
        path.join(srcDir, entry.name),
        path.join(destDir, entry.name),
        lang,
        isForce,
        path.join(relBase, entry.name)
      ));
    }
  }

  for (const [outName, srcName] of planLanguageFiles(srcDir, lang)) {
    const srcPath = path.join(srcDir, srcName);
    const destPath = path.join(destDir, outName);
    const relPath = path.join(relBase, outName);
    const hash = fileHash(srcPath);

    if (fs.existsSync(destPath)) {
      if (fileHash(destPath) === hash) {
        actions.push({ type: 'SKIP', srcPath, destPath, relPath, hash, reason: 'identical' });
      } else {
        actions.push({ type: isForce ? 'OVERWRITE' : 'CONFLICT', srcPath, destPath, relPath, hash });
      }
    } else {
      actions.push({ type: 'CREATE', srcPath, destPath, relPath, hash });
    }
  }

  return actions;
}

function isSymlink(p) {
  try { return fs.lstatSync(p).isSymbolicLink(); } catch { return false; }
}

function linkSkills(targetDir, runtime, templateDir, isDryRun, isForce) {
  const linkRel = catalog.runtimes[runtime].skill_link;
  if (!linkRel || !fs.existsSync(path.join(templateDir, '.agents', 'skills'))) return;
  const linkPath = path.join(targetDir, linkRel);
  const canonical = path.join(targetDir, '.agents', 'skills');
  const relTarget = path.relative(path.dirname(linkPath), canonical);
  const markerPath = path.join(linkPath, '.anr-managed-mirror');

  if (isSymlink(linkPath)) {
    try {
      const currentTarget = fs.readlinkSync(linkPath);
      if (currentTarget === relTarget) {
        console.log(`  Skip     : ${linkRel} (already correctly linked)`);
        return;
      } else {
        console.log(`  Relink   : ${linkRel} was pointing to '${currentTarget}', fixing to '${relTarget}'`);
        if (!isDryRun) {
          fs.unlinkSync(linkPath);
          fs.symlinkSync(relTarget, linkPath, 'dir');
        }
        return;
      }
    } catch (err) {
      if (!isDryRun) {
        try { fs.unlinkSync(linkPath); } catch {}
      }
    }
  } else if (fs.existsSync(linkPath)) {
    const isManagedMirror = fs.existsSync(markerPath);
    if (isForce) {
      console.log(`  Relink   : Replacing concrete directory ${linkRel} with symlink -> ${relTarget} (--force)`);
      if (!isDryRun) {
        fs.rmSync(linkPath, { recursive: true, force: true });
        try {
          fs.symlinkSync(relTarget, linkPath, 'dir');
          return;
        } catch (err) {
          fs.cpSync(canonical, linkPath, { recursive: true });
          fs.writeFileSync(markerPath, JSON.stringify({ managed_by: 'anr', source: '.agents/skills', updated_at: new Date().toISOString() }, null, 2));
          console.log(`  Note     : symlinks unavailable, refreshed managed copy mirror at ${linkRel}`);
          return;
        }
      }
      return;
    } else if (isManagedMirror) {
      console.log(`  Sync     : Synchronizing managed copy mirror ${linkRel} from ${canonical}`);
      if (!isDryRun) {
        fs.rmSync(linkPath, { recursive: true, force: true });
        fs.cpSync(canonical, linkPath, { recursive: true });
        fs.writeFileSync(markerPath, JSON.stringify({ managed_by: 'anr', source: '.agents/skills', updated_at: new Date().toISOString() }, null, 2));
      }
      return;
    } else {
      console.log(`  Preserve : ${linkRel} is user-owned (existing directory without ANR marker).`);
      console.log(`             Preserving custom contents; ANR will not overwrite. Pass --force to replace.`);
      return;
    }
  }

  console.log(`  Link     : ${linkRel} -> ${relTarget}`);
  if (isDryRun) return;
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  try {
    fs.symlinkSync(relTarget, linkPath, 'dir');
  } catch (err) {
    fs.cpSync(canonical, linkPath, { recursive: true });
    fs.writeFileSync(markerPath, JSON.stringify({ managed_by: 'anr', source: '.agents/skills', created_at: new Date().toISOString() }, null, 2));
    console.log(`  Note     : symlinks unavailable, created managed copy mirror at ${linkRel}`);
  }
}

// Deep merges JSON runtime configurations (Claude settings, Cursor hooks, etc.)
function mergeJsonConfigs(existingPath, templatePath) {
  let existing, template;
  try {
    existing = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
  } catch (err) {
    throw new Error(`Failed to parse existing JSON config at '${existingPath}': ${err.message}`);
  }
  try {
    template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  } catch (err) {
    throw new Error(`Failed to parse template JSON config at '${templatePath}': ${err.message}`);
  }

  const merged = { ...existing };

  if (template.permissions && typeof template.permissions === 'object') {
    merged.permissions = merged.permissions || {};
    for (const [k, v] of Object.entries(template.permissions)) {
      if (Array.isArray(v)) {
        const userArr = Array.isArray(merged.permissions[k]) ? merged.permissions[k] : [];
        merged.permissions[k] = Array.from(new Set([...userArr, ...v]));
      } else {
        merged.permissions[k] = merged.permissions[k] || v;
      }
    }
  }

  if (template.hooks) {
    if (Array.isArray(template.hooks)) {
      merged.hooks = Array.isArray(merged.hooks) ? merged.hooks : [];
      for (const th of template.hooks) {
        const exists = merged.hooks.some(h => JSON.stringify(h) === JSON.stringify(th));
        if (!exists) merged.hooks.push(th);
      }
    } else if (typeof template.hooks === 'object') {
      merged.hooks = merged.hooks || {};
      for (const [k, v] of Object.entries(template.hooks)) {
        if (!merged.hooks[k]) {
          merged.hooks[k] = v;
        } else if (Array.isArray(v) && Array.isArray(merged.hooks[k])) {
          // Hook entries are objects: compare by value, or every update would append another copy.
          const present = new Set(merged.hooks[k].map(h => JSON.stringify(h)));
          merged.hooks[k] = [...merged.hooks[k], ...v.filter(h => !present.has(JSON.stringify(h)))];
        }
      }
    }
  }

  return JSON.stringify(merged, null, 2) + '\n';
}

// Runtime JSON configs are merged key by key. Every other file is judged by its content fingerprint.
function isMergeJson(relPath) {
  return relPath === '.claude/settings.json' ||
    relPath === '.cursor/hooks.json' ||
    relPath === '.codex/hooks.json' ||
    relPath === '.gemini/settings.json';
}

async function updateCommand(args) {
  let target = '.';
  let isDryRun = false;
  let isForce = false;
  let isPrune = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') isDryRun = true;
    else if (args[i] === '--force') isForce = true;
    else if (args[i] === '--prune') isPrune = true;
    else if (!args[i].startsWith('-')) target = args[i];
  }

  const targetDir = path.resolve(process.cwd(), target);
  const manifestPath = path.join(targetDir, 'anr.yaml');

  if (!fs.existsSync(manifestPath)) {
    console.error(`❌ Error: No anr.yaml manifest found at ${targetDir}`);
    console.error(`   Run 'anr init' to initialize an AI-Native repository first.`);
    process.exit(1);
  }

  let manifestObj;
  let info;
  try {
    const raw = fs.readFileSync(manifestPath, 'utf8');
    manifestObj = parseYAML(raw);
    info = validateManifest(manifestObj, catalog);
  } catch (err) {
    console.error(`❌ Error: Manifest validation failed: ${err.message}`);
    console.error(`   Refusing to perform update on corrupted manifest.`);
    process.exit(1);
  }

  const templateDir = path.join(__dirname, '..', 'templates', info.runtime, info.tier);
  if (!fs.existsSync(templateDir)) {
    console.error(`❌ Error: Template not found at ${templateDir}.`);
    process.exit(1);
  }

  console.log(`\nAI-Native Repository Ownership-Aware Update Engine`);
  console.log(`Target   : ${targetDir}`);
  console.log(`Runtime  : ${info.runtime} | Tier: ${info.tier} | Lang: ${info.language}`);
  console.log(`Version  : ${info.version} -> ${CLI_VERSION}`);
  if (isDryRun) console.log(`[DRY RUN] Transaction preview only — zero files written.\n`);

  const actions = collectFileActions(templateDir, targetDir, info.language, isForce);
  const newManagedSet = new Set(actions.map(a => a.relPath));

  // Obsolete detection: files previously managed that are no longer in the template
  const prevManagedFiles = (manifestObj.template && Array.isArray(manifestObj.template.managed_files))
    ? manifestObj.template.managed_files
    : [];
  const prevHashes = (manifestObj.template && manifestObj.template.managed_hashes &&
    typeof manifestObj.template.managed_hashes === 'object' && !Array.isArray(manifestObj.template.managed_hashes))
    ? manifestObj.template.managed_hashes
    : {};
  // Unmodified since anr last wrote it? Only then may the file be replaced or pruned without --force.
  const isPristine = rel => {
    const destPath = path.join(targetDir, rel);
    return typeof prevHashes[rel] === 'string' && fs.existsSync(destPath) && fileHash(destPath) === prevHashes[rel];
  };
  const newHashes = {};

  if (Object.keys(prevHashes).length === 0 && prevManagedFiles.length > 0) {
    console.log(`  Note     : anr.yaml has no file fingerprints (written by an older anr). Files that differ from`);
    console.log(`             the template are treated as user-modified and preserved; pass --force to replace them.`);
  }

  let obsoleteDetected = 0;
  let pruned = 0;

  for (const prevRel of prevManagedFiles) {
    if (!newManagedSet.has(prevRel)) {
      const destPath = path.join(targetDir, prevRel);
      if (fs.existsSync(destPath)) {
        obsoleteDetected++;
        if (isPrune) {
          if (isPristine(prevRel) || isForce) {
            console.log(`  - Prune  : ${prevRel} (obsolete in current template)`);
            if (!isDryRun) {
              fs.unlinkSync(destPath);
            }
            pruned++;
          } else {
            console.log(`  ! Obsolete (modified since install, preserved; pass --force to delete): ${prevRel}`);
          }
        } else {
          console.log(`  ⚠ Obsolete: ${prevRel} (no longer in template; pass --prune to clean up)`);
        }
      }
    }
  }

  let added = 0;
  let updated = 0;
  let merged = 0;
  let skipped = 0;
  let review = 0;

  for (const act of actions) {
    if (act.type === 'SKIP') {
      newHashes[act.relPath] = act.hash;
      skipped++;
      continue;
    }

    if (act.type === 'CREATE') {
      console.log(`  + Add    : ${act.relPath}`);
      if (!isDryRun) {
        fs.mkdirSync(path.dirname(act.destPath), { recursive: true });
        fs.copyFileSync(act.srcPath, act.destPath);
        fs.chmodSync(act.destPath, fs.statSync(act.srcPath).mode);
      }
      newHashes[act.relPath] = act.hash;
      added++;
    } else if (act.type === 'OVERWRITE' || act.type === 'CONFLICT') {
      if (isMergeJson(act.relPath)) {
        console.log(`  ~ Merge  : ${act.relPath} (preserving user custom rules & keys)`);
        if (!isDryRun) {
          try {
            const mergedContent = mergeJsonConfigs(act.destPath, act.srcPath);
            fs.writeFileSync(act.destPath, mergedContent);
          } catch (err) {
            console.error(`\n❌ Error merging '${act.relPath}': ${err.message}`);
            console.error(`   To protect your configuration, no files were modified.`);
            console.error(`   Please repair the JSON syntax in '${act.relPath}' and run 'anr update' again.`);
            process.exit(1);
          }
        }
        merged++;
      } else if (isPristine(act.relPath) || isForce) {
        console.log(`  ~ Update : ${act.relPath}`);
        if (!isDryRun) {
          fs.copyFileSync(act.srcPath, act.destPath);
          fs.chmodSync(act.destPath, fs.statSync(act.srcPath).mode);
        }
        newHashes[act.relPath] = act.hash;
        updated++;
      } else {
        console.log(`  ! Review : ${act.relPath} (modified since install, preserved; pass --force to overwrite)`);
        if (prevHashes[act.relPath]) newHashes[act.relPath] = prevHashes[act.relPath];
        review++;
      }
    }
  }

  linkSkills(targetDir, info.runtime, templateDir, isDryRun, isForce);

  const unprunedObsolete = prevManagedFiles.filter(f => !newManagedSet.has(f) && fs.existsSync(path.join(targetDir, f)));
  const isFullySynced = review === 0 && unprunedObsolete.length === 0;
  for (const f of unprunedObsolete) {
    if (prevHashes[f]) newHashes[f] = prevHashes[f];
  }

  // Update manifest version, managed files inventory, fingerprints and sync status
  if (!isDryRun) {
    manifestObj.template = manifestObj.template || {};
    manifestObj.template.managed_files = Array.from(new Set([...newManagedSet, ...unprunedObsolete]));
    manifestObj.template.managed_hashes = newHashes;
    if (isFullySynced) {
      manifestObj.template.version = CLI_VERSION;
      manifestObj.template.sync_status = 'synced';
      delete manifestObj.template.available_version;
      delete manifestObj.template.obsolete_files;
    } else {
      manifestObj.template.available_version = CLI_VERSION;
      manifestObj.template.sync_status = 'partial';
      if (unprunedObsolete.length > 0) {
        manifestObj.template.obsolete_files = unprunedObsolete;
      } else {
        delete manifestObj.template.obsolete_files;
      }
    }
    fs.writeFileSync(manifestPath, stringifyYAML(manifestObj));
  }

  console.log(`\nTransaction Summary:`);
  console.log(`  + Added   : ${added} files`);
  console.log(`  ~ Merged  : ${merged} JSON config files`);
  console.log(`  ~ Updated : ${updated} managed files`);
  console.log(`  = In Sync : ${skipped} files`);
  if (obsoleteDetected > 0) {
    if (isPrune) {
      console.log(`  - Pruned  : ${pruned} obsolete files`);
    } else {
      console.log(`  ⚠ Obsolete: ${obsoleteDetected} files detected (pass --prune to clean up)`);
    }
  }
  if (review > 0) {
    console.log(`  ! Review  : ${review} user-modified files preserved (sync status: partial)`);
  }
  if (!isDryRun) {
    console.log(`\n🎉 Repository sync complete (Template: ${isFullySynced ? CLI_VERSION : info.version}, Status: ${isFullySynced ? 'synced' : 'partial'}).`);
  }
}

module.exports = {
  versionCommand,
  listCommand,
  doctorCommand,
  validateCommand,
  initCommand,
  updateCommand
};
