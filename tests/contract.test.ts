import SwaggerParser from '@apidevtools/swagger-parser';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { parse as parseYaml } from 'yaml';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { toJsonSchemas } from '@/lib/contract/jsonschema';
import { contractMarkdown } from '@/lib/contract/markdown';
import { contractSchema, type Contract } from '@/lib/contract/model';
import { toOpenApi, toOpenApiYaml } from '@/lib/contract/openapi';
import { preset, PRESETS } from '@/lib/contract/presets';
import { contractWarnings } from '@/lib/contract/warnings';
import { toZod, zodExportNames } from '@/lib/contract/zod';

/** Runs the generated Zod source against the real zod package. */
function loadZod(c: Contract): Record<string, z.ZodType> {
  const names = zodExportNames(c);
  const js = toZod(c)
    .replace(/^import .*$/m, '')
    .replace(/^export type .*$/gm, '')
    .replace(/^export const /gm, 'const ');
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function('z', `${js}\nreturn { ${names.join(', ')} };`)(z);
}

function ajv() {
  const a = new Ajv2020({ strict: true, allErrors: true });
  addFormats(a);
  return a;
}

const goodPage = {
  items: [
    { id: 'r-1042', title: 'Lentil soup', url: 'https://recipes.example/r-1042', updatedAt: '2026-05-01T10:00:00Z' },
    { id: 'q-7', title: 'Fractions 1', scope: '/learning/maths', updatedAt: '2026-05-02T08:30:00Z' },
  ],
  nextCursor: null,
};

describe('presets', () => {
  it('are valid contracts', () => {
    for (const p of PRESETS) expect(contractSchema.safeParse(p.contract).success, p.id).toBe(true);
  });
  it('the Shelf presets have no errors or warnings (they are the worked examples)', () => {
    for (const id of ['list-items', 'send-changes', 'tag-item']) {
      const serious = contractWarnings(preset(id)).filter((w) => w.level !== 'tip');
      expect(serious, id).toEqual([]);
    }
  });
  it('preset() returns a copy', () => {
    const a = preset('list-items');
    a.title = 'changed';
    expect(preset('list-items').title).not.toBe('changed');
  });
});

describe('OpenAPI output', () => {
  for (const p of PRESETS) {
    it(`is a valid OpenAPI 3.1 document (${p.id})`, async () => {
      const doc = parseYaml(toOpenApiYaml(p.contract));
      await expect(SwaggerParser.validate(doc)).resolves.toBeTruthy();
    });
  }
  it('lists every error status and the guarantees', () => {
    const doc = toOpenApi(preset('send-changes')) as { paths: Record<string, Record<string, Record<string, unknown>>> };
    const op = doc.paths['/v1/sources/{sourceId}/changes'].post;
    expect(Object.keys(op.responses as object).sort()).toEqual(['200', '400', '401', '403', '404', '413', '422', '429', '503']);
    expect(op['x-guarantees']).toMatchObject({ idempotency: expect.stringContaining('Idempotency-Key') });
    expect(op.security).toEqual([{ callerKey: [] }]);
  });
  it('merges two errors that share a status', () => {
    const doc = toOpenApi(preset('tag-item')) as { paths: Record<string, Record<string, { responses: Record<string, { description: string }> }>> };
    const d = doc.paths['/v1/items/{sourceId}/{itemId}/tags/{tagId}'].put.responses['404'].description;
    expect(d).toContain('item_not_found');
    expect(d).toContain('tag_not_found');
  });
});

describe('JSON Schema output', () => {
  it('compiles, accepts a good page and rejects bad ones (list-items)', () => {
    const s = toJsonSchemas(preset('list-items'));
    const validate = ajv().compile(s.response);
    expect(validate(goodPage)).toBe(true);
    expect(validate({ items: [{ id: 'x', title: 't' }], nextCursor: null })).toBe(false); // no updatedAt
    expect(validate({ items: [], nextCursor: 5 })).toBe(false);
    expect(validate({ ...goodPage, extra: 'fine' })).toBe(true); // responses stay open
    expect(validate({ items: [{ id: 'x'.repeat(201), title: 't', updatedAt: '2026-05-01T10:00:00Z' }], nextCursor: null })).toBe(false);
  });
  it('closes request bodies and checks enums (send-changes)', () => {
    const s = toJsonSchemas(preset('send-changes'));
    expect(s.request).toBeDefined();
    const v = ajv().compile(s.request!);
    expect(v({ changes: [{ op: 'upsert', id: 'r-1', title: 'Soup', updatedAt: '2026-05-01T10:00:00Z' }] })).toBe(true);
    expect(v({ changes: [{ op: 'rename', id: 'r-1', updatedAt: '2026-05-01T10:00:00Z' }] })).toBe(false);
    expect(v({ changes: [], extra: true })).toBe(false);
    expect(v({ changes: [{ op: 'delete', id: 'r-1', updatedAt: 'yesterday' }] })).toBe(false);
  });
  it('describes the error body with the listed codes', () => {
    const s = toJsonSchemas(preset('tag-item'));
    const v = ajv().compile(s.error);
    expect(v({ error: { code: 'tag_out_of_scope', message: 'Nope' } })).toBe(true);
    expect(v({ error: { code: 'made_up', message: 'Nope' } })).toBe(false);
  });
  it('has no request schema for GET', () => {
    expect(toJsonSchemas(preset('list-items')).request).toBeUndefined();
  });
});

