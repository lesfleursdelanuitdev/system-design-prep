// Availability as downtime (Unit 2, lesson 5).
import { duration } from './format';

export const PERIODS = {
  day: 86_400,
  week: 7 * 86_400,
  /** an average month: 365.25 / 12 days */
  month: (365.25 / 12) * 86_400,
  year: 365.25 * 86_400,
} as const;
export type Period = keyof typeof PERIODS;

export function clampPercent(p: number): number {
  if (!Number.isFinite(p)) return 0;
  return Math.min(100, Math.max(0, p));
}

/** Allowed downtime in seconds for an availability percentage over a period. */
export function downtimeSeconds(percent: number, period: Period): number {
  return (1 - clampPercent(percent) / 100) * PERIODS[period];
}

export function downtimeTable(percent: number): { period: Period; seconds: number; text: string }[] {
  return (Object.keys(PERIODS) as Period[]).map((period) => {
    const seconds = downtimeSeconds(percent, period);
    return { period, seconds, text: duration(seconds) };
  });
}

/** The reverse: given allowed downtime (in minutes) per period, what availability is that? */
export function percentFromDowntime(minutes: number, period: Period): number {
  const s = Math.max(0, minutes) * 60;
  return clampPercent((1 - s / PERIODS[period]) * 100);
}

/** Parts in a row: all must be up, so their availabilities multiply. */
export function inSeries(percents: number[]): number {
  return percents.reduce((acc, p) => acc * (clampPercent(p) / 100), 1) * 100;
}

/** 99.9 → "99.9%", 99.8001 → "99.8001%". Up to four decimals, trailing zeros dropped. */
export function formatPercent(p: number): string {
  return `${Number(clampPercent(p).toFixed(4))}%`;
}
