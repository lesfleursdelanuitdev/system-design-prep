'use client';
import Link from 'next/link';
import type { OutlineUnit } from '@/lib/content';
import { useProgress } from '@/lib/progress';
import { useHydrated } from '@/lib/storage';
import { IconArrowRight, IconCheck } from '../icons';

/** Home page: “Start” for new visitors, “Continue” with progress for returning ones. */
export function ContinueLink({ outline }: { outline: OutlineUnit[] }) {
  const { progress } = useProgress();
  const hydrated = useHydrated();
  const lessons = outline.flatMap((u) => u.lessons.map((l) => ({ ...l, unit: u })));
  const first = lessons[0];
  const done = hydrated ? lessons.filter((l) => progress.completed[l.id]).length : 0;
  const last = hydrated ? lessons.find((l) => l.id === progress.last) : undefined;
  const nextUndone = hydrated ? lessons.find((l) => !progress.completed[l.id]) : undefined;
  const target = last && !progress.completed[last.id] ? last : (nextUndone ?? last ?? first);
  if (!first) return null;
  const started = hydrated && (done > 0 || !!last);
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <Link href={started ? target.href : first.href} className="btn btn-primary !px-5 text-base">
        {started ? 'Continue' : 'Start with Unit 1'} <IconArrowRight />
      </Link>
      {started ? (
        <span className="text-sm text-muted">
          {done} of {lessons.length} lessons done · next: <span className="font-medium text-fg">{target.title}</span>
        </span>
      ) : (
        <span className="text-sm text-muted">
          {lessons.length} short lessons · about {lessons.reduce((a, l) => a + l.minutes, 0)} minutes in all
        </span>
      )}
    </div>
  );
}

export function UnitProgress({ ids }: { ids: string[] }) {
  const { progress } = useProgress();
  const hydrated = useHydrated();
  if (!hydrated) return null;
  const done = ids.filter((id) => progress.completed[id]).length;
  if (done === 0) return null;
  return (
    <span className="tag" aria-label={`${done} of ${ids.length} lessons done`}>
      {done === ids.length ? <IconCheck className="text-good" /> : null}
      {done}/{ids.length}
    </span>
  );
}
