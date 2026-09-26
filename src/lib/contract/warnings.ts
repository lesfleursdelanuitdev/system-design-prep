// What the contract builder flags while you fill it in.
import { GUARANTEES, hasBody, IDENT, pathParams, type Contract, type Field } from './model';

export type Warning = { level: 'error' | 'warn' | 'tip'; section: 'endpoint' | 'inputs' | 'outputs' | 'errors' | 'guarantees' | 'auth'; message: string };

function checkNames(fields: Field[], where: string, section: Warning['section'], out: Warning[]) {
  const seen = new Set<string>();
  for (const f of fields) {
    if (!f.name.trim()) {
      out.push({ level: 'error', section, message: `A field in the ${where} has no name.` });
      continue;
    }
    const isHeader = 'in' in f && (f as { in?: string }).in === 'header';
    if (isHeader ? !/^[A-Za-z][A-Za-z0-9-]*$/.test(f.name) : !IDENT.test(f.name)) out.push({ level: 'warn', section, message: `“${f.name}” in the ${where} isn’t a simple name. Stick to letters, digits and _ so every language can use it.` });
    if (seen.has(f.name)) out.push({ level: 'error', section, message: `“${f.name}” appears twice in the ${where}.` });
    seen.add(f.name);
    if (f.type === 'object[]') {
      if (!f.fields || f.fields.length === 0) out.push({ level: 'error', section, message: `“${f.name}” is a list of objects, but its objects have no fields yet.` });
      else checkNames(f.fields as Field[], `items of “${f.name}”`, section, out);
    }
    if ((f.type === 'string' || f.type === 'string[]') && !f.enum?.length && f.maxLength === undefined && /(^id$|Id$|_id$|name$|Name$|title$|Title$)/.test(f.name)) {
      out.push({ level: 'tip', section, message: `Give “${f.name}” a maximum length. Both sides need to know how big it can get.` });
    }
  }
}

export function contractWarnings(c: Contract): Warning[] {
  const out: Warning[] = [];
  if (!c.path.startsWith('/')) out.push({ level: 'error', section: 'endpoint', message: 'The path should start with “/”.' });
  if (!c.provider.trim() || !c.consumer.trim()) {
    out.push({ level: 'warn', section: 'endpoint', message: 'Say who provides this endpoint and who calls it. Most unclear contracts are unclear about this first.' });
  }
  const inPath = pathParams(c.path);
  const declared = c.params.filter((p) => p.in === 'path').map((p) => p.name);
  for (const p of inPath) if (!declared.includes(p)) out.push({ level: 'error', section: 'inputs', message: `The path uses {${p}} but there is no path parameter called “${p}”.` });
  for (const p of declared) if (!inPath.includes(p)) out.push({ level: 'error', section: 'inputs', message: `“${p}” is a path parameter, but the path has no {${p}}.` });
  checkNames(c.params as Field[], 'parameters', 'inputs', out);

  if (hasBody(c.method)) {
    if (c.body.length === 0) out.push({ level: 'tip', section: 'inputs', message: `A ${c.method} usually sends a body. If it really has none, say so in the description.` });
    checkNames(c.body, 'request body', 'inputs', out);
  } else if (c.body.length) {
    out.push({ level: 'warn', section: 'inputs', message: `${c.method} requests shouldn’t carry a body; many proxies drop it. Use parameters instead.` });
  }

  if (c.responseStatus !== 204 && c.response.length === 0) out.push({ level: 'warn', section: 'outputs', message: 'The response has no fields. If nothing comes back, use status 204.' });
  checkNames(c.response, 'response', 'outputs', out);

  const errors = c.errors.filter((e) => e.code.trim() || e.when.trim());
  if (errors.length === 0) {
    out.push({ level: 'warn', section: 'errors', message: 'No errors listed. Every endpoint can fail: bad input, missing things, no permission, too busy. List what the caller will see for each.' });
  }
  for (const e of errors) {
    if (!e.code.trim()) out.push({ level: 'warn', section: 'errors', message: `The ${e.status} error has no code. Callers need a stable code to branch on.` });
    if (!e.when.trim()) out.push({ level: 'warn', section: 'errors', message: `Say when “${e.code || e.status}” happens.` });
  }
  const codes = errors.map((e) => e.code.trim()).filter(Boolean);
  const dup = codes.filter((x, i) => codes.indexOf(x) !== i);
  for (const d of new Set(dup)) out.push({ level: 'error', section: 'errors', message: `The error code “${d}” is used twice. Each code should mean one thing.` });
  const statuses = new Set(errors.map((e) => e.status));
  if (c.auth.scheme !== 'none' && !statuses.has(401)) out.push({ level: 'warn', section: 'errors', message: 'Callers must authenticate, but there’s no 401 error for a missing or wrong key.' });
  if (c.auth.scheme !== 'none' && c.auth.privilege.trim() && !statuses.has(403)) {
    out.push({ level: 'tip', section: 'errors', message: 'A privilege is required, but there’s no 403 error for a key that lacks it.' });
  }
  if ((c.params.length || c.body.length) && !statuses.has(400) && !statuses.has(422)) {
    out.push({ level: 'tip', section: 'errors', message: 'What does the caller see if an input is invalid? Usually a 400 or 422.' });
  }
  if (inPath.length && !statuses.has(404)) out.push({ level: 'tip', section: 'errors', message: 'The path names a specific thing. What if it doesn’t exist? Usually a 404.' });

  for (const g of GUARANTEES) {
    if (!c.guarantees[g.key]?.trim()) out.push({ level: 'warn', section: 'guarantees', message: `${g.label} is blank. ${g.hint}` });
  }
  const isList = c.method === 'GET' && c.response.some((f) => f.type === 'object[]');
  if (isList && !/cursor|page|limit|offset/i.test(c.guarantees.pagination)) {
    out.push({ level: 'warn', section: 'guarantees', message: 'The response is a list. Say how the caller pages through it and knows it has seen everything.' });
  }
  if ((c.method === 'POST' || c.method === 'PATCH') && c.guarantees.idempotency.trim() && !/idempot|twice|again|same|retry|duplicate|key/i.test(c.guarantees.idempotency)) {
    out.push({ level: 'tip', section: 'guarantees', message: `${c.method} isn’t naturally safe to repeat. Say exactly what a repeated request does.` });
  }

  if (c.auth.scheme === 'none') out.push({ level: 'warn', section: 'auth', message: 'Anyone can call this. Is that really what you want? Say so explicitly if it is.' });
  else if (!c.auth.privilege.trim()) out.push({ level: 'warn', section: 'auth', message: 'Which privilege does the caller need? A key alone only says who they are.' });
  return out;
}
