'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { OutlineUnit } from '@/lib/content';
import { useProgress } from '@/lib/progress';
import { useHydrated } from '@/lib/storage';
import { IconCheck, IconChevron } from '../icons';

const trim = (p: string) => p.replace(/\/+$/, '') || '/';

/** Units and lessons, with a tick beside each completed lesson. Used by the sidebar and the phone menu. */
export function CourseNav({ outline, onNavigate }: { outline: OutlineUnit[]; onNavigate?: () => void }) {
  const pathname = trim(usePathname() ?? '/');
  const { progress } = useProgress();
  const hydrated = useHydrated();
  const currentUnit = outline.find((u) => pathname.startsWith(trim(u.href)))?.slug;
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (currentUnit) setOpen((o) => (o[currentUnit] ? o : { ...o, [currentUnit]: true }));
  }, [currentUnit]);

  return (
    <nav aria-label="Course contents" className="text-[0.925rem]">
      <ol className="space-y-1">
        {outline.map((unit) => {
          const isOpen = open[unit.slug] ?? false;
          const done = unit.lessons.filter((l) => progress.completed[l.id]).length;
          const listId = `unit-${unit.slug}-lessons`;
          return (
            <li key={unit.slug}>
              <div className="flex items-stretch gap-1">
                <button
                  type="button"
                  className="flex h-8 w-7 shrink-0 items-center justify-center rounded text-muted hover:bg-surface-2"
                  aria-expanded={isOpen}
                  aria-controls={listId}
                  aria-label={`${isOpen ? 'Hide' : 'Show'} lessons in unit ${unit.number}`}
                  onClick={() => setOpen((o) => ({ ...o, [unit.slug]: !isOpen }))}
                >
                  <IconChevron className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </button>
                <Link
                  href={unit.href}
                  onClick={onNavigate}
                  aria-current={pathname === trim(unit.href) ? 'page' : undefined}
                  className={`flex min-h-8 flex-1 items-center justify-between gap-2 rounded px-1.5 py-1 font-semibold hover:bg-surface-2 ${
                    currentUnit === unit.slug ? 'text-fg' : 'text-fg/85'
                  }`}
                >
                  <span>
                    <span className="mr-1.5 tabular-nums text-muted">{unit.number}.</span>
                    {unit.title}
                  </span>
                  {hydrated && done > 0 ? (
                    <span className="shrink-0 text-xs font-medium tabular-nums text-muted" aria-label={`${done} of ${unit.lessons.length} lessons done`}>
                      {done}/{unit.lessons.length}
                    </span>
                  ) : null}
                </Link>
              </div>
              <ol id={listId} hidden={!isOpen} className="mb-2 ml-[1.9rem] mt-0.5 space-y-0.5 border-l border-line pl-2">
                {unit.lessons.map((l) => {
                  const current = pathname === trim(l.href);
                  const complete = hydrated && !!progress.completed[l.id];
                  return (
                    <li key={l.id}>
                      <Link
                        href={l.href}
                        onClick={onNavigate}
                        aria-current={current ? 'page' : undefined}
                        className={`flex items-start gap-2 rounded px-2 py-1 leading-snug hover:bg-surface-2 ${
                          current ? 'bg-accent-soft font-semibold text-accent hover:bg-accent-soft' : 'text-fg/90'
                        }`}
                      >
                        <span
                          className={`mt-[0.2rem] flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[0.65rem] ${
                            complete ? 'border-good bg-good text-bg' : 'border-line-strong'
                          }`}
                        >
                          {complete ? <IconCheck strokeWidth={3.5} /> : null}
                        </span>
                        <span>
                          {l.title}
                          {complete ? <span className="sr-only"> (completed)</span> : null}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
