// The contract builder's model: one HTTP endpoint, described completely enough to
// generate OpenAPI, JSON Schema and Zod from it (Unit 6, lesson 9).
import { z } from 'zod';

export const SCALAR_TYPES = ['string', 'integer', 'number', 'boolean', 'datetime', 'string[]'] as const;
export const FIELD_TYPES = [...SCALAR_TYPES, 'object[]'] as const;
export type ScalarType = (typeof SCALAR_TYPES)[number];
export type FieldType = (typeof FIELD_TYPES)[number];
export const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
export type Method = (typeof METHODS)[number];

const num = z.number().finite().optional();
const text = (max: number) => z.string().max(max);

const scalarField = z.object({
  name: text(80),
  type: z.enum(SCALAR_TYPES),
  required: z.boolean(),
  nullable: z.boolean().optional(),
  description: text(400).default(''),
  maxLength: num,
  minLength: num,
  minimum: num,
  maximum: num,
  /** allowed values, for strings */
  enum: z.array(text(80)).max(30).optional(),
  maxItems: num,
});
export type ScalarField = z.infer<typeof scalarField>;

export const fieldSchema = scalarField.extend({
  type: z.enum(FIELD_TYPES),
  /** only for object[]: the fields of each element (one level deep) */
  fields: z.array(scalarField).max(30).optional(),
});
export type Field = z.infer<typeof fieldSchema>;

export const paramSchema = scalarField.extend({ in: z.enum(['path', 'query', 'header']) });
export type Param = z.infer<typeof paramSchema>;

export const errorCaseSchema = z.object({ status: z.number().int().min(400).max(599), code: text(80), when: text(400) });
export type ErrorCase = z.infer<typeof errorCaseSchema>;

export const GUARANTEES = [
  { key: 'idempotency', label: 'Safe to send twice?', hint: 'What happens if the same request arrives twice? (idempotency)' },
  { key: 'ordering', label: 'Ordering', hint: 'If two requests race, or results come in pages, what order is promised?' },
  { key: 'freshness', label: 'Freshness', hint: 'How old can the data in a response be?' },
  { key: 'pagination', label: 'Pagination', hint: 'For lists: page size, cursor, how the caller knows it has everything.' },
  { key: 'limits', label: 'Limits', hint: 'Sizes and rates: max items, max requests per minute.' },
  { key: 'timeout', label: 'Timeouts', hint: 'How long may it take? What should the caller do if it is slower?' },
] as const;
export type GuaranteeKey = (typeof GUARANTEES)[number]['key'];

export const contractSchema = z.object({
  title: text(120),
  version: text(20),
  operationId: text(60),
  method: z.enum(METHODS),
  path: text(200),
  summary: text(200),
  description: text(2000).default(''),
  provider: text(120).default(''),
  consumer: text(120).default(''),
  params: z.array(paramSchema).max(20),
  body: z.array(fieldSchema).max(30),
  responseStatus: z.number().int().min(200).max(299),
  responseDescription: text(300),
  response: z.array(fieldSchema).max(30),
  errors: z.array(errorCaseSchema).max(20),
  guarantees: z.object({
    idempotency: text(600).default(''),
    ordering: text(600).default(''),
    freshness: text(600).default(''),
    pagination: text(600).default(''),
    limits: text(600).default(''),
    timeout: text(600).default(''),
  }),
  auth: z.object({
    scheme: z.enum(['none', 'bearer', 'apiKey']),
    headerName: text(60).default('X-Api-Key'),
    privilege: text(120).default(''),
    rule: text(400).default(''),
  }),
});
export type Contract = z.infer<typeof contractSchema>;

export const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function pathParams(path: string): string[] {
  return [...path.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
}

export function hasBody(method: Method): boolean {
  return method === 'POST' || method === 'PUT' || method === 'PATCH';
}

/** "listItems" → "ListItems" */
export function pascal(s: string): string {
  const words = s.replace(/[^A-Za-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  const joined = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  return /^[A-Za-z]/.test(joined) ? joined : `Op${joined}`;
}

export function emptyField(): Field {
  return { name: '', type: 'string', required: true, description: '' };
}
