'use client';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { normalise } from '@/lib/search';

type Item = { id: string; term: string; short: string; aka: string[]; see: { id: string; term: string }[]; long: ReactNode };

const letterOf = (t: string) => {
  const c = t.charAt(0).toUpperCase();
  return /[A-Z]/.test(c) ? c : '#';
};

export function GlossaryList({ items }: { items: Item[] }) {
  const [q, setQ] = useState('');
  const [target, setTarget] = useState<string | null>(null);
  const shown = useMemo(() => {
    const n = normalise(q.trim());
    if (!n) return items;
    return items.filter((i) => normalise([i.term, i.short, ...i.aka].join(' ')).includes(n));
  }, [items, q]);
  const letters = [...new Set(items.map((i) => letterOf(i.term)))];

  useEffect(() => {
    const read = () => setTarget(decodeURIComponent(window.location.hash.slice(1)) || null);
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  return (
    <div className="mt-6">
      <div className="sticky top-[var(--header-h)] z-10 -mx-4 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <label htmlFor="glossary-filter" className="sr-only">
          Filter the glossary
        </label>
        <input id="glossary-filter" type="search" className="field" placeholder="Filter terms…" value={q} onChange={(e) => setQ(e.target.value)} />
        {!q ? (
          <nav aria-label="Jump to letter" className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-sm">
            {letters.map((l) => (
              <a key={l} href={`#letter-${l}`} className="font-semibold text-accent hover:underline">
                {l}
              </a>
            ))}
          </nav>
        ) : (
          <p className="mt-2 text-sm text-muted" aria-live="polite">
            {shown.length} match{shown.length === 1 ? '' : 'es'}
          </p>
        )}
      </div>
      <dl className="mt-2">
        {shown.map((i, n) => {
          const letter = letterOf(i.term);
          const first = !q && (n === 0 || letterOf(shown[n - 1].term) !== letter);
          return (
            <div key={i.id}>
              {first ? (
                <h2 id={`letter-${letter}`} className="mt-8 border-b border-line pb-1 text-sm font-bold uppercase tracking-wider text-muted">
                  {letter}
                </h2>
              ) : null}
              <div id={i.id} className={`scroll-mt-40 rounded-lg px-3 py-3 ${target === i.id ? 'bg-accent-soft ring-1 ring-accent' : ''}`}>
                <dt className="text-lg font-bold">
                  {i.term}
                  {i.aka.length ? <span className="ml-2 text-sm font-normal text-muted">also: {i.aka.join(', ')}</span> : null}
                </dt>
                <dd className="mt-1 leading-relaxed">
                  <p>{i.short}</p>
                  {i.long ? <div className="mt-2 space-y-2 text-[0.95rem] text-fg/85 [&_code]:font-mono [&_code]:text-[0.88em] [&_ul]:list-disc [&_ul]:pl-5">{i.long}</div> : null}
                  {i.see.length ? (
                    <p className="mt-1.5 text-sm text-muted">
                      See also:{' '}
                      {i.see.map((s, k) => (
                        <span key={s.id}>
                          {k ? ', ' : ''}
                          <a href={`#${s.id}`} className="text-accent hover:underline" onClick={() => setQ('')}>
                            {s.term}
                          </a>
                        </span>
                      ))}
                    </p>
                  ) : null}
                </dd>
              </div>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
