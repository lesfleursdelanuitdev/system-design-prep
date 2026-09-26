'use client';
import type { ReactNode } from 'react';
import { z } from 'zod';
import { useHydrated, useStored } from '@/lib/storage';
import { IconCheck, IconCross, IconReset } from '../icons';
import { ExerciseShell, Rich } from './Shell';

export type SortView = {
  buckets: { id: string; label: string; hint?: string }[];
  items: { text: ReactNode; bucket: string; reason: ReactNode }[];
};

const stateSchema = z.object({ placed: z.record(z.string(), z.string().max(80)) });
type State = z.infer<typeof stateSchema>;
const EMPTY: State = { placed: {} };

/** Put each item in a bucket; each placement shows right or wrong, and why. */
export function SortClient({ id, title, intro, buckets, items }: { id: string; title?: string; intro?: ReactNode } & SortView) {
  const [state, setState] = useStored(`ex:${id}`, stateSchema, EMPTY);
  const hydrated = useHydrated();
  const placed = hydrated ? state.placed : {};
  const count = items.filter((_, i) => placed[i]).length;
  const right = items.filter((it, i) => placed[i] === it.bucket).length;
  const label = (b: string) => buckets.find((x) => x.id === b)?.label ?? b;

  return (
    <ExerciseShell
      kind="Sort"
      title={title}
      intro={intro}
      id={id}
      footer={
        <>
          <span className="text-sm text-muted" aria-live="polite">
            {count === items.length ? (
              <strong className="text-fg">
                {right} of {items.length} in the right place.
                {right === items.length ? ' All correct.' : ' Try moving the ones marked ✗.'}
              </strong>
            ) : (
              `${count} of ${items.length} sorted`
            )}
          </span>
          {count > 0 ? (
            <button type="button" className="btn btn-sm ml-auto" onClick={() => setState(EMPTY)}>
              <IconReset /> Start again
            </button>
          ) : null}
        </>
      }
    >
      <div className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
        {buckets.map((b) => (
          <div key={b.id} className="rounded-md border border-dashed border-line-strong px-3 py-2">
            <div className="font-semibold">{b.label}</div>
            {b.hint ? <div className="hint">{b.hint}</div> : null}
          </div>
        ))}
      </div>
      <ol className="space-y-3">
        {items.map((it, i) => {
          const where = placed[i];
          const ok = where === it.bucket;
          return (
            <li
              key={i}
              className={`rounded-lg border px-3 py-3 ${where ? (ok ? 'border-good/60 bg-good-soft' : 'border-bad/50 bg-bad-soft') : 'border-line'}`}
            >
              <div className="flex items-start gap-2">
                <span className="mt-0.5 w-5 shrink-0 text-right text-sm tabular-nums text-muted">{i + 1}.</span>
                <Rich className="min-w-0 flex-1 font-medium">{it.text}</Rich>
                {where ? (
                  ok ? (
                    <IconCheck className="mt-1 shrink-0 text-good" title="Right bucket" />
                  ) : (
                    <IconCross className="mt-1 shrink-0 text-bad" title="Wrong bucket" />
                  )
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 pl-7" role="group" aria-label={`Where does item ${i + 1} go?`}>
                {buckets.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    aria-pressed={where === b.id}
                    className={`btn btn-sm ${where === b.id ? (ok ? '!border-good !bg-good !text-bg' : '!border-bad !bg-bad !text-bg') : ''}`}
                    onClick={() => setState((s) => ({ placed: { ...s.placed, [i]: b.id } }))}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              {where ? (
                <div className="mt-2 pl-7 text-[0.93rem] text-fg/85" aria-live="polite">
                  <strong className={ok ? 'text-good' : 'text-bad'}>{ok ? 'Right: ' : `Not “${label(where)}”: `}</strong>
                  {!ok ? <span>it belongs in “{label(it.bucket)}”. </span> : null}
                  <Rich as="span">{it.reason}</Rich>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </ExerciseShell>
  );
}
