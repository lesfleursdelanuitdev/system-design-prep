// Renders every Mermaid diagram in the course with the real Mermaid, in headless Chromium,
// and reports any that fail. Usage: node scripts/check-diagrams.mjs [path-filter]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const filter = process.argv[2] ?? '';
const diagrams = [];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]));
}
function fences(file, text) {
  const re = /```mermaid\s*\n([\s\S]*?)```/g;
  let m;
  let n = 0;
  while ((m = re.exec(text))) diagrams.push({ where: `${path.relative(root, file)} #${++n}`, code: m[1] });
}

for (const f of walk(path.join(root, 'content/lessons')).filter((f) => f.endsWith('.mdx'))) fences(f, fs.readFileSync(f, 'utf8'));
for (const f of walk(path.join(root, 'content/reference')).filter((f) => f.endsWith('.md'))) fences(f, fs.readFileSync(f, 'utf8'));
for (const f of walk(path.join(root, 'content/exercises')).filter((f) => f.endsWith('.yaml'))) {
  const ex = parseYaml(fs.readFileSync(f, 'utf8'));
  if (ex?.type === 'diagram') {
    diagrams.push({ where: `${path.relative(root, f)} starter`, code: ex.starter });
    diagrams.push({ where: `${path.relative(root, f)} modelAnswer`, code: ex.modelAnswer });
  }
  for (const key of ['prompt', 'modelAnswer', 'intro', 'notes']) if (typeof ex?.[key] === 'string') fences(f, ex[key]);
}
const { TEMPLATES } = await import(path.join(root, 'src/lib/templates.ts'));
for (const t of TEMPLATES) diagrams.push({ where: `template ${t.id}`, code: t.code });

const todo = diagrams.filter((d) => d.where.includes(filter));
const browser = await chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? undefined : undefined });
const page = await browser.newPage();
await page.setContent('<!doctype html><html><body></body></html>');
await page.addScriptTag({ path: path.join(root, 'node_modules/mermaid/dist/mermaid.min.js') });
await page.evaluate(() => window.mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' }));

let failed = 0;
for (const [i, d] of todo.entries()) {
  const err = await page.evaluate(
    async ({ code, id }) => {
      try {
        await window.mermaid.render(id, code.trim());
        return null;
      } catch (e) {
        document.getElementById(id)?.remove();
        document.getElementById('d' + id)?.remove();
        return String(e?.message ?? e);
      }
    },
    { code: d.code, id: `m${i}` },
  );
  if (err) {
    failed++;
    console.log(`✗ ${d.where}\n  ${err.split('\n').slice(0, 4).join('\n  ')}\n`);
  }
}
await browser.close();
console.log(`${todo.length - failed} of ${todo.length} diagrams render.`);
process.exit(failed ? 1 : 0);
