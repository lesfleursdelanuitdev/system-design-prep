'use client';
import { useId, useState } from 'react';
import { downtimeTable, formatPercent, inSeries, percentFromDowntime, type Period } from '@/lib/availability';
import { ExerciseShell } from '../exercises/Shell';
import { NumberField } from './NumberField';

const PRESETS = [99, 99.5, 99.9, 99.95, 99.99];
const PERIOD_LABEL: Record<Period, string> = { day: 'per day', week: 'per week', month: 'per month', year: 'per year' };

/** Percentage ↔ downtime, plus what happens when parts are chained. */
export function AvailabilityCalculator() {
  const [percent, setPercent] = useState(99.9);
  const [minutes, setMinutes] = useState(60);
  const [period, setPeriod] = useState<Period>('month');
  const [chain, setChain] = useState<number[]>([99.9, 99.9]);
  const rows = downtimeTable(percent);
  const periodId = useId();

  return (
    <ExerciseShell kind="Calculator" title="Availability in real time" intro={<p>Pick a percentage to see how much downtime it allows. Or go the other way.</p>}>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Common targets">
        {PRESETS.map((p) => (
          <button key={p} type="button" className={`btn btn-sm ${percent === p ? 'btn-primary' : ''}`} aria-pressed={percent === p} onClick={() => setPercent(p)}>
            {p}%
          </button>
        ))}
      </div>
      <div className="mt-3 max-w-xs">
        <NumberField label="Availability" value={percent} onChange={(v) => setPercent(Math.min(100, v))} step={0.01} suffix="%" />
      </div>
      <div className="table-wrap mt-3">
        <table className="data">
          <caption className="sr-only">Allowed downtime at {formatPercent(percent)}</caption>
          <thead>
            <tr>
              <th scope="col">Period</th>
              <th scope="col">Allowed downtime at {formatPercent(percent)}</th>
            </tr>
          </thead>
          <tbody aria-live="polite">
            {rows.map((r) => (
              <tr key={r.period}>
                <td>{PERIOD_LABEL[r.period]}</td>
                <td className="font-mono font-semibold tabular-nums">{r.text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h4 className="mt-6 font-bold">The other way round</h4>
      <div className="mt-2 flex flex-wrap items-end gap-3">
        <div className="w-36">
          <NumberField label="Downtime" value={minutes} onChange={setMinutes} suffix="min" />
        </div>
        <div>
          <label className="label" htmlFor={periodId}>
            Every
          </label>
          <select id={periodId} className="field" value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
            <option value="day">day</option>
            <option value="week">week</option>
            <option value="month">month</option>
            <option value="year">year</option>
          </select>
        </div>
        <p className="pb-2 text-[0.95rem]" aria-live="polite">
          = <strong className="font-mono">{formatPercent(percentFromDowntime(minutes, period))}</strong> available
        </p>
      </div>

      <h4 className="mt-6 font-bold">Parts in a row</h4>
      <p className="hint mt-1">If a request needs every part to be up, their availabilities multiply, so the whole is less available than any part.</p>
      <div className="mt-2 flex flex-wrap items-end gap-2">
        {chain.map((c, i) => (
          <div key={i} className="flex items-end gap-2">
            <div className="w-28">
              <NumberField label={`Part ${i + 1}`} value={c} onChange={(v) => setChain((a) => a.map((x, j) => (j === i ? Math.min(100, v) : x)))} step={0.01} suffix="%" />
            </div>
            {i < chain.length - 1 ? <span className="pb-2 text-muted">×</span> : null}
          </div>
        ))}
        <div className="flex gap-1 pb-0.5">
          <button type="button" className="btn btn-sm" onClick={() => setChain((a) => [...a, 99.9])} disabled={chain.length >= 5}>
            Add a part
          </button>
          <button type="button" className="btn btn-sm" onClick={() => setChain((a) => a.slice(0, -1))} disabled={chain.length <= 2}>
            Remove
          </button>
        </div>
      </div>
      <p className="mt-2 text-[0.95rem]" aria-live="polite">
        Together: <strong className="font-mono">{formatPercent(inSeries(chain))}</strong>, which allows{' '}
        <strong>{downtimeTable(inSeries(chain)).find((r) => r.period === 'month')?.text}</strong> of downtime a month.
      </p>
    </ExerciseShell>
  );
}
