'use client';
import { useMemo, type ReactNode } from 'react';
import { z } from 'zod';
import { useHydrated, useStored } from '@/lib/storage';
import { IconReset } from '../icons';
import { MermaidView } from '../lesson/MermaidView';
import { MermaidEditor } from '../tools/MermaidEditor';
import { ExerciseShell, Rich } from './Shell';

const schema = z.object({ code: z.string().max(100_000), revealed: z.boolean().default(false), checked: z.array(z.number().int().min(0).max(50)).default([]) });

/** Draw a diagram in Mermaid, then compare with a model answer. */
export function DiagramExerciseClient({
  id,
  title,
  intro,
  prompt,
  starter,
  hints,
  modelAnswer,
  modelDescription,
  checklist,
}: {
  id: string;
  title?: string;
  intro?: ReactNode;
  prompt: ReactNode;
  starter: string;
  hints: ReactNode[];
  modelAnswer: string;
  modelDescription: string;
  checklist: ReactNode[];
}) {
  const empty = useMemo(() => ({ code: starter, revealed: false, checked: [] as number[] }), [starter]);
  const [saved, setSaved] = useStored(`ex:${id}`, schema, empty);
  const hydrated = useHydrated();
  const s = hydrated ? saved : empty;

  return (
    <ExerciseShell
      kind="Draw it"
      title={title}
      intro={intro}
      id={id}
      footer={
        <>
          <span className="text-sm text-muted">Saved in this browser as you type.</span>
          <button
            type="button"
            className="btn btn-sm ml-auto"
            onClick={() => {
              if (s.code === starter || window.confirm('Go back to the starting diagram?')) setSaved(empty);
            }}
          >
            <IconReset /> Start again
          </button>
        </>
      }
    >
      <Rich className="mb-3">{prompt}</Rich>
      {hints.length ? (
        <details className="mb-3 rounded-md border border-line px-3 py-2 text-[0.93rem]">
          <summary className="cursor-pointer font-semibold">Hints</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {hints.map((h, i) => (
              <li key={i}>
                <Rich as="span">{h}</Rich>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      <MermaidEditor value={s.code} onChange={(code) => setSaved((p) => ({ ...p, code }))} layout="stack" rows={12} label="Your diagram (Mermaid)" />
      <div className="mt-4">
        <button type="button" className="btn btn-primary btn-sm" aria-expanded={s.revealed} onClick={() => setSaved((p) => ({ ...p, revealed: !p.revealed }))}>
          {s.revealed ? 'Hide the model answer' : 'Compare with a model answer'}
        </button>
      </div>
      {s.revealed ? (
        <div className="mt-3 rounded-lg border border-accent/40 bg-accent-soft/40 p-3">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-accent">One good answer</div>
          <div className="rounded-md bg-surface p-2">
            <MermaidView code={modelAnswer} label="Model answer diagram" />
          </div>
          <p className="mt-2 text-[0.93rem]">
            <strong>In words: </strong>
            {modelDescription}
          </p>
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer text-muted">Show its Mermaid source</summary>
            <pre className="code mt-2">{modelAnswer.trim()}</pre>
          </details>
        </div>
      ) : null}
      {checklist.length ? (
        <fieldset className="mt-4">
          <legend className="label">Check your diagram. Does it…</legend>
          <ul className="space-y-1.5">
            {checklist.map((c, i) => (
              <li key={i}>
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
                    checked={s.checked.includes(i)}
                    onChange={(e) => setSaved((p) => ({ ...p, checked: e.target.checked ? [...p.checked, i] : p.checked.filter((x) => x !== i) }))}
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
