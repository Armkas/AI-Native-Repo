const path = require('path');

// Lightweight ANR Manifest Parser & Validator for anr.yaml
// Supports standard ANR manifest subset: key-value maps, nested maps, block/flow sequences,
// quote-escaped strings, and multi-line values.

function stripComment(rawLine) {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < rawLine.length; i++) {
    const ch = rawLine[i];
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
    } else if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
    } else if (ch === '#' && !inSingle && !inDouble) {
      return rawLine.slice(0, i);
    }
  }
  return rawLine;
}

function parseYAML(text) {
  const lines = text.split('\n');
  const root = {};
  const stack = [{ indent: -1, obj: root, key: null }];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    // Strip comments, unless inside quotes
    let line = stripComment(rawLine).trimEnd();
    if (!line.trim()) continue;

    const indent = rawLine.search(/\S/);
    const trimmed = line.trim();

    // Pop stack to current indent level
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const currentContext = stack[stack.length - 1];

    // Array item: "- value"
    if (trimmed.startsWith('- ')) {
      const valStr = trimmed.slice(2).trim();
      const val = parseValue(valStr);
      if (!Array.isArray(currentContext.obj)) {
        if (currentContext.key && !Array.isArray(currentContext.parent[currentContext.key])) {
          currentContext.parent[currentContext.key] = [];
          currentContext.obj = currentContext.parent[currentContext.key];
        }
      }
      if (Array.isArray(currentContext.obj)) {
        currentContext.obj.push(val);
      }
      continue;
    }

    // Key-value or object header: "key: value" or "key:"
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) {
      throw new Error(`Invalid YAML at line ${i + 1}: '${trimmed}'`);
    }

    const key = trimmed.slice(0, colonIdx).trim();
    const rest = trimmed.slice(colonIdx + 1).trim();

    if (rest === '' || rest === '>' || rest === '|') {
      // Check if following lines are a block scalar (indented text under > or |)
      if (rest === '>' || rest === '|') {
        let blockLines = [];
        let j = i + 1;
        while (j < lines.length) {
          const nextRaw = lines[j];
          const nextIndent = nextRaw.search(/\S/);
          if (nextRaw.trim() === '') {
            blockLines.push('');
            j++;
            continue;
          }
          if (nextIndent <= indent) break;
          blockLines.push(stripComment(nextRaw).trim());
          j++;
        }
        const blockVal = rest === '>' ? blockLines.join(' ').trim() : blockLines.join('\n').trim();
        if (Array.isArray(currentContext.obj)) {
          currentContext.obj.push({ [key]: blockVal });
        } else {
          currentContext.obj[key] = blockVal;
        }
        i = j - 1;
        continue;
      }

      // Nested object or list follows
      // Look ahead to next non-empty line to check if it's an array
      let isNextArray = false;
      for (let j = i + 1; j < lines.length; j++) {
        const nextTrim = stripComment(lines[j]).trim();
        if (nextTrim) {
          if (nextTrim.startsWith('- ')) isNextArray = true;
          break;
        }
      }

      const newContainer = isNextArray ? [] : {};
      if (Array.isArray(currentContext.obj)) {
        currentContext.obj.push(newContainer);
      } else {
        currentContext.obj[key] = newContainer;
      }
      stack.push({ indent, obj: newContainer, parent: currentContext.obj, key });
    } else {
      const value = parseValue(rest);
      if (Array.isArray(currentContext.obj)) {
        currentContext.obj.push({ [key]: value });
      } else {
        currentContext.obj[key] = value;
      }
    }
  }

  return root;
}

function parseValue(valStr) {
  if (valStr === 'true') return true;
  if (valStr === 'false') return false;
  if (valStr === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(valStr)) return Number(valStr);
  if ((valStr.startsWith('"') && valStr.endsWith('"')) || (valStr.startsWith("'") && valStr.endsWith("'"))) {
    return valStr.slice(1, -1);
  }
  if (valStr.startsWith('[') && valStr.endsWith(']')) {
    const inner = valStr.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(',').map(item => parseValue(item.trim()));
  }
  return valStr;
}

function stringifyYAML(obj, indent = 0) {
  const pad = '  '.repeat(indent);
  let out = '';

  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined) {
      out += `${pad}${key}: null\n`;
    } else if (Array.isArray(val)) {
      out += `${pad}${key}:\n`;
      for (const item of val) {
        if (typeof item === 'object' && item !== null) {
          out += `${pad}  -\n${stringifyYAML(item, indent + 2)}`;
        } else {
          out += `${pad}  - ${formatScalar(item)}\n`;
        }
      }
    } else if (typeof val === 'object') {
      out += `${pad}${key}:\n${stringifyYAML(val, indent + 1)}`;
    } else {
      out += `${pad}${key}: ${formatScalar(val)}\n`;
    }
  }

  return out;
}

