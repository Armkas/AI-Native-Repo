// `anr index`: generates the machine-knowable half of the context index (philosophy §50–52).
// Humans keep `.agents/context-index.md` (meaning); this file keeps the facts a machine can read:
// public symbols of interface / contract directories, feature modules, and which files reference each
// invariant ID. Output is deterministic (sorted, no timestamps) so `--check` can detect a stale index.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const OUTPUT = path.join('.agents', 'generated', 'code-index.md');
const SKIP_DIRS = new Set(['node_modules', '.git', '.build', '.swiftpm', 'build', 'dist', 'DerivedData', 'Pods', '.venv', 'venv', 'target', 'vendor', '.next']);
const INTERFACE_DIR = /^(interface|interfaces|contract|contracts|protocol|protocols)$/i;
const FEATURE_DIR = /^features$/i;
const INVARIANT_ID = /INV-[A-Z0-9]+(?:-[0-9]+)?/g;
const MAX_SYMBOLS = 20;
// Invariant IDs are referenced from code, tests and config — never from images or models. Reading only these
// (and only files up to 1 MB) keeps `anr index` fast on large repositories.
const REF_EXTS = new Set(['.sql', '.sh', '.bash', '.rb', '.php', '.c', '.cc', '.cpp', '.h', '.hpp', '.m', '.mm', '.scala',
  '.vue', '.svelte', '.ex', '.exs', '.erl', '.clj', '.lua', '.feature', '.yaml', '.yml', '.json', '.toml', '.txt']);
const MAX_REF_BYTES = 1024 * 1024;

// One regex per language; capture group 1 = kind, group 2 = name (or reversed where noted).
const SYMBOLS = {
  swift: [/^\s*(?:public |open |internal |package )?(?:final )?(protocol|struct|class|enum|actor)\s+([A-Z]\w*)/gm],
  ts: [/^\s*export\s+(?:default\s+)?(?:declare\s+)?(?:abstract\s+)?(interface|type|class|function|const|enum)\s+([A-Za-z_$][\w$]*)/gm],
  py: [/^(class|def)\s+([A-Za-z]\w*)/gm],
  go: [/^type\s+([A-Z]\w*)\s+(interface|struct)\b/gm, /^(func)\s+(?:\([^)]*\)\s*)?([A-Z]\w*)/gm],
  kt: [/^\s*(?:public |internal )?(?:sealed |data |abstract |open |fun )?(interface|class|object)\s+([A-Z]\w*)/gm],
  java: [/^\s*public\s+(?:abstract\s+|final\s+|sealed\s+)?(interface|class|enum|record)\s+([A-Z]\w*)/gm],
  rs: [/^\s*pub\s+(trait|struct|enum|fn)\s+([A-Za-z_]\w*)/gm],
  dart: [/^\s*(?:abstract\s+(?:interface\s+)?|sealed\s+|final\s+|base\s+|interface\s+)?(class|mixin|enum)\s+([A-Z]\w*)/gm],
  cs: [/^\s*public\s+(?:sealed\s+|abstract\s+|static\s+|partial\s+)*(interface|class|record|struct|enum)\s+([A-Z]\w*)/gm],
};
const EXT_LANG = {
  '.swift': 'swift', '.ts': 'ts', '.tsx': 'ts', '.js': 'ts', '.jsx': 'ts', '.mjs': 'ts', '.cjs': 'ts',
  '.py': 'py', '.go': 'go', '.kt': 'kt', '.kts': 'kt', '.java': 'java', '.rs': 'rs', '.dart': 'dart', '.cs': 'cs',
};

function listFiles(root) {
  const git = spawnSync('git', ['-c', 'core.quotepath=off', 'ls-files', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' });
  let files;
  if (git.status === 0) {
    files = git.stdout.split('\n').filter(Boolean);
  } else {
    files = [];
    const walk = (dir) => {
      for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
        if (e.isSymbolicLink() || SKIP_DIRS.has(e.name)) continue;
        const rel = dir ? `${dir}/${e.name}` : e.name;
        if (e.isDirectory()) walk(rel); else files.push(rel);
      }
    };
    walk('');
  }
  return files
    .map(f => f.split(path.sep).join('/'))
    .filter(f => !f.split('/').some(seg => SKIP_DIRS.has(seg)))
    .filter(f => f !== OUTPUT.split(path.sep).join('/'))
    .filter(f => fs.existsSync(path.join(root, f)) && fs.statSync(path.join(root, f)).isFile())
    .sort();
}

function symbolsOf(text, lang) {
  const out = [];
  for (const re of SYMBOLS[lang]) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) {
      // Go's `type X interface` captures name first; normalise to "kind name".
      const [kind, name] = lang === 'go' && m[1] !== 'func' ? [m[2], m[1]] : [m[1], m[2]];
      out.push(`${kind} ${name}`);
    }
  }
  return [...new Set(out)];
}

function link(file) {
  // The index lives in .agents/generated/, two levels below the root.
  return `[\`${file}\`](../../${file.split('/').map(encodeURIComponent).join('/')})`;
}

