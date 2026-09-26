// Contract → a plain-English markdown summary (for the capstone document).
import { GUARANTEES, type Contract, type Field } from './model';

const cell = (s: string | number | undefined) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ') || '—';

function typeLabel(f: Field): string {
  const bits: string[] = [f.type === 'datetime' ? 'date-time' : f.type];
  if (f.enum?.length) bits.push(`one of ${f.enum.map((e) => `\`${e}\``).join(', ')}`);
  if (f.maxLength !== undefined) bits.push(`≤ ${f.maxLength} chars`);
  if (f.minimum !== undefined || f.maximum !== undefined) bits.push(`${f.minimum ?? '…'}–${f.maximum ?? '…'}`);
  if (f.maxItems !== undefined) bits.push(`≤ ${f.maxItems} items`);
  if (f.nullable) bits.push('may be null');
  return bits.join(', ');
}

function fieldRows(fields: Field[], prefix = ''): string[] {
  const rows: string[] = [];
  for (const f of fields) {
    if (!f.name) continue;
    rows.push(`| \`${prefix}${f.name}\` | ${cell(typeLabel(f))} | ${f.required ? 'yes' : 'no'} | ${cell(f.description)} |`);
    if (f.type === 'object[]' && f.fields) rows.push(...fieldRows(f.fields as Field[], `${prefix}${f.name}[].`));
  }
  return rows;
}

export function contractMarkdown(c: Contract): string {
  const out: string[] = [];
  out.push(`**\`${c.method} ${c.path}\`**${c.summary ? `: ${c.summary}` : ''}`, '');
  if (c.provider || c.consumer) out.push(`- **Provider:** ${c.provider || '—'}`, `- **Consumer:** ${c.consumer || '—'}`);
  if (c.auth.scheme !== 'none') out.push(`- **Who may call it:** ${[c.auth.privilege && `needs \`${c.auth.privilege}\``, c.auth.rule].filter(Boolean).join('; ') || '—'}`);
  else out.push('- **Who may call it:** anyone (no authentication)');
  if (c.description) out.push('', c.description);
  const params = c.params.filter((p) => p.name);
  if (params.length || c.body.length) {
    out.push('', '**Inputs**', '', '| Name | Type | Required | Meaning |', '|---|---|---|---|');
    out.push(...params.map((p) => `| \`${p.name}\` (${p.in}) | ${cell(typeLabel(p as Field))} | ${p.in === 'path' || p.required ? 'yes' : 'no'} | ${cell(p.description)} |`));
    out.push(...fieldRows(c.body));
  }
  out.push('', `**Output** (${c.responseStatus}${c.responseDescription ? `: ${c.responseDescription}` : ''})`);
  if (c.response.length) out.push('', '| Name | Type | Required | Meaning |', '|---|---|---|---|', ...fieldRows(c.response));
  const errors = c.errors.filter((e) => e.code || e.when);
  out.push('', '**Errors**', '');
  if (errors.length) out.push('| Status | Code | When |', '|---|---|---|', ...errors.map((e) => `| ${e.status} | \`${cell(e.code)}\` | ${cell(e.when)} |`));
  else out.push('_None listed yet._');
  out.push('', '**Guarantees**', '');
  for (const g of GUARANTEES) out.push(`- **${g.label}** ${c.guarantees[g.key]?.trim() || '_not stated_'}`);
  return out.join('\n');
}
