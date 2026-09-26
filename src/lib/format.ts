/** Number formatting shared by the calculators. */

const nf = new Intl.NumberFormat('en-GB');

/** 12345.678 → "12,346"; 0.4629 → "0.46"; 4.629 → "4.6". Keeps about two significant figures below 10. */
export function fmt(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const a = Math.abs(n);
  if (a === 0) return '0';
  if (a >= 100) return nf.format(Math.round(n));
  if (a >= 10) return nf.format(Math.round(n * 10) / 10);
  if (a >= 1) return nf.format(Math.round(n * 100) / 100);
  const digits = Math.max(2, -Math.floor(Math.log10(a)) + 1);
  return n.toFixed(Math.min(digits, 8)).replace(/0+$/, '').replace(/\.$/, '');
}

/** Whole numbers with separators: 86400 → "86,400". */
export function int(n: number): string {
  return nf.format(Math.round(n));
}

/** Bytes in decimal units (1 KB = 1,000 bytes), as people usually estimate. */
export function bytes(n: number): string {
  const units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let i = 0;
  let v = n;
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000;
    i++;
  }
  return `${fmt(v)} ${units[i]}`;
}

/** Seconds → "43 min 50 s", "8 h 46 min", "3 days 15 h". */
export function duration(seconds: number): string {
  if (!Number.isFinite(seconds)) return '—';
  const s = Math.max(0, seconds);
  if (s < 1) return `${fmt(s * 1000)} ms`;
  if (s < 60) return `${fmt(s)} s`;
  if (s < 3600) {
    const m = Math.floor(s / 60);
    const r = Math.round(s - m * 60);
    return r === 60 ? `${m + 1} min` : r ? `${m} min ${r} s` : `${m} min`;
  }
  if (s < 86400) {
    const h = Math.floor(s / 3600);
    const m = Math.round((s - h * 3600) / 60);
    return m === 60 ? `${h + 1} h` : m ? `${h} h ${m} min` : `${h} h`;
  }
  const d = Math.floor(s / 86400);
  const h = Math.round((s - d * 86400) / 3600);
  const days = `${d} day${d === 1 ? '' : 's'}`;
  return h === 24 ? `${d + 1} days` : h ? `${days} ${h} h` : days;
}
