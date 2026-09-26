import { describe, expect, it } from 'vitest';
import { makeSnippet, search, tokenize, type SearchDoc } from '@/lib/search';
import { buildSearchIndex } from '@/lib/search-index';

const docs: SearchDoc[] = [
  { kind: 'term', title: 'Idempotency', context: 'Glossary', href: '/glossary/#idempotency', text: 'Doing something twice has the same effect as doing it once.' },
  { kind: 'section', title: 'Behavioural guarantees', heading: 'Safe to send twice?', context: 'Unit 6', href: '/learn/contracts/behavioural-guarantees/#safe', text: 'Idempotency means a retry is safe. Shelf’s push accepts an Idempotency-Key.' },
  { kind: 'lesson', title: 'Meet Shelf', context: 'Unit 1', href: '/learn/getting-oriented/meet-shelf/', text: 'Shelf is a small labelling service.' },
  { kind: 'section', title: 'Meet Shelf', heading: 'Scopes', context: 'Unit 1', href: '/learn/getting-oriented/meet-shelf/#scopes', text: 'Shelf’s scopes form a tree.' },
  { kind: 'section', title: 'Meet Shelf', heading: 'Numbers', context: 'Unit 1', href: '/learn/getting-oriented/meet-shelf/#numbers', text: 'Shelf has 60,000 items.' },
];

describe('search', () => {
  it('tokenises and ignores punctuation and case', () => {
    expect(tokenize('Shelf’s  Idempotency-Key!')).toEqual(['shelf', 's', 'idempotency', 'key']);
  });
  it('ranks title matches first', () => {
    const hits = search(docs, 'idempotency');
    expect(hits[0].title).toBe('Idempotency');
    expect(hits.map((h) => h.title)).toContain('Behavioural guarantees');
  });
  it('needs every word, and treats the last one as a prefix', () => {
    expect(search(docs, 'safe retry').map((h) => h.title)).toEqual(['Behavioural guarantees']);
    expect(search(docs, 'idempot').length).toBe(2);
    expect(search(docs, 'idempot banana')).toEqual([]);
  });
  it('matches words at their start only', () => {
    expect(search(docs, 'dempotency')).toEqual([]);
  });
  it('shows at most two hits per page', () => {
    const hits = search(docs, 'shelf');
    expect(hits.filter((h) => h.href.startsWith('/learn/getting-oriented/meet-shelf/')).length).toBe(2);
  });
  it('makes a snippet around the first match', () => {
    const s = makeSnippet('Shelf’s push accepts an Idempotency-Key header.', ['idempotency']);
    expect(s?.match).toBe('Idempotency');
    expect(s?.before).toBe('Shelf’s push accepts an ');
  });
  it('builds an index of every lesson section and glossary term', () => {
    const index = buildSearchIndex();
    expect(index.some((d) => d.kind === 'term' && d.title === 'Latency')).toBe(true);
    expect(index.some((d) => d.kind === 'lesson' && d.title === 'Meet Shelf')).toBe(true);
    const section = index.find((d) => d.kind === 'section' && d.heading === 'Who is involved');
    expect(section?.href).toBe('/learn/getting-oriented/meet-shelf/#who-is-involved');
    // Code and Mermaid are left out; component text (callouts, diagram descriptions) is kept.
    expect(index.some((d) => d.text.includes('asks for the full list nightly'))).toBe(false); // a Mermaid edge label in lesson 1.1
    expect(index.some((d) => d.text.includes('Three apps now, maybe twenty in two years'))).toBe(true);
  });
});
