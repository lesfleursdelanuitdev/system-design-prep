// Contract → OpenAPI 3.1 (as YAML).
import { stringify } from 'yaml';
import { errorSchema, fieldToSchema, objectSchema } from './jsonschema';
import { GUARANTEES, hasBody, type Contract } from './model';

const REASONS: Record<number, string> = {
  400: 'Bad request',
  401: 'Not authenticated',
  403: 'Not allowed',
  404: 'Not found',
  409: 'Conflict',
  410: 'Gone',
  412: 'Precondition failed',
  413: 'Too large',
  415: 'Unsupported media type',
  422: 'Unprocessable',
  429: 'Too many requests',
  500: 'Server error',
  502: 'Bad gateway',
  503: 'Unavailable',
  504: 'Timeout',
};

export function toOpenApi(c: Contract): Record<string, unknown> {
  const guarantees = GUARANTEES.filter((g) => c.guarantees[g.key]?.trim());
  const descParts = [c.description.trim()];
  if (c.provider || c.consumer) descParts.push(`Provider: ${c.provider || '?'}. Consumer: ${c.consumer || '?'}.`);
  if (c.auth.scheme !== 'none' && (c.auth.privilege || c.auth.rule)) {
    descParts.push(`Access: ${[c.auth.privilege && `needs \`${c.auth.privilege}\``, c.auth.rule].filter(Boolean).join('. ')}.`.replace(/\.\.$/, '.'));
  }
  if (guarantees.length) descParts.push(['Guarantees:', ...guarantees.map((g) => `- ${g.label}: ${c.guarantees[g.key].trim()}`)].join('\n'));

  const parameters = c.params
    .filter((p) => p.name)
    .map((p) => ({
      name: p.name,
      in: p.in,
      required: p.in === 'path' ? true : p.required,
      description: p.description || undefined,
      schema: fieldToSchema({ ...p, description: '' }),
    }));

  const responses: Record<string, unknown> = {};
  const status = String(c.responseStatus);
  responses[status] =
    c.responseStatus === 204
      ? { description: c.responseDescription || 'Done. No body.' }
      : {
          description: c.responseDescription || 'Success',
          content: { 'application/json': { schema: objectSchema(c.response, false) } },
        };
  const byStatus = new Map<number, typeof c.errors>();
  for (const e of c.errors) {
    if (!e.code && !e.when) continue;
    byStatus.set(e.status, [...(byStatus.get(e.status) ?? []), e]);
  }
  for (const [s, list] of [...byStatus.entries()].sort((a, b) => a[0] - b[0])) {
    const lines = list.map((e) => `\`${e.code || 'error'}\`: ${e.when || 'no description'}`);
    responses[String(s)] = {
      description: `${REASONS[s] ?? 'Error'}. ${lines.join('; ')}`,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
    };
  }

  const op: Record<string, unknown> = {
    operationId: c.operationId || undefined,
    summary: c.summary || undefined,
    description: descParts.filter(Boolean).join('\n\n') || undefined,
  };
  if (parameters.length) op.parameters = parameters;
  if (hasBody(c.method) && c.body.length) {
    op.requestBody = { required: true, content: { 'application/json': { schema: objectSchema(c.body, true) } } };
  }
  op.responses = responses;
  if (c.auth.scheme !== 'none') op.security = [{ callerKey: [] }];
  if (guarantees.length) op['x-guarantees'] = Object.fromEntries(guarantees.map((g) => [g.key, c.guarantees[g.key].trim()]));

  const components: Record<string, unknown> = { schemas: { Error: errorSchema(c) } };
  if (c.auth.scheme === 'bearer') components.securitySchemes = { callerKey: { type: 'http', scheme: 'bearer' } };
  if (c.auth.scheme === 'apiKey') components.securitySchemes = { callerKey: { type: 'apiKey', in: 'header', name: c.auth.headerName || 'X-Api-Key' } };

  return {
    openapi: '3.1.0',
    info: { title: c.title || 'API', version: c.version || '1.0.0' },
    paths: { [c.path || '/']: { [c.method.toLowerCase()]: op } },
    components,
  };
}

export function toOpenApiYaml(c: Contract): string {
  return stringify(toOpenApi(c), { lineWidth: 0, aliasDuplicateObjects: false });
}
