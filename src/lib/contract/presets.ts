// Starting points for the contract builder. The Shelf ones match content/reference/shelf-design.md.
import type { Contract } from './model';

const blank: Contract = {
  title: 'My API',
  version: '1.0.0',
  operationId: 'doSomething',
  method: 'GET',
  path: '/v1/things/{thingId}',
  summary: '',
  description: '',
  provider: '',
  consumer: '',
  params: [{ name: 'thingId', in: 'path', type: 'string', required: true, description: '', maxLength: 64 }],
  body: [],
  responseStatus: 200,
  responseDescription: '',
  response: [],
  errors: [],
  guarantees: { idempotency: '', ordering: '', freshness: '', pagination: '', limits: '', timeout: '' },
  auth: { scheme: 'bearer', headerName: 'X-Api-Key', privilege: '', rule: '' },
};

const listItems: Contract = {
  title: 'Shelf source list API',
  version: '1.0.0',
  operationId: 'listItems',
  method: 'GET',
  path: '/shelf/items',
  summary: 'List every item the app wants Shelf to know about',
  description:
    'Each source app serves this at the list URL it registered. Shelf calls it every night, page by page, to repair anything a push missed.',
  provider: 'Each source app (the recipe site, the quiz app, the photo gallery)',
  consumer: 'Shelf’s nightly pull',
  params: [
    { name: 'cursor', in: 'query', type: 'string', required: false, maxLength: 500, description: 'Opaque. Send back the nextCursor from the previous page; leave it out for the first page.' },
    { name: 'limit', in: 'query', type: 'integer', required: false, minimum: 1, maximum: 500, description: 'How many items Shelf would like. The app may return fewer.' },
  ],
  body: [],
  responseStatus: 200,
  responseDescription: 'One page of items.',
  response: [
    {
      name: 'items',
      type: 'object[]',
      required: true,
      maxItems: 500,
      description: 'This page’s items.',
      fields: [
        { name: 'id', type: 'string', required: true, maxLength: 200, description: 'The app’s own id for the item. Never reused for a different item.' },
        { name: 'title', type: 'string', required: true, maxLength: 300, description: 'What people should see. Shelf keeps a copy.' },
        { name: 'url', type: 'string', required: false, maxLength: 2000, description: 'Where the item lives in the app.' },
        { name: 'scope', type: 'string', required: false, maxLength: 200, description: 'Scope path, e.g. /learning/maths. Defaults to the source’s home scope.' },
        { name: 'updatedAt', type: 'datetime', required: true, description: 'When the item last changed in the app.' },
      ],
    },
    { name: 'nextCursor', type: 'string', required: true, nullable: true, maxLength: 500, description: 'Pass this to get the next page. null means this was the last page.' },
  ],
  errors: [
    { status: 400, code: 'invalid_cursor', when: 'The cursor is unknown or more than an hour old. Shelf starts the listing again from the beginning.' },
    { status: 401, code: 'unauthenticated', when: 'The pull secret is missing or wrong. Shelf stops and alerts the admin.' },
    { status: 503, code: 'unavailable', when: 'The app can’t list right now. Shelf retries the page, then gives up for tonight and marks nothing missing.' },
  ],
  guarantees: {
    idempotency: 'Read-only. Shelf may ask for the same page more than once, for example after a timeout.',
    ordering: 'Any order, as long as moving through the pages never skips an item. Duplicates are fine: Shelf ignores repeats.',
    freshness: 'Each page shows the app’s data at the moment it is served.',
    pagination:
      'Cursor-based: keep calling with nextCursor until it is null. A listing that reaches null is complete: every item that existed for the whole listing appeared at least once. Shelf then marks any item it knows that did not appear as missing. If any page fails, Shelf abandons the listing and marks nothing missing.',
    limits: 'At most 500 items per page. A cursor stays valid for at least 1 hour.',
    timeout: 'Each page must arrive within 10 seconds. Shelf retries a slow or failed page up to 3 times, waiting 2, 4 and 8 seconds.',
  },
  auth: { scheme: 'bearer', headerName: 'X-Api-Key', privilege: 'the pull secret for this source', rule: 'The app checks that the bearer token is the pull secret Shelf gave it at registration' },
};

