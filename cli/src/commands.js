const fs = require('fs');
const path = require('path');
const readline = require('readline');

const RUNTIMES = ['claude-code', 'codex', 'gemini-cli', 'cursor'];
const TIERS = ['light', 'standard', 'full'];
const LANGS = ['en', 'zh-CN', 'ja'];
// Runtimes that only read skills from their own directory get a link to the canonical .agents/skills/.
// Codex, Cursor and Gemini CLI discover .agents/skills/ natively; Claude Code reads only .claude/skills/.
const SKILL_LINKS = { 'claude-code': '.claude/skills' };
const RUNTIME_ENTRIES = {
  'claude-code': 'CLAUDE.md',
  'codex': 'AGENTS.md',
  'gemini-cli': 'GEMINI.md',
  'cursor': '.cursor/rules/core.mdc'
};
const VARIANT_RE = /^(.+)\.(zh-CN|ja)(\.[^.]+)$/;
const CLI_VERSION = require('../package.json').version;


// A simple CLI prompt helper
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
  console.log(`Standard Version: 2.0`);
}

function listCommand() {
  console.log("Available Agent Runtimes:");
  RUNTIMES.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
  console.log("\nAvailable Tiers (Complexity Profiles):");
  TIERS.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
}

function doctorCommand() {
  const cwd = process.cwd();
  console.log("Running AI-Native Repository Doctor on:", cwd);
  const hasMap = fs.existsSync(path.join(cwd, 'docs', 'PROJECT_MAP.md'));
  const hasManifest = fs.existsSync(path.join(cwd, 'anr.yaml'));
  const hasClaude = fs.existsSync(path.join(cwd, 'CLAUDE.md'));
  const hasCursor = fs.existsSync(path.join(cwd, '.cursor', 'rules'));
  const hasGemini = fs.existsSync(path.join(cwd, 'GEMINI.md'));
  const hasCodex = fs.existsSync(path.join(cwd, 'AGENTS.md'));

  if (!hasMap && !hasManifest && !hasClaude && !hasCursor && !hasGemini && !hasCodex) {
    console.log("❌ No AI-Native Repository infrastructure detected.");
    console.log("   Suggestion: run `anr init .` to get started.");
  } else {
    console.log("✅ Basic AI-Native structures detected.");
    if (hasManifest) console.log("   - Found anr.yaml manifest");
    if (hasMap) console.log("   - Found docs/PROJECT_MAP.md");
    if (hasClaude || hasCursor || hasGemini || hasCodex) {
      console.log("   - Found Agent Runtime entrypoints");
    }
  }
}

