import type { ReactNode } from 'react';
import { IconCheck, IconCross } from '../icons';

/** Two (or three) things side by side, e.g. a vague wish next to a measurable requirement. */
export function Compare({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">{children}</div>;
}

export function Side({ title, tone = 'neutral', children }: { title: string; tone?: 'good' | 'bad' | 'neutral'; children: ReactNode }) {
  const ring = tone === 'good' ? 'border-good/50 bg-good-soft' : tone === 'bad' ? 'border-bad/40 bg-bad-soft' : 'border-line bg-surface';
  const ink = tone === 'good' ? 'text-good' : tone === 'bad' ? 'text-bad' : 'text-muted';
  return (
    <div className={`rounded-lg border px-4 py-3 text-[0.97rem] ${ring}`}>
      <div className={`mb-1.5 flex items-center gap-1.5 text-sm font-bold ${ink}`}>
        {tone === 'good' ? <IconCheck /> : tone === 'bad' ? <IconCross /> : null}
        {title}
      </div>
      <div className="space-y-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:text-[0.78rem] [&_ul]:list-disc [&_ul]:pl-5">{children}</div>
    </div>
  );
}