const sendChanges: Contract = {
  title: 'Shelf API',
  version: '1.0.0',
  operationId: 'sendChanges',
  method: 'POST',
  path: '/v1/sources/{sourceId}/changes',
  summary: 'Tell Shelf that items were added, changed or deleted',
  description: 'Apps call this whenever their items change, so Shelf’s copy stays fresh between nightly pulls. A delete marks the item missing; its tags are kept for 30 days in case it comes back.',
  provider: 'Shelf',
  consumer: 'A source app',
  params: [
    { name: 'sourceId', in: 'path', type: 'string', required: true, maxLength: 32, description: 'The source these items belong to, e.g. recipes.' },
    { name: 'Idempotency-Key', in: 'header', type: 'string', required: false, maxLength: 100, description: 'Any unique text. Send the same key when retrying the same batch.' },
  ],
  body: [
    {
      name: 'changes',
      type: 'object[]',
      required: true,
      maxItems: 500,
      description: 'Applied in order.',
      fields: [
        { name: 'op', type: 'string', required: true, enum: ['upsert', 'delete'], description: 'upsert adds or updates an item; delete marks it missing.' },
        { name: 'id', type: 'string', required: true, maxLength: 200, description: 'The app’s id for the item.' },
        { name: 'title', type: 'string', required: false, maxLength: 300, description: 'Required for upsert.' },
        { name: 'url', type: 'string', required: false, maxLength: 2000, description: '' },
        { name: 'scope', type: 'string', required: false, maxLength: 200, description: 'Must be the source’s home scope or below it.' },
        { name: 'updatedAt', type: 'datetime', required: true, description: 'When the item changed in the app. Shelf ignores a change older than what it already has.' },
      ],
    },
  ],
  responseStatus: 200,
  responseDescription: 'Every change was accepted.',
  response: [
    { name: 'accepted', type: 'integer', required: true, minimum: 0, maximum: 500, description: 'How many changes were in the batch.' },
    {
      name: 'results',
      type: 'object[]',
      required: true,
      maxItems: 500,
      description: 'One per change, in the same order.',
      fields: [
        { name: 'id', type: 'string', required: true, maxLength: 200, description: '' },
        { name: 'status', type: 'string', required: true, enum: ['present', 'missing'], description: 'The item’s status after the change.' },
        { name: 'ignored', type: 'boolean', required: true, description: 'True if Shelf already had a newer version, so this change did nothing.' },
      ],
    },
  ],
  errors: [
    { status: 400, code: 'invalid_request', when: 'The body is malformed or a field breaks a rule. details.index says which change. Nothing is applied.' },
    { status: 401, code: 'unauthenticated', when: 'No key, or an unknown or revoked key.' },
    { status: 403, code: 'forbidden', when: 'The key can’t push for this source.' },
    { status: 404, code: 'source_not_found', when: 'No source has this id.' },
    { status: 413, code: 'too_many_changes', when: 'More than 500 changes in one request. Nothing is applied.' },
    { status: 422, code: 'scope_not_allowed', when: 'A change puts an item outside the source’s home scope. Nothing is applied.' },
    { status: 429, code: 'rate_limited', when: 'More than 60 requests a minute from this key. Wait the number of seconds in Retry-After.' },
    { status: 503, code: 'unavailable', when: 'Shelf can’t take changes right now. Retry with backoff; the nightly pull is the safety net.' },
  ],
  guarantees: {
    idempotency: 'Safe to retry. Repeating a batch leaves the same end state. With the same Idempotency-Key within 24 hours, Shelf returns the first response and applies nothing again.',
    ordering: 'Changes in one request are applied in order. Across requests the newest updatedAt wins, so a late, older change can’t overwrite a newer one.',
    freshness: 'Accepted changes show up in lookups within 5 seconds for 95% of batches.',
    pagination: 'Not a list. Send at most 500 changes per request and split bigger batches.',
    limits: '500 changes and 1 MB per request; 60 requests a minute per key.',
    timeout: 'Shelf answers within 10 seconds. If you time out, retry with the same Idempotency-Key.',
  },
  auth: { scheme: 'bearer', headerName: 'X-Api-Key', privilege: 'items:push', rule: 'The key must belong to this source' },
};

