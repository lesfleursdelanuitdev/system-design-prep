// Contract → Zod (v4) source code.
import { hasBody, IDENT, pascal, type Contract, type Field, type Param, type ScalarField } from './model';

const q = (s: string) => JSON.stringify(s);
const key = (name: string) => (IDENT.test(name) ? name : q(name));

function scalar(f: ScalarField, coerce: boolean): string {
  let s: string;
  switch (f.type) {
    case 'string':
      if (f.enum && f.enum.length) s = `z.enum([${f.enum.map(q).join(', ')}])`;
      else {
        s = 'z.string()';
        if (f.minLength !== undefined) s += `.min(${f.minLength})`;
        if (f.maxLength !== undefined) s += `.max(${f.maxLength})`;
      }
      break;
    case 'datetime':
      s = 'z.iso.datetime()';
      break;
    case 'integer':
    case 'number':
      s = coerce ? 'z.coerce.number()' : 'z.number()';
      if (f.type === 'integer') s += '.int()';
      if (f.minimum !== undefined) s += `.min(${f.minimum})`;
      if (f.maximum !== undefined) s += `.max(${f.maximum})`;
      break;
    case 'boolean':
      s = coerce ? 'z.stringbool()' : 'z.boolean()';
      break;
    case 'string[]': {
      let inner = f.enum && f.enum.length ? `z.enum([${f.enum.map(q).join(', ')}])` : 'z.string()';
      if (!(f.enum && f.enum.length) && f.maxLength !== undefined) inner += `.max(${f.maxLength})`;
      s = `z.array(${inner})`;
      if (f.maxItems !== undefined) s += `.max(${f.maxItems})`;
      break;
    }
  }
  return s;
}

function fieldExpr(f: Field | ScalarField | Param, coerce: boolean, indent: string): string {
  let s: string;
  if (f.type === 'object[]') {
    const children = ('fields' in f && f.fields ? f.fields : []).filter((c) => c.name);
    const inner = children.map((c) => `${indent}    ${key(c.name)}: ${fieldExpr(c, false, indent + '  ')},`).join('\n');
    s = `z.array(z.object({\n${inner}\n${indent}  }))`;
    if (f.maxItems !== undefined) s += `.max(${f.maxItems})`;
  } else {
    s = scalar(f as ScalarField, coerce);
  }
  if (f.nullable) s += '.nullable()';
  const required = 'in' in f && f.in === 'path' ? true : f.required;
  if (!required) s += '.optional()';
  if (f.description) s += `.describe(${q(f.description)})`;
  return s;
}

function objectBody(fields: (Field | Param)[], coerce: (f: Field | Param) => boolean): string {
  const lines = fields.filter((f) => f.name).map((f) => `  ${key(f.name)}: ${fieldExpr(f, coerce(f), '  ')},`);
  return lines.length ? `{\n${lines.join('\n')}\n}` : '{}';
}

export function toZod(c: Contract): string {
  const name = pascal(c.operationId || c.summary || 'Endpoint');
  const codes = [...new Set(c.errors.map((e) => e.code).filter(Boolean))];
  const out: string[] = [];
  out.push(`import { z } from 'zod';`, '');
  out.push(`// ${c.method} ${c.path}${c.summary ? `: ${c.summary}` : ''}`);
  if (c.provider || c.consumer) out.push(`// Provider: ${c.provider || '?'} · Consumer: ${c.consumer || '?'}`);
  out.push('');

  const params = c.params.filter((p) => p.name);
  const types: string[] = [];
  if (params.length) {
    out.push('/** Path, query and header parameters. These arrive as text, so numbers are coerced. */');
    out.push(`export const ${name}Params = z.object(${objectBody(params, (p) => (p as Param).in !== undefined)});`, '');
    types.push(`${name}Params`);
  }
  if (hasBody(c.method) && c.body.length) {
    out.push('/** Request body. Strict: unknown fields are rejected, so a typo is caught at once. */');
    out.push(`export const ${name}Request = z.strictObject(${objectBody(c.body, () => false)});`, '');
    types.push(`${name}Request`);
  }
  if (c.responseStatus !== 204) {
    out.push(`/** Response body (${c.responseStatus}). Extra fields are ignored, so the provider can add more later. */`);
    out.push(`export const ${name}Response = z.object(${objectBody(c.response, () => false)});`, '');
    types.push(`${name}Response`);
  }
  out.push('/** Error body, for every 4xx and 5xx response. */');
  out.push(`export const ${name}Error = z.object({`);
  out.push('  error: z.object({');
  out.push(`    code: ${codes.length ? `z.enum([${codes.map(q).join(', ')}])` : 'z.string()'},`);
  out.push('    message: z.string(),');
  out.push('    details: z.record(z.string(), z.unknown()).optional(),');
  out.push('  }),');
  out.push('});', '');
  types.push(`${name}Error`);
  for (const t of types) out.push(`export type ${t} = z.infer<typeof ${t}>;`);
  return out.join('\n') + '\n';
}

/** The names of the schemas toZod exports, in order. */
export function zodExportNames(c: Contract): string[] {
  const name = pascal(c.operationId || c.summary || 'Endpoint');
  const names: string[] = [];
  if (c.params.some((p) => p.name)) names.push(`${name}Params`);
  if (hasBody(c.method) && c.body.length) names.push(`${name}Request`);
  if (c.responseStatus !== 204) names.push(`${name}Response`);
  names.push(`${name}Error`);
  return names;
}