function formatScalar(v) {
  if (typeof v === 'string') {
    if (/^[a-zA-Z0-9_.-]+$/.test(v)) return `"${v}"`;
    return JSON.stringify(v);
  }
  return String(v);
}

function isSafeRelativePath(p) {
  if (typeof p !== 'string' || !p.trim()) return false;
  if (p.includes('\0')) return false;
  if (path.isAbsolute(p) || /^[a-zA-Z]:[/\\]/.test(p) || p.startsWith('/') || p.startsWith('\\')) return false;
  const parts = p.split(/[/\\]/);
  if (parts.some(seg => seg === '..')) return false;
  return true;
}

function validateManifest(manifest, catalog) {
  if (!manifest || typeof manifest !== 'object') {
    throw new Error('Manifest is not a valid object or empty.');
  }

  if (manifest.schema_version !== '2.0') {
    throw new Error(`Unsupported schema_version '${manifest.schema_version}'. Expected '2.0'.`);
  }

  if (!manifest.repository || typeof manifest.repository !== 'object') {
    throw new Error("Missing 'repository' declaration in manifest.");
  }

  const kind = manifest.repository.kind;
  if (kind !== 'reference-repository' && kind !== 'consumer-repository') {
    throw new Error(`Invalid repository.kind '${kind}'. Expected 'reference-repository' or 'consumer-repository'.`);
  }

  const runtimes = Object.keys(catalog.runtimes);
  const tiers = catalog.tiers;
  const langs = catalog.languages;

  if (kind === 'reference-repository') {
    if (!manifest.reference || typeof manifest.reference !== 'object') {
      throw new Error("Reference repository manifest missing 'reference' object.");
    }
    const { canonical_spec, template_source, cli_source } = manifest.reference;
    if (!isSafeRelativePath(canonical_spec)) {
      throw new Error(`Invalid or missing 'reference.canonical_spec': expected safe relative path, got '${canonical_spec}'.`);
    }
    if (!isSafeRelativePath(template_source)) {
      throw new Error(`Invalid or missing 'reference.template_source': expected safe relative path, got '${template_source}'.`);
    }
    if (!isSafeRelativePath(cli_source)) {
      throw new Error(`Invalid or missing 'reference.cli_source': expected safe relative path, got '${cli_source}'.`);
    }

    if (!manifest.runtime || !Array.isArray(manifest.runtime.supported) || manifest.runtime.supported.length === 0) {
      throw new Error("Reference repository manifest missing non-empty 'runtime.supported' list.");
    }
    for (const r of manifest.runtime.supported) {
      if (!runtimes.includes(r)) {
        throw new Error(`Unknown supported runtime '${r}'. Available: ${runtimes.join(', ')}`);
      }
    }
    if (!manifest.verification || typeof manifest.verification.command !== 'string' || !manifest.verification.command.trim()) {
      throw new Error("Reference repository manifest missing non-empty 'verification.command'.");
    }
    return { kind: 'reference' };
  }

  // Consumer Repository
  if (!manifest.runtime || typeof manifest.runtime !== 'object') {
    throw new Error("Consumer repository manifest missing 'runtime' object.");
  }
  const rName = manifest.runtime.name;
  if (!runtimes.includes(rName)) {
    throw new Error(`Unknown runtime.name '${rName}'. Available: ${runtimes.join(', ')}`);
  }
  const rTier = manifest.runtime.tier;
  if (!tiers.includes(rTier)) {
    throw new Error(`Unknown runtime.tier '${rTier}'. Available: ${tiers.join(', ')}`);
  }
  const rLang = manifest.runtime.language;
  if (!langs.includes(rLang)) {
    throw new Error(`Unknown runtime.language '${rLang}'. Available: ${langs.join(', ')}`);
  }

  // Strict entrypoints validation
  if (!manifest.entrypoints || typeof manifest.entrypoints !== 'object') {
    throw new Error("Consumer repository manifest missing 'entrypoints' declaration.");
  }
  const requiredEntrypoints = ['canonical_intent', 'semantic_router', 'runtime_entrypoint', 'skills'];
  for (const ep of requiredEntrypoints) {
    const val = manifest.entrypoints[ep];
    if (!isSafeRelativePath(val)) {
      throw new Error(`Invalid or missing 'entrypoints.${ep}': expected safe relative path, got '${val}'.`);
    }
  }

  // Strict template validation
  if (!manifest.template || typeof manifest.template !== 'object') {
    throw new Error("Consumer repository manifest missing 'template' declaration.");
  }
  if (typeof manifest.template.version !== 'string' || !manifest.template.version.trim()) {
    throw new Error(`Consumer repository manifest missing or invalid 'template.version' string (got '${manifest.template.version}').`);
  }

  if (manifest.template.sync_status !== undefined) {
    const validStatuses = ['synced', 'partial'];
    if (!validStatuses.includes(manifest.template.sync_status)) {
      throw new Error(`Invalid template.sync_status '${manifest.template.sync_status}'. Expected one of: ${validStatuses.join(', ')}.`);
    }
  }

  if (manifest.template.available_version !== undefined && typeof manifest.template.available_version !== 'string') {
    throw new Error(`Invalid template.available_version: expected string, got ${typeof manifest.template.available_version}.`);
  }

  if (manifest.template.skill_mirror !== undefined) {
    const validModes = ['symlink', 'managed-copy', 'user-owned'];
    if (!validModes.includes(manifest.template.skill_mirror)) {
      throw new Error(`Invalid template.skill_mirror '${manifest.template.skill_mirror}'. Expected one of: ${validModes.join(', ')}.`);
    }
  }

  if (manifest.template.obsolete_files !== undefined) {
    if (!Array.isArray(manifest.template.obsolete_files)) {
      throw new Error("Invalid 'template.obsolete_files': expected array of relative file paths.");
    }
    for (const f of manifest.template.obsolete_files) {
      if (!isSafeRelativePath(f)) {
        throw new Error(`Invalid path in 'template.obsolete_files': expected safe relative path, got '${f}'.`);
      }
    }
  }

  if (manifest.template.managed_files !== undefined) {
    if (!Array.isArray(manifest.template.managed_files)) {
      throw new Error("Invalid 'template.managed_files': expected array of relative file paths.");
    }
    for (const f of manifest.template.managed_files) {
      if (!isSafeRelativePath(f)) {
        throw new Error(`Invalid path in 'template.managed_files': expected safe relative path, got '${f}'.`);
      }
    }
  }

  if (manifest.template.managed_hashes !== undefined) {
    const hashes = manifest.template.managed_hashes;
    if (!hashes || typeof hashes !== 'object' || Array.isArray(hashes)) {
      throw new Error("Invalid 'template.managed_hashes': expected a map of relative file path -> content fingerprint.");
    }
    for (const [f, h] of Object.entries(hashes)) {
      if (!isSafeRelativePath(f)) {
        throw new Error(`Invalid path in 'template.managed_hashes': expected safe relative path, got '${f}'.`);
      }
      if (typeof h !== 'string' || !/^[0-9a-f]{16,64}$/.test(h)) {
        throw new Error(`Invalid fingerprint for '${f}' in 'template.managed_hashes': expected 16-64 lowercase hex characters.`);
      }
    }
  }

  return {
    kind: 'consumer',
    runtime: rName,
    tier: rTier,
    language: rLang,
    version: manifest.template.version,
    syncStatus: manifest.template.sync_status || 'synced',
    skillMirror: manifest.template.skill_mirror,
    obsoleteFiles: manifest.template.obsolete_files || []
  };
}

