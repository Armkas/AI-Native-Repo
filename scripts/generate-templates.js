#!/usr/bin/env node
// Builds the 12 runtime × tier templates in cli/templates/ from template-source/.
//
// Both axes are layered, later layers overwrite earlier ones:
//   common/<layer>/          light = [light]            standard = [standard]            full = [standard, full]
//   runtimes/<rt>/<layer>/   light = [base]             standard = [base, standard]      full = [base, standard, full]
// A missing optional layer is skipped; a missing required layer is fatal.
const fs = require('fs');
const path = require('path');

const catalog = require('../spec/runtime-catalog.json');
const runtimes = Object.keys(catalog.runtimes);
const tiers = catalog.tiers;
const COMMON_LAYERS = catalog.common_layers;
const RUNTIME_LAYERS = catalog.runtime_layers;
const IGNORED = new Set(['.DS_Store', 'Thumbs.db']);


const srcDir = path.join(__dirname, '..', 'template-source');
// Target directory defaults to cli/templates, or can be passed as argument (e.g. for pure validation)
const outDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, '..', 'cli', 'templates');


function copyRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (IGNORED.has(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      fs.chmodSync(destPath, fs.statSync(srcPath).mode);
    }
  }
}

function copyLayer(src, dest, required) {
  if (!fs.existsSync(src)) {
    if (!required) return;
    console.error(`❌ FATAL: Required template source missing: ${src}`);
    process.exit(1);
  }
  copyRecursive(src, dest);
}

console.log("Generating 12 AI-Native Template combinations...");
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const runtime of runtimes) {
  for (const tier of tiers) {
    const targetDir = path.join(outDir, runtime, tier);
    console.log(` -> ${runtime} / ${tier}`);
    COMMON_LAYERS[tier].forEach((layer, i) =>
      copyLayer(path.join(srcDir, 'common', layer), targetDir, i === 0));
    RUNTIME_LAYERS[tier].forEach((layer, i) =>
      copyLayer(path.join(srcDir, 'runtimes', runtime, layer), targetDir, i === 0));
  }
}

console.log("Templates generated successfully in cli/templates/");
