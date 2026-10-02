// Bundles src/ into "Play Little Meadow.html" at the repo root: one self-contained file that
// runs from file:// (double-click to play, no server). Zero dependencies.
// The file is committed so a plain "Download ZIP" from GitHub is ready to play; rebuild and
// commit it with every change. Output is identical on every OS (line endings are
// normalised), so rebuilding on Windows never shows a spurious change.
//
// Each module becomes a function scope in a registry; imports become destructuring.
// Source constraints (see docs/02_TECHNICAL_ARCHITECTURE.md):
//   - named exports only: export class|function|const|let NAME   (no default, no export { })
//   - static relative imports: import { A, B as C } from './x.js';
//   - no import cycles

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entry = path.join(root, 'src', 'main.js');
const outFile = path.join(root, 'Play Little Meadow.html');

function read(file) {
  return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
}

const IMPORT_RE = /^import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"];?[ \t]*$/gm;
const EXPORT_DECL_RE = /^export\s+(?:async\s+)?(class|function\*?|const|let|var)\s+([A-Za-z_$][\w$]*)/gm;

const order = [];
const done = new Set();

function id(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

function visit(file, stack) {
  if (done.has(file)) return;
  if (stack.includes(file)) {
    throw new Error(`Import cycle: ${[...stack, file].map(id).join(' -> ')}`);
  }
  const code = read(file);
  for (const m of code.matchAll(IMPORT_RE)) {
    visit(path.resolve(path.dirname(file), m[2]), [...stack, file]);
  }
  done.add(file);
  order.push(file);
}

function transform(file) {
  let code = read(file);
  if (/^export\s+default\b/m.test(code)) throw new Error(`${id(file)}: default exports are not supported`);
  if (/^export\s*\{/m.test(code)) throw new Error(`${id(file)}: export lists are not supported`);
  if (/^import\s+(?!\{)/m.test(code)) throw new Error(`${id(file)}: only "import { ... } from" is supported`);

  code = code.replace(IMPORT_RE, (_, names, spec) => {
    const target = id(path.resolve(path.dirname(file), spec));
    const fields = names.split(',').map((s) => s.trim()).filter(Boolean)
      .map((s) => s.replace(/\s+as\s+/, ': '));
    return `const { ${fields.join(', ')} } = __m[${JSON.stringify(target)}];`;
  });

  const exported = [];
  code = code.replace(EXPORT_DECL_RE, (match, kind, name) => {
    exported.push(name);
    return match.replace(/^export\s+/, '');
  });

  return `__m[${JSON.stringify(id(file))}] = (() => {\n${code}\nreturn { ${exported.join(', ')} };\n})();\n`;
}

visit(entry, []);
const bundle = `"use strict";\n(() => {\nconst __m = {};\n${order.map(transform).join('\n')}})();\n`;

const html = read(path.join(root, 'index.html'));
const start = html.indexOf('<!-- DEV-ONLY:START -->');
const end = html.indexOf('<!-- DEV-ONLY:END -->');
if (start < 0 || end < 0) throw new Error('index.html is missing the DEV-ONLY markers');
const script = `<script>\n${bundle.replace(/<\/script/gi, '<\\/script')}</script>`;
const out = html.slice(0, start) + script + html.slice(end + '<!-- DEV-ONLY:END -->'.length);

fs.writeFileSync(outFile, out);
console.log(`Built ${id(outFile)}: ${order.length} modules, ${(out.length / 1024).toFixed(1)} KB`);