function validateCommand(args) {
  const isCI = args.includes('--ci');
  const cwd = process.cwd();
  
  // 1. Check if this is the Reference Repository via explicit machine-readable manifest (anr.yaml)
  const manifestPath = path.join(cwd, 'anr.yaml');
  let isReferenceRepo = false;
  if (fs.existsSync(manifestPath)) {
    try {
      const manifestText = fs.readFileSync(manifestPath, 'utf8');
      if (/kind:\s*["']?reference-repository["']?/.test(manifestText)) {
        isReferenceRepo = true;
      }
    } catch {}
  }

  const canonicalScript = path.join(cwd, 'scripts', 'validate.sh');
  if (isReferenceRepo && fs.existsSync(canonicalScript)) {
    if (!isCI) console.log("Running canonical reference validator (scripts/validate.sh)...");
    try {
      const { execSync } = require('child_process');
      execSync(`bash "${canonicalScript}"`, { stdio: 'inherit' });
      if (!isCI) console.log("\n🎉 VALIDATION PASSED!");
      process.exit(0);
    } catch (err) {
      if (!isCI) console.log(`\n❌ VALIDATION FAILED.`);
      process.exit(1);
    }
  }

  // 2. Otherwise (Consumer Repository), perform comprehensive AI-Native validation
  let fails = 0;
  if (!fs.existsSync(manifestPath)) {
    console.error("❌ FAIL: anr.yaml missing. Run `anr init .` to scaffold.");
    fails++;
  } else {
    if (!isCI) console.log("✅ PASS: anr.yaml exists.");
    try {
      const manifestText = fs.readFileSync(manifestPath, 'utf8');
      if (!/schema_version:\s*["']?2\.0["']?/.test(manifestText)) {
        console.error("❌ FAIL: anr.yaml missing schema_version: 2.0.");
        fails++;
      }
      if (!/runtime:\s*\n\s*name:/.test(manifestText) && !/runtime:/.test(manifestText)) {
        console.error("❌ FAIL: anr.yaml missing runtime declaration.");
        fails++;
      }
    } catch (e) {
      console.error("❌ FAIL: anr.yaml could not be read.");
      fails++;
    }
  }

  // Validate canonical router (AGENTS.md budget <= 2KB / 2048 bytes per Rule 01)
  const agentsPath = path.join(cwd, 'AGENTS.md');
  if (fs.existsSync(agentsPath)) {
    const size = fs.statSync(agentsPath).size;
    if (size > 2048) {
      console.error(`❌ FAIL: AGENTS.md is ${size} bytes (> 2048 bytes / 2 KB budget).`);
      fails++;
    } else {
      if (!isCI) console.log(`✅ PASS: AGENTS.md router is within 2 KB budget (${size} bytes).`);
    }
  }

  // Validate skills directory and frontmatter if present
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
          if (!/^---\n[\s\S]*?name:\s*.+[\s\S]*?description:\s*.+[\s\S]*?---/.test(content)) {
            console.error(`❌ FAIL: Skill '${s.name}/SKILL.md' missing valid name/description frontmatter.`);
            fails++;
          }
        }
      }
    } catch {}
  }

  const freshness = path.join(cwd, 'scripts', 'check-freshness.sh');
  if (fs.existsSync(freshness)) {
    try {
      require('child_process').execSync(`bash "${freshness}"`, { stdio: isCI ? 'pipe' : 'inherit' });
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
    if (!runtime) {
      console.log("❌ Invalid choice. Please select a number between 1 and 4.\n");
    }
  }

  while (!tier || !TIERS.includes(tier)) {
    console.log("Available Tiers:");
    TIERS.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
    let ans = await prompt("Select Tier (1-3): ");
    tier = TIERS[parseInt(ans) - 1];
    if (!tier) {
      console.log("❌ Invalid choice. Please select a number between 1 and 3.\n");
    }
  }

  console.log(`\nInitializing AI-Native Repository...`);
  console.log(`Target : ${targetDir}`);
  console.log(`Runtime: ${runtime}`);
  console.log(`Tier   : ${tier}`);
  console.log(`Lang   : ${lang}`);
  if (isDryRun) console.log(`[DRY RUN] No files will be written.\n`);

  const templateDir = path.join(__dirname, '..', 'templates', runtime, tier);
  
  if (!fs.existsSync(templateDir)) {
    console.error(`❌ Error: Template not found at ${templateDir}. This CLI distribution might be incomplete.`);
    process.exit(1);
  }

  // Preflight: Collect all file actions to prevent partial writes if conflicts exist
  const actions = collectFileActions(templateDir, targetDir, lang, isForce);

  // Check manifest
  const manifestPath = path.join(targetDir, 'anr.yaml');
  const manifestContent = generateManifest(runtime, tier, lang);
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

  // Detect conflicts
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

  // Execution Phase: Write files cleanly
  for (const act of actions) {
    if (act.type === 'SKIP') {
      console.log(`  Skip     : ${act.relPath} (${act.reason || 'identical'})`);
    } else if (act.type === 'OVERWRITE') {
      console.log(`  Overwrite: ${act.relPath}`);
      if (!isDryRun) {
        fs.mkdirSync(path.dirname(act.destPath), { recursive: true });
        if (act.srcContent !== undefined) {
          fs.writeFileSync(act.destPath, act.srcContent);
        } else {
          fs.copyFileSync(act.srcPath, act.destPath);
          fs.chmodSync(act.destPath, fs.statSync(act.srcPath).mode);
        }
      }
    } else if (act.type === 'CREATE') {
      console.log(`  Create   : ${act.relPath}`);
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

function generateManifest(runtime, tier, lang) {
  const runtimeEntry = RUNTIME_ENTRIES[runtime] || 'AGENTS.md';
  return [
    `schema_version: "2.0"`,
    `repository:`,
    `  kind: "consumer-repository"`,
    `  standard: "AI-Native Repository Standard"`,
    `runtime:`,
    `  name: "${runtime}"`,
    `tier: "${tier}"`,
    `language: "${lang}"`,
    `entrypoints:`,
    `  canonical_intent: "docs/"`,
    `  semantic_router: "AGENTS.md"`,
    `  runtime_entrypoint: "${runtimeEntry}"`,
    `  skills: ".agents/skills/"`,
    `template:`,
    `  version: "${CLI_VERSION}"`
  ].join('\n') + '\n';
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

    if (fs.existsSync(destPath)) {
      const srcContent = fs.readFileSync(srcPath, 'utf8');
      const destContent = fs.readFileSync(destPath, 'utf8');
      if (srcContent === destContent) {
        actions.push({ type: 'SKIP', srcPath, destPath, relPath, reason: 'identical' });
      } else {
        actions.push({ type: isForce ? 'OVERWRITE' : 'CONFLICT', srcPath, destPath, relPath });
      }
    } else {
      actions.push({ type: 'CREATE', srcPath, destPath, relPath });
    }
  }

  return actions;
}

function isSymlink(p) {
  try { return fs.lstatSync(p).isSymbolicLink(); } catch { return false; }
}

function linkSkills(targetDir, runtime, templateDir, isDryRun, isForce) {
  const linkRel = SKILL_LINKS[runtime];
  if (!linkRel || !fs.existsSync(path.join(templateDir, '.agents', 'skills'))) return;
  const linkPath = path.join(targetDir, linkRel);
  const canonical = path.join(targetDir, '.agents', 'skills');
  const relTarget = path.relative(path.dirname(linkPath), canonical);

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
    if (isForce) {
      console.log(`  Relink   : Replacing concrete directory ${linkRel} with symlink -> ${relTarget}`);
      if (!isDryRun) {
        fs.rmSync(linkPath, { recursive: true, force: true });
        fs.symlinkSync(relTarget, linkPath, 'dir');
      }
      return;
    } else {
      console.log(`  Warning  : ${linkRel} exists as a concrete directory instead of a symlink.`);
      console.log(`             To prevent copy drift, use --force to link to ${canonical}`);
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
    console.log(`  Note     : symlinks unavailable, copied instead — keep ${linkRel} in sync with .agents/skills/`);
  }
}

async function updateCommand(args) {
  let target = '.';
  let isDryRun = false;
  let isForce = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') isDryRun = true;
    else if (args[i] === '--force') isForce = true;
    else if (!args[i].startsWith('-')) target = args[i];
  }

  const targetDir = path.resolve(process.cwd(), target);
  const manifestPath = path.join(targetDir, 'anr.yaml');

  if (!fs.existsSync(manifestPath)) {
    console.error(`❌ Error: No anr.yaml manifest found at ${targetDir}`);
    console.error(`   Run 'anr init' to initialize an AI-Native repository first.`);
    process.exit(1);
  }

  const manifestText = fs.readFileSync(manifestPath, 'utf8');
  const runtimeMatch = manifestText.match(/runtime:\s*\n\s*name:\s*["']?([^"'\n]+)/) || manifestText.match(/name:\s*["']?([^"'\n]+)/);
  const tierMatch = manifestText.match(/tier:\s*["']?([^"'\n]+)/);
  const langMatch = manifestText.match(/language:\s*["']?([^"'\n]+)/);
  const versionMatch = manifestText.match(/version:\s*["']?([^"'\n]+)/);

  const runtime = runtimeMatch ? runtimeMatch[1].trim() : 'claude-code';
  const tier = tierMatch ? tierMatch[1].trim() : 'standard';
  const lang = langMatch ? langMatch[1].trim() : 'en';
  const currentVersion = versionMatch ? versionMatch[1].trim() : 'unknown';

  const templateDir = path.join(__dirname, '..', 'templates', runtime, tier);
  if (!fs.existsSync(templateDir)) {
    console.error(`❌ Error: Template for runtime '${runtime}' and tier '${tier}' not found at ${templateDir}.`);
    process.exit(1);
  }

  console.log(`\nUpdating AI-Native Repository...`);
  console.log(`Target   : ${targetDir}`);
  console.log(`Runtime  : ${runtime}`);
  console.log(`Tier     : ${tier}`);
  console.log(`Language : ${lang}`);
  console.log(`Version  : ${currentVersion} -> ${CLI_VERSION}`);
  if (isDryRun) console.log(`[DRY RUN] No files will be written.\n`);

  function isInfrastructure(relPath) {
    if (relPath.startsWith('.agents/skills/') ||
        relPath.startsWith('.claude/') ||
        relPath.startsWith('.cursor/hooks') ||
        relPath.startsWith('.codex/hooks') ||
        relPath.startsWith('.gemini/settings') ||
        relPath.startsWith('scripts/')) {
      return true;
    }
    return false;
  }

  const actions = collectFileActions(templateDir, targetDir, lang, isForce);
  let added = 0;
  let updated = 0;
  let skipped = 0;
  let review = 0;

  for (const act of actions) {
    if (act.type === 'SKIP') {
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
      added++;
    } else if (act.type === 'OVERWRITE' || act.type === 'CONFLICT') {
      if (isInfrastructure(act.relPath) || isForce) {
        console.log(`  ~ Update : ${act.relPath}`);
        if (!isDryRun) {
          fs.copyFileSync(act.srcPath, act.destPath);
          fs.chmodSync(act.destPath, fs.statSync(act.srcPath).mode);
        }
        updated++;
      } else {
        console.log(`  ! Review : ${act.relPath} (customized locally, preserved; use --force to overwrite)`);
        review++;
      }
    }
  }

  linkSkills(targetDir, runtime, templateDir, isDryRun, isForce);

  if (!isDryRun) {
    const updatedManifest = manifestText.replace(/version:\s*["']?[^"'\n]+["']?/, `version: "${CLI_VERSION}"`);
    fs.writeFileSync(manifestPath, updatedManifest);
    console.log(`  ~ Update : anr.yaml (template version -> ${CLI_VERSION})`);
  }

  console.log(`\nUpdate Summary:`);
  console.log(`  + Added   : ${added} files`);
  console.log(`  ~ Updated : ${updated} files`);
  console.log(`  = In Sync : ${skipped} files`);
  if (review > 0) {
    console.log(`  ! Review  : ${review} user-modified files preserved (use --force to overwrite)`);
  }
  if (!isDryRun) {
    console.log(`\n🎉 Repository updated to AI-Native Standard v2.0 (CLI v${CLI_VERSION})!`);
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

