'use client';
// Everything the app remembers lives in this browser's localStorage under "sdp:".
// Reads are validated, so hand-edited or stale data falls back to the default
// instead of breaking a page.
import { useCallback, useSyncExternalStore } from 'react';
import type { z } from 'zod';

const PREFIX = 'sdp:';
const EVENT = 'sdp-storage';

type Entry = { raw: string | null; value: unknown };
const snapshots = new Map<string, Entry>();

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function readStored<T>(key: string, schema: z.ZodType<T>, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const raw = readRaw(key);
  const prev = snapshots.get(key);
  if (prev && prev.raw === raw) return prev.value as T;
  let value: T = fallback;
  if (raw !== null) {
    try {
      const parsed = schema.safeParse(JSON.parse(raw));
      if (parsed.success) value = parsed.data;
    } catch {
      /* not JSON: keep the fallback */
    }
  }
  snapshots.set(key, { raw, value });
  return value;
}

export function writeStored(key: string, value: unknown) {
  try {
    if (value === undefined) window.localStorage.removeItem(PREFIX + key);
    else window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: the page still works, it just won't remember */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}

export function removeStored(key: string) {
  writeStored(key, undefined);
}

/** Every key saved by the app (without the prefix). */
export function listStoredKeys(): string[] {
  const keys: string[] = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k?.startsWith(PREFIX)) keys.push(k.slice(PREFIX.length));
    }
  } catch {
    /* ignore */
  }
  return keys;
}

function subscribe(key: string, onChange: () => void) {
  const onLocal = (e: Event) => {
    const detail = (e as CustomEvent<string>).detail;
    if (detail === key || detail === '*') onChange();
  };
  const onOther = (e: StorageEvent) => {
    if (e.key === null || e.key === PREFIX + key) onChange();
  };
  window.addEventListener(EVENT, onLocal);
  window.addEventListener('storage', onOther);
  return () => {
    window.removeEventListener(EVENT, onLocal);
    window.removeEventListener('storage', onOther);
  };
}

/**
 * Like useState, but saved in localStorage and shared by every component using the same key.
 * The server render (and the first client render) use `fallback`, so hydration never mismatches.
 */
export function useStored<T>(key: string, schema: z.ZodType<T>, fallback: T) {
  const value = useSyncExternalStore(
    useCallback((cb) => subscribe(key, cb), [key]),
    () => readStored(key, schema, fallback),
    () => fallback,
  );
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = readStored(key, schema, fallback);
      const v = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      writeStored(key, v);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );
  return [value, set] as const;
}

/** True after hydration; use to avoid showing saved state before it has been read. */
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