describe('Zod output', () => {
  it('runs, and agrees with the JSON Schema on the same examples (list-items)', () => {
    const c = preset('list-items');
    const zs = loadZod(c);
    expect(Object.keys(zs)).toEqual(['ListItemsParams', 'ListItemsResponse', 'ListItemsError']);
    expect(zs.ListItemsResponse.safeParse(goodPage).success).toBe(true);
    expect(zs.ListItemsResponse.safeParse({ items: [{ id: 'x', title: 't' }], nextCursor: null }).success).toBe(false);
    expect(zs.ListItemsResponse.safeParse({ items: [], nextCursor: 5 }).success).toBe(false);
  });
  it('coerces query parameters, which arrive as text', () => {
    const zs = loadZod(preset('list-items'));
    expect(zs.ListItemsParams.parse({ limit: '200' })).toEqual({ limit: 200 });
    expect(zs.ListItemsParams.safeParse({ limit: '9000' }).success).toBe(false);
  });
  it('makes request bodies strict (send-changes)', () => {
    const zs = loadZod(preset('send-changes'));
    const ok = { changes: [{ op: 'delete', id: 'r-9', updatedAt: '2026-05-01T10:00:00Z' }] };
    expect(zs.SendChangesRequest.safeParse(ok).success).toBe(true);
    expect(zs.SendChangesRequest.safeParse({ ...ok, extra: 1 }).success).toBe(false);
    expect(zs.SendChangesRequest.safeParse({ changes: [{ op: 'nope', id: 'r', updatedAt: '2026-05-01T10:00:00Z' }] }).success).toBe(false);
    expect(zs.SendChangesParams.safeParse({ sourceId: 'recipes', 'Idempotency-Key': 'abc' }).success).toBe(true);
  });
  it('restricts error codes to the listed ones', () => {
    const zs = loadZod(preset('tag-item'));
    expect(zs.TagItemError.safeParse({ error: { code: 'item_missing', message: 'x' } }).success).toBe(true);
    expect(zs.TagItemError.safeParse({ error: { code: 'other', message: 'x' } }).success).toBe(false);
  });
  it('handles odd names, nullable fields and no-content responses', () => {
    const c = preset('blank');
    c.method = 'DELETE';
    c.responseStatus = 204;
    c.params.push({ name: 'dry-run', in: 'query', type: 'boolean', required: false, description: 'it\'s "quoted"' });
    const code = toZod(c);
    expect(code).toContain('"dry-run": z.stringbool().optional().describe("it\'s \\"quoted\\"")');
    expect(code).not.toContain('Response =');
    const zs = loadZod(c);
    expect(zs.DoSomethingParams.parse({ thingId: 'a', 'dry-run': 'true' })).toEqual({ thingId: 'a', 'dry-run': true });
  });
});

describe('warnings', () => {
  it('warns when errors and guarantees are blank', () => {
    const w = contractWarnings(preset('blank'));
    expect(w.some((x) => x.section === 'errors' && /No errors listed/.test(x.message))).toBe(true);
    expect(w.filter((x) => x.section === 'guarantees')).toHaveLength(6);
  });
  it('catches path parameters that don’t match the path', () => {
    const c = preset('blank');
    c.path = '/v1/things/{id}';
    const msgs = contractWarnings(c).map((w) => w.message);
    expect(msgs).toContain('The path uses {id} but there is no path parameter called “id”.');
    expect(msgs).toContain('“thingId” is a path parameter, but the path has no {thingId}.');
  });
  it('asks for 401 and 403 when a key and privilege are needed', () => {
    const c = preset('tag-item');
    c.errors = c.errors.filter((e) => e.status !== 401 && e.status !== 403);
    const msgs = contractWarnings(c).map((w) => w.message).join('\n');
    expect(msgs).toMatch(/no 401/);
    expect(msgs).toMatch(/no 403/);
    expect(contractWarnings(c).find((w) => /no 403/.test(w.message))?.level).toBe('tip');
  });
  it('asks how to page through a list', () => {
    const c = preset('list-items');
    c.guarantees.pagination = 'We send everything.';
    expect(contractWarnings(c).some((w) => /pages through it/.test(w.message))).toBe(true);
  });
  it('flags duplicate error codes and names', () => {
    const c = preset('send-changes');
    c.errors.push({ status: 400, code: 'invalid_request', when: 'again' });
    c.response.push({ name: 'accepted', type: 'integer', required: true, description: '' });
    const msgs = contractWarnings(c).map((w) => w.message).join('\n');
    expect(msgs).toMatch(/“invalid_request” is used twice/);
    expect(msgs).toMatch(/“accepted” appears twice/);
  });
});

describe('markdown summary', () => {
  it('includes inputs, nested outputs, errors and guarantees', () => {
    const md = contractMarkdown(preset('list-items'));
    expect(md).toContain('**`GET /shelf/items`**');
    expect(md).toContain('| `items[].updatedAt` | date-time | yes |');
    expect(md).toContain('| 401 | `unauthenticated` |');
    expect(md).toContain('- **Pagination** Cursor-based');
  });
});