function parseSkillFrontmatter(content, expectedDirName) {
  if (!content.startsWith('---')) {
    return { valid: false, error: 'missing opening frontmatter ---' };
  }
  const endIdx = content.indexOf('\n---', 3);
  if (endIdx === -1) {
    return { valid: false, error: 'missing closing frontmatter ---' };
  }
  const fmText = content.slice(3, endIdx).trim();

  let name = '';
  let description = '';
  let currentKey = null;
  let multilineVal = [];

  function flushKey() {
    if (currentKey === 'name') {
      name = multilineVal.join(' ').trim().replace(/^["']|["']$/g, '');
    } else if (currentKey === 'description') {
      description = multilineVal.join(' ').trim().replace(/^["']|["']$/g, '');
    }
    multilineVal = [];
  }

  for (const line of fmText.split('\n')) {
    const colonMatch = line.match(/^([a-z0-9_-]+):\s*(.*)$/i);
    if (colonMatch) {
      flushKey();
      currentKey = colonMatch[1].toLowerCase();
      const val = colonMatch[2].trim();
      if (val !== '>' && val !== '|') {
        multilineVal.push(val);
      }
    } else if (currentKey && /^\s+/.test(line)) {
      multilineVal.push(line.trim());
    }
  }
  flushKey();

  // Official Agent Skills standard constraints:
  // - 1-64 characters
  // - Lowercase alphanumeric and hyphens
  // - Cannot start or end with hyphen
  // - Cannot have consecutive hyphens
  // - Must match directory name
  const nameRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  if (!name || !nameRegex.test(name) || name.length > 64) {
    return { valid: false, name, description, error: `invalid name '${name}' (must match /^[a-z0-9]+(-[a-z0-9]+)*$/ and length <= 64)` };
  }
  if (expectedDirName && name !== expectedDirName) {
    return { valid: false, name, description, error: `name '${name}' does not match directory '${expectedDirName}'` };
  }

  if (!description || description.length === 0 || description.length > 1024) {
    return { valid: false, name, description, error: `description must be between 1 and 1024 characters (current: ${description.length})` };
  }

  return { valid: true, name, description };
}

module.exports = {
  parseYAML,
  stringifyYAML,
  validateManifest,
  parseSkillFrontmatter
};
