'use client';
import { useEffect } from 'react';
import { z } from 'zod';
import { applyTheme, type ThemeChoice } from '@/lib/theme';
import { useHydrated, useStored } from '@/lib/storage';
import { IconMonitor, IconMoon, IconSun } from '../icons';

const choiceSchema = z.enum(['system', 'light', 'dark']);
const ORDER: ThemeChoice[] = ['system', 'light', 'dark'];
const LABEL: Record<ThemeChoice, string> = { system: 'Theme: match system', light: 'Theme: light', dark: 'Theme: dark' };

export function ThemeToggle() {
  const [choice, setChoice] = useStored<ThemeChoice>('theme', choiceSchema, 'system');
  const hydrated = useHydrated();

  useEffect(() => {
    applyTheme(choice);
    if (choice !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [choice]);

  const next = ORDER[(ORDER.indexOf(choice) + 1) % ORDER.length];
  const Icon = choice === 'light' ? IconSun : choice === 'dark' ? IconMoon : IconMonitor;
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm h-9 w-9 !px-0 text-lg"
      onClick={() => setChoice(next)}
      aria-label={`${LABEL[choice]}. Switch to ${next === 'system' ? 'match system' : next}.`}
      title={LABEL[choice]}
      suppressHydrationWarning
    >
      {hydrated ? <Icon /> : <IconMonitor />}
    </button>
  );
}