const tagItem: Contract = {
  title: 'Shelf API',
  version: '1.0.0',
  operationId: 'tagItem',
  method: 'PUT',
  path: '/v1/items/{sourceId}/{itemId}/tags/{tagId}',
  summary: 'Put a tag on an item',
  description: 'No request body: the path says everything.',
  provider: 'Shelf',
  consumer: 'An app, or a curator using the admin screens',
  params: [
    { name: 'sourceId', in: 'path', type: 'string', required: true, maxLength: 32, description: '' },
    { name: 'itemId', in: 'path', type: 'string', required: true, maxLength: 200, description: 'The app’s id for the item (URL-encoded).' },
    { name: 'tagId', in: 'path', type: 'string', required: true, maxLength: 40, description: 'Shelf’s id for the tag, e.g. tag_7kq2m9.' },
  ],
  body: [],
  responseStatus: 200,
  responseDescription: 'The item has the tag.',
  response: [
    { name: 'tagId', type: 'string', required: true, maxLength: 40, description: '' },
    { name: 'sourceId', type: 'string', required: true, maxLength: 32, description: '' },
    { name: 'itemId', type: 'string', required: true, maxLength: 200, description: '' },
    { name: 'created', type: 'boolean', required: true, description: 'False if the item already had this tag.' },
    { name: 'taggedAt', type: 'datetime', required: true, description: 'When the tag was first put on.' },
  ],
  errors: [
    { status: 401, code: 'unauthenticated', when: 'No key, or an unknown or revoked key.' },
    { status: 403, code: 'forbidden', when: 'The key lacks tags:apply, or the item or tag is outside the key’s scope.' },
    { status: 404, code: 'item_not_found', when: 'Shelf has never seen this item, or it is gone.' },
    { status: 404, code: 'tag_not_found', when: 'No tag has this id.' },
    { status: 409, code: 'item_missing', when: 'The item is missing or trashed. Only present items can be tagged.' },
    { status: 422, code: 'tag_out_of_scope', when: 'The tag’s scope doesn’t contain the item’s scope.' },
    { status: 429, code: 'rate_limited', when: 'More than 600 requests a minute from this key.' },
  ],
  guarantees: {
    idempotency: 'Safe to repeat: tagging twice leaves one tag. The second call returns created: false.',
    ordering: 'If a tag and an untag of the same pair race, whichever Shelf receives last wins.',
    freshness: 'Visible in lookups as soon as the response is sent.',
    pagination: 'Not a list.',
    limits: '600 requests a minute per key.',
    timeout: 'Answers within 1 second for 99% of requests. Safe to retry after a timeout.',
  },
  auth: { scheme: 'bearer', headerName: 'X-Api-Key', privilege: 'tags:apply', rule: 'Both the item and the tag must be inside the key’s scope' },
};

export const PRESETS: { id: string; label: string; contract: Contract }[] = [
  { id: 'list-items', label: 'Shelf pull: an app lists its items', contract: listItems },
  { id: 'send-changes', label: 'Shelf push: an app sends changes', contract: sendChanges },
  { id: 'tag-item', label: 'Shelf: tag an item', contract: tagItem },
  { id: 'blank', label: 'Start from scratch', contract: blank },
];

export function preset(id: string): Contract {
  const p = PRESETS.find((x) => x.id === id) ?? PRESETS[0];
  return structuredClone(p.contract);
}
