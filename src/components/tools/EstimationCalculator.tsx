'use client';
import { z } from 'zod';
import { estimate, SHELF_ESTIMATE, type EstimateInput } from '@/lib/estimate';
import { useHydrated, useStored } from '@/lib/storage';
import { ExerciseShell } from '../exercises/Shell';
import { IconReset } from '../icons';
import { NumberField } from './NumberField';

const n = z.number().finite().min(0).max(1e15);
const schema = z.object({ users: n, actionsPerUser: n, peakFactor: n, itemSizeKB: n, itemCount: n });

/** Users → requests per day → per second → peak; items × size → storage. Shows the arithmetic in words. */
export function EstimationCalculator({ storageKey = 'tool:estimate' }: { storageKey?: string }) {
  const [saved, setSaved] = useStored<EstimateInput>(storageKey, schema, SHELF_ESTIMATE);
  const hydrated = useHydrated();
  const input = hydrated ? saved : SHELF_ESTIMATE;
  const r = estimate(input);
  const set = (k: keyof EstimateInput) => (v: number) => setSaved((p) => ({ ...p, [k]: v }));

  return (
    <ExerciseShell
      kind="Calculator"
      title="Back-of-the-envelope estimate"
      intro={<p>Start with Shelf’s numbers, then change them. Every step is shown in words, so you can do it on paper next time.</p>}
      footer={
        <button type="button" className="btn btn-sm" onClick={() => setSaved(SHELF_ESTIMATE)}>
          <IconReset /> Back to Shelf’s numbers
        </button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Users per day" hint="People (or apps) using it on a typical day." value={input.users} onChange={set('users')} step={1} />
        <NumberField label="Requests per user per day" hint="How many times each one asks for something." value={input.actionsPerUser} onChange={set('actionsPerUser')} />
        <NumberField label="Peak factor" hint="How much busier the busiest minute is than average. 2–10 is common." value={input.peakFactor} onChange={set('peakFactor')} min={1} suffix="×" />
        <NumberField label="Items stored" value={input.itemCount} onChange={set('itemCount')} step={1} />
        <NumberField label="Size of one item" hint="Everything stored for one item, roughly." value={input.itemSizeKB} onChange={set('itemSizeKB')} suffix="KB" />
      </div>
      <ol className="mt-5 space-y-3" aria-live="polite">
        {r.steps.map((s, i) => (
          <li key={s.id} className="flex gap-3 rounded-lg border border-line bg-bg px-3 py-2.5">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent">{i + 1}</span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className="font-semibold">{s.label}</span>
                <span className="font-mono text-lg font-bold tabular-nums text-accent">{s.display}</span>
              </div>
              <p className="mt-0.5 text-[0.93rem] text-fg/85">{s.words}</p>
            </div>
          </li>
        ))}
      </ol>
    </ExerciseShell>
  );
}
