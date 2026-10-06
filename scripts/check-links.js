#!/usr/bin/env node
// Link checker for the reference repository's own Markdown (spec/, READMEs, examples/, .agents/).
// Verifies that every relative link resolves and that every #anchor matches a heading in the target,
// using GitHub's heading-slug rules. Usage: node scripts/check-links.js <file-or-dir>...
const fs = require('fs');
const path = require('path');

const SKIP_DIRS = new Set(['node_modules', '.git', '.build', '.swiftpm']);

function walk(p) {
  const st = fs.lstatSync(p);
  if (st.isSymbolicLink()) return [];
  if (st.isFile()) return /\.(md|mdc)$/.test(p) ? [p] : [];
  return fs.readdirSync(p).filter(n => !SKIP_DIRS.has(n)).flatMap(n => walk(path.join(p, n)));
}

function stripCode(text) {
  return text.replace(/^\s*```[\s\S]*?^\s*```/gm, '').replace(/`[^`\n]*`/g, '');
}

// GitHub: lowercase, drop everything except letters, numbers, spaces, hyphens and underscores, spaces -> hyphens.
function slugs(file) {
  const seen = new Map();
  const out = new Set();
  const text = fs.readFileSync(file, 'utf8').replace(/^\s*```[\s\S]*?^\s*```/gm, '');
  for (const m of text.matchAll(/^#{1,6}\s+(.+?)\s*#*\s*$/gm)) {
    const base = m[1].replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*`]/g, '').toLowerCase()
      .replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-');
    const n = seen.get(base) || 0;
    seen.set(base, n + 1);
    out.add(n ? `${base}-${n}` : base);
  }
  return out;
}

const broken = [];
const files = process.argv.slice(2).flatMap(walk);
for (const f of files) {
  for (const m of stripCode(fs.readFileSync(f, 'utf8')).matchAll(/\]\(([^)\s]+)\)/g)) {
    const link = m[1];
    if (/^(https?:|mailto:)/.test(link) || /[<\[]/.test(link)) continue;
    const [target, anchor] = link.split('#');
    const resolved = target ? path.resolve(path.dirname(f), decodeURI(target)) : f;
    if (!fs.existsSync(resolved)) { broken.push(`${f} -> ${link} (missing file)`); continue; }
    if (anchor && /\.md$/.test(resolved) && fs.statSync(resolved).isFile() && !slugs(resolved).has(decodeURI(anchor).toLowerCase())) {
      broken.push(`${f} -> ${link} (no such heading)`);
    }
  }
}
if (broken.length) {
  console.error(broken.map(b => `  ✗ ${b}`).join('\n'));
  console.error(`${broken.length} broken link(s) in ${files.length} files.`);
  process.exit(1);
}
console.log(`${files.length} files, all links resolve.`);
