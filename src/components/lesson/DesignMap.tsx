import Link from 'next/link';
import { getMapLinks } from '@/lib/content';
import { MAP } from '@/lib/map';
import type { MapPart } from '@/lib/schemas';

/**
 * The map of a design's eleven parts. `variant="full"` is the home page's navigation;
 * `variant="strip"` sits at the top of each lesson with the current part highlighted.
 */
export function DesignMap({ current, variant = 'full' }: { current?: MapPart; variant?: 'full' | 'strip' }) {
  const links = getMapLinks();
  if (variant === 'strip') {
    return (
      <nav aria-label="Where this lesson sits in a design" className="no-print">
        <ol className="flex flex-wrap items-center gap-x-1 gap-y-1.5 text-[0.78rem]">
          {MAP.map((m, i) => {
            const on = m.part === current;
            const href = links[m.part];
            const cls = `inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium ${
              on ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface text-muted hover:border-line-strong hover:text-fg'
            }`;
            const body = (
              <>
                <span className="tabular-nums">{i + 1}</span> {m.label}
              </>
            );
            return (
              <li key={m.part} className="flex items-center gap-1">
                {href ? (
                  <Link href={href} className={cls} aria-current={on ? 'step' : undefined}>
                    {body}
                  </Link>
                ) : (
                  <span className={cls} aria-current={on ? 'step' : undefined}>
                    {body}
                  </span>
                )}
                {i < MAP.length - 1 ? (
                  <span aria-hidden="true" className="text-line-strong">
                    →
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  return (
    <nav aria-label="The eleven parts of a design">
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MAP.map((m, i) => {
          const on = m.part === current;
          const href = links[m.part];
          const inner = (
            <>
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums ${
                  on ? 'bg-accent text-on-accent' : 'bg-accent-soft text-accent'
                }`}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">{m.label}</span>
                <span className="block text-sm leading-snug text-muted">{m.question}</span>
              </span>
            </>
          );
          const cls = `flex h-full items-start gap-3 rounded-xl border p-3.5 ${on ? 'border-accent bg-accent-soft' : 'border-line bg-surface'}`;
          return (
            <li key={m.part} className="relative">
              {href ? (
                <Link href={href} className={`${cls} transition-colors hover:border-accent`} aria-current={on ? 'step' : undefined}>
                  {inner}
                </Link>
              ) : (
                <div className={cls}>{inner}</div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
