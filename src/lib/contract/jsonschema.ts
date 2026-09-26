// Contract → JSON Schema (draft 2020-12).
import { hasBody, type Contract, type Field, type ScalarField } from './model';

type Schema = Record<string, unknown>;

export function fieldToSchema(f: Field | ScalarField): Schema {
  let s: Schema;
  switch (f.type) {
    case 'string':
      s = { type: 'string' };
      if (f.minLength !== undefined) s.minLength = f.minLength;
      if (f.maxLength !== undefined) s.maxLength = f.maxLength;
      if (f.enum && f.enum.length) s.enum = [...f.enum];
      break;
    case 'datetime':
      s = { type: 'string', format: 'date-time' };
      break;
    case 'integer':
    case 'number':
      s = { type: f.type };
      if (f.minimum !== undefined) s.minimum = f.minimum;
      if (f.maximum !== undefined) s.maximum = f.maximum;
      break;
    case 'boolean':
      s = { type: 'boolean' };
      break;
    case 'string[]': {
      const items: Schema = { type: 'string' };
      if (f.maxLength !== undefined) items.maxLength = f.maxLength;
      if (f.enum && f.enum.length) items.enum = [...f.enum];
      s = { type: 'array', items };
      if (f.maxItems !== undefined) s.maxItems = f.maxItems;
      break;
    }
    case 'object[]': {
      const children = 'fields' in f && f.fields ? f.fields : [];
      s = { type: 'array', items: objectSchema(children, false) };
      if (f.maxItems !== undefined) s.maxItems = f.maxItems;
      break;
    }
  }
  if (f.nullable) {
    if (s.enum) s.enum = [...(s.enum as string[]), null];
    s.type = [s.type as string, 'null'];
  }
  if (f.description) s = { description: f.description, ...s };
  return s;
}

/**
 * `closed` forbids unknown properties. Requests are closed (a typo is caught at once);
 * responses stay open, so the provider can add fields later without breaking anyone.
 */
export function objectSchema(fields: (Field | ScalarField)[], closed: boolean): Schema {
  const properties: Record<string, Schema> = {};
  const required: string[] = [];
  for (const f of fields) {
    if (!f.name) continue;
    properties[f.name] = fieldToSchema(f);
    if (f.required) required.push(f.name);
  }
  const s: Schema = { type: 'object', properties };
  if (required.length) s.required = required;
  if (closed) s.additionalProperties = false;
  return s;
}

export function errorSchema(c: Contract): Schema {
  const codes = [...new Set(c.errors.map((e) => e.code).filter(Boolean))];
  return {
    type: 'object',
    required: ['error'],
    properties: {
      error: {
        type: 'object',
        required: ['code', 'message'],
        properties: {
          code: codes.length ? { type: 'string', enum: codes, description: 'Stable, machine-readable reason. Callers branch on this.' } : { type: 'string' },
          message: { type: 'string', description: 'Human-readable explanation. May change; don’t parse it.' },
          details: { type: 'object', description: 'Optional extra facts, e.g. which field was wrong.' },
        },
      },
    },
  };
}

const DRAFT = 'https://json-schema.org/draft/2020-12/schema';

export type JsonSchemas = { request?: Schema; response: Schema; error: Schema };

export function toJsonSchemas(c: Contract): JsonSchemas {
  const title = c.summary || c.operationId || 'Endpoint';
  const out: JsonSchemas = {
    response: { $schema: DRAFT, title: `${title}: response body`, ...objectSchema(c.response, false) },
    error: { $schema: DRAFT, title: `${title}: error body`, ...errorSchema(c) },
  };
  if (hasBody(c.method) && c.body.length) {
    out.request = { $schema: DRAFT, title: `${title}: request body`, ...objectSchema(c.body, true) };
  }
  return out;
}

export function toJsonSchemaText(c: Contract): string {
  const s = toJsonSchemas(c);
  const parts: string[] = [];
  if (s.request) parts.push(`// Request body\n${JSON.stringify(s.request, null, 2)}`);
  parts.push(`// Response body (${c.responseStatus})\n${JSON.stringify(s.response, null, 2)}`);
  parts.push(`// Error body (every 4xx and 5xx)\n${JSON.stringify(s.error, null, 2)}`);
  return parts.join('\n\n');
}
