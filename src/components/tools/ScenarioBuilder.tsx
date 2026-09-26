'use client';
import { useId, useMemo, useState, type ReactNode } from 'react';
import { z } from 'zod';
import { checkScenario, SCENARIO_FIELDS, scenarioMarkdown, scenarioSentence, type Issue } from '@/lib/scenario';
import type { ScenarioParts } from '@/lib/schemas';
import { useHydrated, useStored } from '@/lib/storage';
import { ExerciseShell, Rich } from '../exercises/Shell';
import { IconAlert, IconCheck, IconInfo, IconReset } from '../icons';
import { CopyButton } from './CopyButton';

const partsSchema = z.object({
  source: z.string().max(500).default(''),
  stimulus: z.string().max(500).default(''),
  environment: z.string().max(500).default(''),
  response: z.string().max(500).default(''),
  measure: z.string().max(500).default(''),
  revealed: z.boolean().default(false),
});
type Saved = z.infer<typeof partsSchema>;

export type ScenarioExerciseView = {
  id: string;
  title?: string;
  intro?: ReactNode;
  prompt: ReactNode;
  starter?: Partial<ScenarioParts>;
  modelAnswer: ScenarioParts;
  notes?: ReactNode;
};

const ICON = { error: IconAlert, warn: IconAlert, tip: IconInfo };
const TONE = { error: 'text-bad', warn: 'text-[var(--warn-ink)]', tip: 'text-muted' };

/** Five fields with hints; flags a missing or unmeasurable measure. */
export function ScenarioBuilder({ storageKey = 'tool:scenario', exercise }: { storageKey?: string; exercise?: ScenarioExerciseView }) {
  const empty: Saved = useMemo(
    () => ({ source: '', stimulus: '', environment: '', response: '', measure: '', ...(exercise?.starter ?? {}), revealed: false }),
    [exercise?.starter],
  );
  const [saved, setSaved] = useStored<Saved>(storageKey, partsSchema, empty);
  const hydrated = useHydrated();
  const v = hydrated ? saved : empty;
  const [touched, setTouched] = useState(false);
  const issues = checkScenario(v);
  const baseId = useId();
  const byField = (k: keyof ScenarioParts) => issues.filter((i) => i.field === k && (touched || i.level !== 'error' || v[k].trim()));
  const complete = issues.filter((i) => i.level !== 'tip').length === 0;

  return (
    <ExerciseShell
      kind={exercise ? 'Build it' : 'Builder'}
      title={exercise?.title ?? 'Quality-scenario builder'}
      intro={exercise?.intro ?? <p>Describe one situation the system must handle well, in five parts. The measure must be a number someone could check.</p>}
      id={exercise?.id}
      footer={
        <>
          <CopyButton text={() => scenarioMarkdown(v)} label="Copy as markdown" />
          <button
            type="button"
            className="btn btn-sm ml-auto"
            onClick={() => {
              setSaved(empty);
              setTouched(false);
            }}
          >
            <IconReset /> Clear
          </button>
        </>
      }
    >
      {exercise ? <Rich className="mb-4">{exercise.prompt}</Rich> : null}
      <div className="space-y-4">
        {SCENARIO_FIELDS.map((f) => {
          const id = `${baseId}-${f.key}`;
          const fieldIssues = byField(f.key);
          return (
            <div key={f.key}>
              <label htmlFor={id} className="label">
                {f.label} <span className="font-normal text-muted">· {f.question}</span>
              </label>
              <input
                id={id}
                className="field"
                value={v[f.key]}
                placeholder={`e.g. ${f.example}`}
                aria-invalid={fieldIssues.some((i) => i.level === 'error') || undefined}
                aria-describedby={fieldIssues.length ? `${id}-issues` : undefined}
                onChange={(e) => setSaved((p) => ({ ...p, [f.key]: e.target.value }))}
                onBlur={() => setTouched(true)}
              />
              {fieldIssues.length ? (
                <ul id={`${id}-issues`} className="mt-1 space-y-0.5">
                  {fieldIssues.map((i: Issue, n) => {
                    const Icon = ICON[i.level];
                    return (
                      <li key={n} className={`flex items-start gap-1.5 text-[0.85rem] ${TONE[i.level]}`}>
                        <Icon className="mt-0.5 shrink-0" />
                        <span>{i.message}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className={`mt-5 rounded-lg border px-4 py-3 ${complete ? 'border-good/50 bg-good-soft' : 'border-line bg-bg'}`} aria-live="polite">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
          {complete ? <IconCheck className="text-good" /> : null} Your scenario, as one sentence
        </div>
        <p className="text-[0.98rem]">{scenarioSentence(v)}</p>
        {complete ? <p className="mt-1 text-sm font-semibold text-good">Complete and measurable.</p> : null}
      </div>
      {exercise ? (
        <div className="mt-4">
          <button type="button" className="btn btn-primary btn-sm" aria-expanded={v.revealed} onClick={() => setSaved((p) => ({ ...p, revealed: !p.revealed }))}>
            {v.revealed ? 'Hide the model answer' : 'Compare with a model answer'}
          </button>
          {v.revealed ? (
            <div className="mt-3 rounded-lg border border-accent/40 bg-accent-soft/50 px-4 py-3">
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-accent">One good answer</div>
              <dl className="grid gap-x-4 gap-y-1.5 text-[0.95rem] sm:grid-cols-[8rem_1fr]">
                {SCENARIO_FIELDS.map((f) => (
                  <div key={f.key} className="contents">
                    <dt className="font-semibold">{f.label}</dt>
                    <dd>{exercise.modelAnswer[f.key]}</dd>
                  </div>
                ))}
              </dl>
              {exercise.notes ? <Rich className="mt-3 border-t border-accent/30 pt-2 text-[0.93rem]">{exercise.notes}</Rich> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </ExerciseShell>
  );
}
