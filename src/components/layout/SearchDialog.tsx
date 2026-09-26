'use client';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { search, type SearchDoc, type SearchHit } from '@/lib/search';
import { IconSearch } from '../icons';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
let indexPromise: Promise<SearchDoc[]> | null = null;
function loadIndex() {
  indexPromise ??= fetch(`${base}/search-index.json`)
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json() as Promise<SearchDoc[]>;
    })
    .catch((e) => {
      indexPromise = null;
      throw e;
    });
  return indexPromise;
}

const KIND_LABEL: Record<SearchDoc['kind'], string> = { lesson: 'Lesson', section: 'Lesson', term: 'Glossary', page: 'Page' };

export function SearchResults({
  query,
  docs,
  activeIndex,
  onPick,
  listId,
}: {
  query: string;
  docs: SearchDoc[] | null;
  activeIndex: number;
  onPick: (hit: SearchHit) => void;
  listId: string;
}) {
  const hits = useMemo(() => (docs ? search(docs, query) : []), [docs, query]);
  if (!query.trim()) return <p className="px-4 py-6 text-center text-sm text-muted">Search lesson text and the glossary.</p>;
  if (!docs) return <p className="px-4 py-6 text-center text-sm text-muted">Loading…</p>;
  if (hits.length === 0) return <p className="px-4 py-6 text-center text-sm text-muted">Nothing matches “{query}”.</p>;
  return (
    <ul id={listId} role="listbox" aria-label="Search results" className="divide-y divide-line">
      {hits.map((h, i) => (
        <li key={h.href + i} role="option" aria-selected={i === activeIndex} id={`${listId}-${i}`}>
          <a
            href={base + h.href}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey) return;
              e.preventDefault();
              onPick(h);
            }}
            className={`block px-4 py-3 hover:bg-surface-2 ${i === activeIndex ? 'bg-surface-2' : ''}`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-semibold">
                {h.title}
                {h.heading ? <span className="font-normal text-muted"> › {h.heading}</span> : null}
              </span>
              <span className="tag shrink-0">{KIND_LABEL[h.kind]}</span>
            </div>
            <div className="mt-0.5 text-xs text-muted">{h.context}</div>
            {h.snippet ? (
              <p className="mt-1 text-sm leading-snug text-fg/80">
                {h.snippet.before}
                <mark>{h.snippet.match}</mark>
                {h.snippet.after}
              </p>
            ) : null}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function SearchDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();

  const open = useCallback(() => {
    const d = ref.current;
    if (!d || d.open) return;
    d.showModal();
    input.current?.select();
    loadIndex()
      .then((x) => {
        setDocs(x);
        setFailed(false);
      })
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => setActive(0), [query]);

  const pick = (h: SearchHit) => {
    ref.current?.close();
    router.push(h.href);
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    const hits = docs ? search(docs, query) : [];
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, hits.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && hits[active]) {
      e.preventDefault();
      pick(hits[active]);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="btn btn-sm h-9 gap-2 border-line !px-2.5 font-normal text-muted sm:w-44 sm:justify-start"
        aria-label="Search lessons and glossary"
      >
        <IconSearch className="text-base" />
        <span className="hidden sm:inline">Search</span>
        <span className="kbd ml-auto hidden sm:inline" aria-hidden="true">
          /
        </span>
      </button>
      <dialog
        ref={ref}
        aria-label="Search"
        className="m-0 mx-auto mt-[8vh] w-[min(40rem,calc(100vw-2rem))] max-w-none overflow-hidden rounded-xl border border-line-strong bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/40"
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
      >
        <div className="flex items-center gap-2 border-b border-line px-4">
          <IconSearch className="shrink-0 text-lg text-muted" />
          <input
            ref={input}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Search lessons and terms…"
            aria-label="Search lessons and terms"
            aria-controls={listId}
            aria-activedescendant={query ? `${listId}-${active}` : undefined}
            className="h-14 w-full bg-transparent text-base outline-none"
            autoComplete="off"
          />
          <button type="button" className="btn btn-sm btn-ghost text-muted" onClick={() => ref.current?.close()}>
            Esc
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {failed ? (
            <p className="px-4 py-6 text-center text-sm text-bad">The search index couldn’t be loaded.</p>
          ) : (
            <SearchResults query={query} docs={docs} activeIndex={active} onPick={pick} listId={listId} />
          )}
        </div>
      </dialog>
    </>
  );
}
