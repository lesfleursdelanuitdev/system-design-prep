import type { ReactNode } from 'react';
import { IconAlert, IconBulb, IconChat, IconInfo, IconScale, IconShelf } from '../icons';

const TYPES = {
  note: { title: 'Note', Icon: IconInfo },
  tip: { title: 'Tip', Icon: IconBulb },
  warning: { title: 'Watch out', Icon: IconAlert },
  tradeoff: { title: 'Trade-off', Icon: IconScale },
  shelf: { title: 'In Shelf', Icon: IconShelf },
  story: { title: 'A short story', Icon: IconChat },
} as const;

export type CalloutType = keyof typeof TYPES;

export function Callout({ type = 'note', title, children }: { type?: CalloutType; title?: string; children: ReactNode }) {
  const t = TYPES[type] ?? TYPES.note;
  return (
    <aside className={`callout callout-${type}`} aria-label={title ?? t.title}>
      <div className="callout-title">
        <t.Icon className="shrink-0 text-base" />
        <span>{title ?? t.title}</span>
      </div>
      <div className="callout-body">{children}</div>
    </aside>
  );
}
