// Quotes one-line YAML values that contain ": " (a common way to break a YAML file).
// Usage: node scripts/quote-yaml.mjs content/exercises/u2-*.yaml content/glossary-drafts/*.yaml
import fs from 'node:fs';

const KEYS = /^(\s*(?:-\s+)?(?:text|explanation|reason|prompt|intro|title|hint|label|when|short|long|term|notes|source|stimulus|environment|response|measure|modelDescription|starter):\s)(.+)$/;
for (const file of process.argv.slice(2)) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  let changed = 0;
  const out = lines.map((line) => {
    const m = KEYS.exec(line);
    if (!m) return line;
    const v = m[2];
    if (/^["'|>]/.test(v)) return line;
    if (!/: |^[*&!%@`{[\-]| #/.test(v)) return line;
    changed++;
    return `${m[1]}"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  });
  if (changed) {
    fs.writeFileSync(file, out.join('\n'));
    console.log(`${file}: quoted ${changed} value(s)`);
  }
}
