// Back-of-the-envelope estimation (Unit 2, lesson 4).
import { bytes, fmt, int } from './format';

export type EstimateInput = {
  /** people (or apps) using the system on a typical day */
  users: number;
  /** requests each one makes per day */
  actionsPerUser: number;
  /** how much busier the busiest moment is than the average, e.g. 10 */
  peakFactor: number;
  /** size of one stored item, in KB (1 KB = 1,000 bytes) */
  itemSizeKB: number;
  /** how many items are stored */
  itemCount: number;
};

export type EstimateStep = { id: string; label: string; words: string; value: number; display: string };

export const SECONDS_PER_DAY = 86_400;

export function estimate(input: EstimateInput): { steps: EstimateStep[]; perDay: number; avgPerSecond: number; peakPerSecond: number; storageBytes: number } {
  const users = Math.max(0, input.users);
  const actions = Math.max(0, input.actionsPerUser);
  const peak = Math.max(1, input.peakFactor);
  const perDay = users * actions;
  const avg = perDay / SECONDS_PER_DAY;
  const peakPs = avg * peak;
  const storage = Math.max(0, input.itemCount) * Math.max(0, input.itemSizeKB) * 1000;

  const every = avg > 0 && avg < 1 ? ` That’s about one request every ${fmt(1 / avg)} seconds.` : '';
  const steps: EstimateStep[] = [
    {
      id: 'per-day',
      label: 'Requests per day',
      words: `${int(users)} users × ${fmt(actions)} requests each = ${int(perDay)} requests a day.`,
      value: perDay,
      display: int(perDay),
    },
    {
      id: 'avg',
      label: 'Average requests per second',
      words: `A day has ${int(SECONDS_PER_DAY)} seconds. ${int(perDay)} ÷ ${int(SECONDS_PER_DAY)} ≈ ${fmt(avg)} requests per second.${every}`,
      value: avg,
      display: fmt(avg),
    },
    {
      id: 'peak',
      label: 'Peak requests per second',
      words: `Traffic isn’t spread evenly. At the busiest moment it runs about ${fmt(peak)}× the average: ${fmt(avg)} × ${fmt(peak)} ≈ ${fmt(peakPs)} requests per second. Design for this number, not the average.`,
      value: peakPs,
      display: fmt(peakPs),
    },
    {
      id: 'storage',
      label: 'Storage',
      words: `${int(input.itemCount)} items × ${fmt(input.itemSizeKB)} KB each = ${bytes(storage)}. Indexes and backups add more, so leave room for two or three times this.`,
      value: storage,
      display: bytes(storage),
    },
  ];
  return { steps, perDay, avgPerSecond: avg, peakPerSecond: peakPs, storageBytes: storage };
}

/** Shelf's own numbers (see content/reference/shelf-design.md). */
export const SHELF_ESTIMATE: EstimateInput = { users: 5000, actionsPerUser: 30, peakFactor: 10, itemSizeKB: 1, itemCount: 60000 };
