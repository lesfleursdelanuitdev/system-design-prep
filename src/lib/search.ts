// Search over lessons and the glossary. The index is built at build time
// (src/app/search-index.json/route.ts) and searched in the browser.

export type SearchDoc = {
  kind: 'lesson' | 'section' | 'term' | 'page';
  /** Lesson title, glossary term or page name */
  title: string;
  /** Section heading, for kind "section" */
  heading?: string;
  /** Where it lives, e.g. "Unit 2 · Requirements" or "Glossary" */
  context: string;
  href: string;
  text: string;
};

export type SearchHit = SearchDoc & { score: number; snippet: { before: string; match: string; after: string } | null };

export function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, '');
}

export function tokenize(q: string): string[] {
  return normalise(q)
    .split(/[^a-z0-9%]+/)
    .filter((t) => t.length > 0);
}

function countMatches(hay: string, token: string, wholeWord: boolean): number {
  let n = 0;
  let i = hay.indexOf(token);
  while (i !== -1 && n < 20) {
    const before = i === 0 ? ' ' : hay[i - 1];
    const after = hay[i + token.length] ?? ' ';
    const startOk = !/[a-z0-9]/.test(before);
    const endOk = !/[a-z0-9]/.test(after);
    if (startOk && (!wholeWord || endOk)) n++;
    i = hay.indexOf(token, i + token.length);
  }
  return n;
}

const WEIGHT = { title: 12, heading: 7, text: 1 };
const KIND_BONUS: Record<SearchDoc['kind'], number> = { term: 1.2, lesson: 1.1, section: 1, page: 1 };

/** Every token must appear (as a word start) in the doc. The last token may be a prefix. */
export function search(docs: SearchDoc[], query: string, limit = 20): SearchHit[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];
  const hits: SearchHit[] = [];
  for (const doc of docs) {
    const title = normalise(doc.title);
    const heading = normalise(doc.heading ?? '');
    const text = normalise(doc.text);
    let score = 0;
    let all = true;
    tokens.forEach((t, idx) => {
      const prefix = idx === tokens.length - 1;
      const s =
        countMatches(title, t, !prefix) * WEIGHT.title +
        countMatches(heading, t, !prefix) * WEIGHT.heading +
        Math.min(countMatches(text, t, !prefix), 8) * WEIGHT.text;
      if (s === 0) all = false;
      score += s;
    });
    if (!all) continue;
    if (title === normalise(query.trim())) score += 30;
    hits.push({ ...doc, score: score * KIND_BONUS[doc.kind], snippet: makeSnippet(doc.text, tokens) });
  }
  hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  // At most two hits per page, so one long lesson doesn't crowd out the rest.
  const perPage = new Map<string, number>();
  const out: SearchHit[] = [];
  for (const h of hits) {
    const page = h.href.split('#')[0];
    const n = perPage.get(page) ?? 0;
    if (n >= 2) continue;
    perPage.set(page, n + 1);
    out.push(h);
    if (out.length >= limit) break;
  }
  return out;
}

export function makeSnippet(text: string, tokens: string[], radius = 70): SearchHit['snippet'] {
  const norm = normalise(text);
  let best = -1;
  let len = 0;
  for (const t of tokens) {
    const m = new RegExp(`(^|[^a-z0-9])(${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`).exec(norm);
    if (!m) continue;
    const at = m.index + m[1].length;
    if (best === -1 || at < best) {
      best = at;
      len = t.length;
    }
  }
  if (best === -1) return null;
  const start = Math.max(0, best - radius);
  const end = Math.min(text.length, best + len + radius);
  return {
    before: (start > 0 ? '…' : '') + text.slice(start, best),
    match: text.slice(best, best + len),
    after: text.slice(best + len, end) + (end < text.length ? '…' : ''),
  };
}
