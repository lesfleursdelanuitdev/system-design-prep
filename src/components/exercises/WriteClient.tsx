'use client';
import { useId, useMemo, useState, type ReactNode } from 'react';
import { z } from 'zod';
import { useHydrated, useStored } from '@/lib/storage';
import { IconReset } from '../icons';
import { ExerciseShell, Rich } from './Shell';

const stateSchema = z.object({
  text: z.string().max(50_000).default(''),
  checked: z.array(z.number().int().min(0).max(50)).default([]),
  revealed: z.boolean().default(false),
});
type State = z.infer<typeof stateSchema>;

/** Free writing with hints, a model answer to compare against, and a self-check list. No automatic marking. */
export function WriteClient({
  id,
  title,
  intro,
  prompt,
  starter = '',
  hints,
  checklist,
  modelAnswer,
  rows = 8,
}: {
  id: string;
  title?: string;
  intro?: ReactNode;
  prompt: ReactNode;
  starter?: string;
  hints: ReactNode[];
  checklist: ReactNode[];
  modelAnswer: ReactNode;
  rows?: number;
}) {
  const empty: State = useMemo(() => ({ text: starter, checked: [], revealed: false }), [starter]);
  const [state, setState] = useStored(`ex:${id}`, stateSchema, empty);
  const hydrated = useHydrated();
  const [hintsShown, setHintsShown] = useState(0);
  const fieldId = useId();
  const s = hydrated ? state : empty;

  return (
    <ExerciseShell
      kind="Write it"
      title={title}
      intro={intro}
      id={id}
      footer={
        <>
          <span className="text-sm text-muted">Your answer is saved in this browser as you type.</span>
          <button
            type="button"
            className="btn btn-sm ml-auto"
            onClick={() => {
              if (s.text === starter || window.confirm('Clear your answer and start again?')) {
                setState({ text: starter, checked: [], revealed: false });
                setHintsShown(0);
              }
            }}
          >
            <IconReset /> Start again
          </button>
        </>
      }
    >
      <Rich className="mb-3">{prompt}</Rich>
      <label htmlFor={fieldId} className="label">
        Your answer
      </label>
      <textarea
        id={fieldId}
        className="field"
        rows={rows}
        value={s.text}
        onChange={(e) => setState((p) => ({ ...p, text: e.target.value }))}
        spellCheck
      />
      {hints.length > 0 ? (
        <div className="mt-3">
          {hints.slice(0, hintsShown).map((h, i) => (
            <div key={i} className="callout callout-tip mb-2 !py-2 text-[0.93rem]">
              <span className="font-semibold text-[var(--tip-ink)]">Hint {i + 1}: </span>
              <Rich as="span">{h}</Rich>
            </div>
          ))}
          {hintsShown < hints.length ? (
            <button type="button" className="btn btn-sm" onClick={() => setHintsShown((n) => n + 1)}>
              {hintsShown === 0 ? 'Show a hint' : 'Show another hint'}
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="mt-4">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          aria-expanded={s.revealed}
          onClick={() => setState((p) => ({ ...p, revealed: !p.revealed }))}
        >
          {s.revealed ? 'Hide the model answer' : 'Compare with a model answer'}
        </button>
      </div>
      {s.revealed ? (
        <div className="mt-3 rounded-lg border border-accent/40 bg-accent-soft/50 px-4 py-3">
          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-accent">One good answer</div>
          <Rich>{modelAnswer}</Rich>
          <p className="hint mt-2">Yours doesn’t need to match word for word. Check it against the list below.</p>
        </div>
      ) : null}
      {checklist.length > 0 ? (
        <fieldset className="mt-4">
          <legend className="label">Check your answer. Does it…</legend>
          <ul className="space-y-1.5">
            {checklist.map((c, i) => (
              <li key={i}>
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
                    checked={s.checked.includes(i)}
                    onChange={(e) =>
                      setState((p) => ({ ...p, checked: e.target.checked ? [...p.checked, i] : p.checked.filter((x) => x !== i) }))
                    }
                  />
                  <Rich as="span">{c}</Rich>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      ) : null}
    </ExerciseShell>
  );
}
