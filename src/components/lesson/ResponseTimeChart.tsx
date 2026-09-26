'use client';
import { useId, useState } from 'react';

// Twenty requests from one quiet minute, in milliseconds, slowest last.
const NORMAL = [45, 52, 58, 61, 64, 68, 70, 73, 77, 80, 84, 88, 93, 99, 107, 118, 135, 160, 210, 380];
const STUCK = [...NORMAL.slice(0, -1), 3000];

export function stats(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  // Nearest-rank percentile: the value at or below which p% of requests fall.
  const pct = (p: number) => sorted[Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)];
  return { sorted, avg, p50: pct(50), p95: pct(95), max: sorted[sorted.length - 1] };
}

const W = 640;
const H = 280;
const PAD = { l: 48, r: 118, t: 16, b: 34 };
const CAP = 500; // the axis stops here; taller bars are drawn broken
const TICKS = [0, 100, 200, 300, 400, 500];

/** Twenty response times as columns, with the average, median and 95th percentile drawn across. */
export function ResponseTimeChart() {
  const [stuck, setStuck] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const id = useId();
  const data = stuck ? STUCK : NORMAL;
  const s = stats(data);
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const slot = plotW / data.length;
  const barW = Math.min(24, slot - 2);
  const y = (v: number) => PAD.t + plotH - (Math.min(v, CAP) / CAP) * plotH;
  const lines = [
    { key: 'avg', label: 'Average', value: s.avg, color: 'var(--trade-line)' },
    { key: 'p50', label: 'Median (p50)', value: s.p50, color: 'var(--muted)' },
    { key: 'p95', label: '95th percentile', value: s.p95, color: 'var(--note-line)' },
  ];
  // Keep the right-hand labels from overlapping.
  const labelYs = lines.map((l) => y(l.value)).map((v) => v);
  const order = lines.map((_, i) => i).sort((a, b) => labelYs[a] - labelYs[b]);
  for (let k = 1; k < order.length; k++) {
    const prev = labelYs[order[k - 1]];
    if (labelYs[order[k]] - prev < 26) labelYs[order[k]] = prev + 26;
  }

  return (
    <figure className="my-6 overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2">
        <div className="text-sm font-semibold">Twenty requests, slowest on the right (milliseconds)</div>
        <div className="flex gap-1" role="group" aria-label="Which minute to show">
          <button type="button" className={`btn btn-sm ${!stuck ? 'btn-primary' : ''}`} aria-pressed={!stuck} onClick={() => setStuck(false)}>
            A normal minute
          </button>
          <button type="button" className={`btn btn-sm ${stuck ? 'btn-primary' : ''}`} aria-pressed={stuck} onClick={() => setStuck(true)}>
            One request gets stuck
          </button>
        </div>
      </div>
      <div className="px-2 pt-3 sm:px-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-labelledby={`${id}-t`} aria-describedby={`${id}-d`}>
          <title id={`${id}-t`}>Response times of twenty requests</title>
          {TICKS.map((t) => (
            <g key={t}>
              <line x1={PAD.l} x2={PAD.l + plotW} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
              <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" fontSize="12" fill="var(--muted)">
                {t}
              </text>
            </g>
          ))}
          {data.map((v, i) => {
            const x = PAD.l + i * slot + (slot - barW) / 2;
            const top = y(v);
            const h = PAD.t + plotH - top;
            const broken = v > CAP;
            const r = Math.min(4, h);
            const on = hover === i;
            return (
              <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                <rect x={PAD.l + i * slot} y={PAD.t} width={slot} height={plotH} fill="transparent" />
                <path
                  d={`M${x},${top + h} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${top + h} Z`}
                  fill="var(--accent)"
                  opacity={on ? 1 : broken ? 0.9 : 0.5}
                />
                {broken ? (
                  <>
                    <path d={`M${x - 2},${top + 22} l${barW + 4},-6 v6 l${-barW - 4},6 Z`} fill="var(--surface)" />
                    <text x={x + barW / 2} y={top - 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--text)">
                      {v.toLocaleString('en-GB')}
                    </text>
                  </>
                ) : on ? (
                  <text x={x + barW / 2} y={top - 5} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--text)">
                    {v}
                  </text>
                ) : null}
              </g>
            );
          })}
          {lines.map((l, i) => (
            <g key={l.key}>
              <line x1={PAD.l} x2={PAD.l + plotW + 6} y1={y(l.value)} y2={y(l.value)} stroke={l.color} strokeWidth={2} strokeLinecap="round" />
              <line x1={PAD.l + plotW + 6} x2={PAD.l + plotW + 12} y1={y(l.value)} y2={labelYs[i]} stroke={l.color} strokeWidth={1} />
              <text x={PAD.l + plotW + 16} y={labelYs[i] - 2} fontSize="12" fill="var(--muted)">
                {l.label}
              </text>
              <text x={PAD.l + plotW + 16} y={labelYs[i] + 12} fontSize="13" fontWeight="700" fill="var(--text)">
                {Math.round(l.value)} ms
              </text>
            </g>
          ))}
          <text x={PAD.l} y={H - 8} fontSize="12" fill="var(--muted)">
            fastest
          </text>
          <text x={PAD.l + plotW} y={H - 8} fontSize="12" fill="var(--muted)" textAnchor="end">
            slowest
          </text>
        </svg>
      </div>
      <figcaption id={`${id}-d`} className="border-t border-line bg-surface-2 px-4 py-3 text-[0.9rem] leading-relaxed" aria-live="polite">
        <span className="font-semibold">In words: </span>
        {stuck ? (
          <>
            One request took 3,000 ms instead of 380. The average jumped from {Math.round(stats(NORMAL).avg)} to {Math.round(s.avg)} ms, yet 19 of the 20 people saw exactly what they saw
            before. The median ({s.p50} ms) and the 95th percentile ({s.p95} ms) didn’t move. The average now describes nobody’s experience.
          </>
        ) : (
          <>
            Most requests take 45–160 ms; a few are slower. The average is {Math.round(s.avg)} ms, the median {s.p50} ms. The 95th percentile is {s.p95} ms: 19 of
            the 20 requests finished in {s.p95} ms or less.
          </>
        )}
      </figcaption>
      <details className="border-t border-line text-sm">
        <summary className="cursor-pointer px-4 py-2 text-muted hover:text-fg">Show the numbers as a table</summary>
        <div className="px-4 pb-3">
          <table className="data">
            <thead>
              <tr>
                <th scope="col">Request (fastest first)</th>
                <th scope="col">Time (ms)</th>
              </tr>
            </thead>
            <tbody>
              {s.sorted.map((v, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td className="tabular-nums">{v.toLocaleString('en-GB')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
