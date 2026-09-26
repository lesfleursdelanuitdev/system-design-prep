import type { ReactNode } from 'react';
import { IconChevron } from '../icons';

/** Optional extra detail for readers who want more. Closed by default. */
export function GoDeeper({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="deeper rounded-lg border border-line bg-surface">
      <summary className="flex items-center gap-2 px-4 py-2.5 font-semibold">
        <IconChevron className="chev shrink-0 text-muted" />
        <span>
          <span className="mr-2 text-xs font-bold uppercase tracking-wider text-accent">Go deeper</span>
          {title}
        </span>
      </summary>
      <div className="space-y-3 border-t border-line px-4 pb-4 pt-3 text-[0.97rem] [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </details>
  );
}