function buildIndex(root) {
  const files = listFiles(root);
  const code = files.filter(f => EXT_LANG[path.extname(f)]);
  const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

  // 1. Interfaces / contracts
  const interfaces = code.filter(f => f.split('/').slice(0, -1).some(seg => INTERFACE_DIR.test(seg)));
  const ifaceRows = interfaces.map(f => {
    const syms = symbolsOf(read(f), EXT_LANG[path.extname(f)]);
    const shown = syms.slice(0, MAX_SYMBOLS).map(s => `\`${s}\``).join(', ');
    return `| ${link(f)} | ${shown || '—'}${syms.length > MAX_SYMBOLS ? ` (+${syms.length - MAX_SYMBOLS} more)` : ''} |`;
  });

  // 2. Feature modules: direct children of any `features/` directory
  const features = new Map();
  for (const f of code) {
    const parts = f.split('/');
    const i = parts.findIndex(seg => FEATURE_DIR.test(seg));
    if (i === -1 || i + 2 >= parts.length) continue;
    const key = parts.slice(0, i + 2).join('/');
    const entry = features.get(key) || { files: 0, interfaces: 0 };
    entry.files++;
    if (interfaces.includes(f)) entry.interfaces++;
    features.set(key, entry);
  }
  const featureRows = [...features.keys()].sort().map(k => {
    const e = features.get(k);
    return `| \`${k}/\` | ${e.files} | ${e.interfaces || '—'} |`;
  });

  // 3. Invariant coverage: IDs defined in docs/invariants/, referenced outside docs/ and Markdown
  const invDocs = files.filter(f => f.startsWith('docs/invariants/') && f.endsWith('.md'));
  const ids = [...new Set(invDocs.flatMap(f => read(f).match(INVARIANT_ID) || []))].sort();
  const refFiles = files.filter(f => {
    if (f.startsWith('docs/') || f.startsWith('.agents/')) return false;
    const ext = path.extname(f).toLowerCase();
    if (!EXT_LANG[ext] && !REF_EXTS.has(ext)) return false;
    return fs.statSync(path.join(root, f)).size <= MAX_REF_BYTES;
  });
  const refText = new Map();
  const textOf = (f) => {
    if (!refText.has(f)) {
      let t = '';
      try { t = fs.readFileSync(path.join(root, f), 'utf8'); } catch { /* binary or unreadable */ }
      refText.set(f, t.includes('\u0000') ? '' : t);
    }
    return refText.get(f);
  };
  const invRows = ids.map(id => {
    const variants = [id, id.replace(/-/g, '_')];
    const hits = refFiles.filter(f => { const t = textOf(f); return variants.some(v => t.includes(v)); });
    return `| \`${id}\` | ${hits.length ? hits.map(link).join('<br>') : '⚠️ none yet'} |`;
  });
  const covered = invRows.filter(r => !r.includes('none yet')).length;

  const lines = [
    '# Code Index (generated)',
    '',
    '> GENERATED by `anr index` — do not edit by hand. Re-run `npx ai-native-repo index` after changing',
    '> interfaces, features or invariant tests; `npx ai-native-repo index --check` fails when this file is stale.',
    '> Meaning and intent live in the human-written [context-index.md](../context-index.md) and `docs/`.',
    '',
    '## 1. Interfaces & contracts',
    '',
    'Public symbols declared in `Interface/`, `contracts/` and `protocols/` directories — read these before implementations.',
    '',
  ];
  if (ifaceRows.length) lines.push('| File | Symbols |', '| :--- | :--- |', ...ifaceRows);
  else lines.push('_No interface or contract directories found._');
  lines.push('', '## 2. Feature modules', '');
  if (featureRows.length) lines.push('| Feature | Source files | Interface files |', '| :--- | ---: | ---: |', ...featureRows);
  else lines.push('_No `features/` directories found._');
  lines.push('', '## 3. Invariant coverage', '');
  if (invRows.length) {
    lines.push(`${covered}/${invRows.length} invariant IDs are referenced outside \`docs/\` (usually by a test named after the ID).`, '');
    lines.push('| Invariant | Referenced by |', '| :--- | :--- |', ...invRows);
  } else {
    lines.push('_No `INV-` IDs found in `docs/invariants/`._');
  }
  lines.push('');
  // The index may sit in a repository without context-index.md (e.g. light tier): drop that link then.
  let text = lines.join('\n');
  if (!fs.existsSync(path.join(root, '.agents', 'context-index.md'))) {
    text = text.replace('the human-written [context-index.md](../context-index.md) and `docs/`', '`docs/`');
  }
  return text;
}

function indexCommand(args) {
  const isCheck = args.includes('--check');
  const target = args.find(a => !a.startsWith('-')) || '.';
  const root = path.resolve(process.cwd(), target);
  const outPath = path.join(root, OUTPUT);
  const content = buildIndex(root);

  if (isCheck) {
    const current = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : null;
    if (current === content) {
      console.log(`✅ ${OUTPUT} is up to date.`);
      process.exit(0);
    }
    console.error(current === null
      ? `❌ ${OUTPUT} is missing. Run 'npx ai-native-repo index' and commit the result.`
      : `❌ ${OUTPUT} is stale. Run 'npx ai-native-repo index' and commit the result.`);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, content);
  console.log(`✅ Wrote ${OUTPUT}`);
}

module.exports = { indexCommand, buildIndex, symbolsOf };
