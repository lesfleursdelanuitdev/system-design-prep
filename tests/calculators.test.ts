import { describe, expect, it } from 'vitest';
import { downtimeSeconds, downtimeTable, formatPercent, inSeries, percentFromDowntime } from '@/lib/availability';
import { estimate, SHELF_ESTIMATE } from '@/lib/estimate';
import { bytes, duration, fmt } from '@/lib/format';
import { checkScenario, scenarioMarkdown, scenarioSentence, vagueWords } from '@/lib/scenario';

describe('format', () => {
  it('formats numbers for people', () => {
    expect(fmt(12345.678)).toBe('12,346');
    expect(fmt(4.629)).toBe('4.63');
    expect(fmt(17.36)).toBe('17.4');
    expect(fmt(0.4629)).toBe('0.46');
    expect(fmt(0.0123)).toBe('0.012');
    expect(fmt(0)).toBe('0');
  });
  it('formats bytes in decimal units', () => {
    expect(bytes(60_000_000)).toBe('60 MB');
    expect(bytes(1500)).toBe('1.5 KB');
    expect(bytes(12)).toBe('12 bytes');
  });
  it('formats durations', () => {
    expect(duration(2629.8)).toBe('43 min 50 s');
    expect(duration(31557.6)).toBe('8 h 46 min');
    expect(duration(0.25)).toBe('250 ms');
    expect(duration(86.4)).toBe('1 min 26 s');
    expect(duration(3 * 86400 + 15 * 3600)).toBe('3 days 15 h');
  });
});

describe('estimate', () => {
  it('works through Shelf’s numbers step by step', () => {
    const r = estimate(SHELF_ESTIMATE);
    expect(r.perDay).toBe(150_000);
    expect(r.avgPerSecond).toBeCloseTo(1.736, 3);
    expect(r.peakPerSecond).toBeCloseTo(17.36, 2);
    expect(r.storageBytes).toBe(60_000_000);
    expect(r.steps.map((s) => s.id)).toEqual(['per-day', 'avg', 'peak', 'storage']);
    expect(r.steps[0].words).toContain('5,000 users × 30 requests each = 150,000');
    expect(r.steps[1].words).toContain('86,400');
    expect(r.steps[3].display).toBe('60 MB');
  });
  it('explains small rates as “one every N seconds”', () => {
    const r = estimate({ users: 100, actionsPerUser: 10, peakFactor: 5, itemSizeKB: 2, itemCount: 10 });
    expect(r.steps[1].words).toMatch(/one request every 86.4 seconds/);
  });
  it('never goes negative or divides by zero', () => {
    const r = estimate({ users: -5, actionsPerUser: 3, peakFactor: 0, itemSizeKB: -1, itemCount: 10 });
    expect(r.perDay).toBe(0);
    expect(r.peakPerSecond).toBe(0);
    expect(r.storageBytes).toBe(0);
  });
});

describe('availability', () => {
  it('turns nines into downtime', () => {
    expect(downtimeSeconds(99.9, 'month') / 60).toBeCloseTo(43.83, 1);
    expect(downtimeSeconds(99, 'day') / 60).toBeCloseTo(14.4, 5);
    expect(downtimeSeconds(99.99, 'year') / 60).toBeCloseTo(52.6, 1);
    expect(downtimeTable(99.9).find((r) => r.period === 'month')?.text).toBe('43 min 50 s');
  });
  it('turns downtime back into a percentage', () => {
    expect(percentFromDowntime(43.83, 'month')).toBeCloseTo(99.9, 3);
    expect(percentFromDowntime(0, 'week')).toBe(100);
    expect(percentFromDowntime(1e9, 'day')).toBe(0);
  });
  it('multiplies parts in series', () => {
    expect(inSeries([99.9, 99.9])).toBeCloseTo(99.8001, 6);
    expect(formatPercent(inSeries([99.9, 99.9]))).toBe('99.8001%');
    expect(formatPercent(99.9)).toBe('99.9%');
    expect(formatPercent(150)).toBe('100%');
  });
});

describe('quality scenarios', () => {
  const good = {
    source: 'The recipe site',
    stimulus: 'pushes 500 changed items in one request',
    environment: 'during normal traffic',
    response: 'Shelf applies every change and makes it visible in lookups',
    measure: 'within 10 seconds for 95% of such batches',
  };
  it('accepts a complete, measurable scenario', () => {
    expect(checkScenario(good)).toEqual([]);
  });
  it('flags missing parts', () => {
    const issues = checkScenario({ ...good, environment: '  ' });
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ field: 'environment', level: 'error' });
  });
  it('flags a measure with no number', () => {
    const issues = checkScenario({ ...good, measure: 'quickly' });
    expect(issues.some((i) => i.level === 'error' && /no number/.test(i.message))).toBe(true);
    expect(issues.some((i) => /“quickly” is a wish/.test(i.message))).toBe(true);
  });
  it('flags a number without a unit', () => {
    expect(checkScenario({ ...good, measure: 'within 10' }).some((i) => i.level === 'warn' && /Say what the number counts/.test(i.message))).toBe(true);
  });
  it('suggests a percentile for a bare time', () => {
    expect(checkScenario({ ...good, measure: 'within 200 ms' }).some((i) => i.level === 'tip')).toBe(true);
    expect(checkScenario({ ...good, measure: 'within 200 ms for all requests' })).toEqual([]);
  });
  it('finds vague words', () => {
    expect(vagueWords('Fast and user-friendly, reliably')).toEqual(['fast', 'user-friendly', 'reliably']);
  });
  it('writes a sentence and a markdown table', () => {
    expect(scenarioSentence(good)).toBe(
      'When the recipe site pushes 500 changed items in one request (during normal traffic), Shelf applies every change and makes it visible in lookups, within 10 seconds for 95% of such batches.',
    );
    const md = scenarioMarkdown(good);
    expect(md).toContain('| Measure | within 10 seconds for 95% of such batches |');
  });
});
