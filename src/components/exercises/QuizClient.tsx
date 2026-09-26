'use client';
import { useState, type ReactNode } from 'react';
import { z } from 'zod';
import { useHydrated, useStored } from '@/lib/storage';
import { IconCheck, IconCross, IconReset } from '../icons';
import { ExerciseShell, Rich } from './Shell';

export type QuizQuestionView = {
  prompt: ReactNode;
  options: { text: ReactNode; correct: boolean; explanation: ReactNode }[];
};

const stateSchema = z.object({ answers: z.record(z.string(), z.number().int().min(0).max(10)) });
type State = z.infer<typeof stateSchema>;
const EMPTY: State = { answers: {} };

export function QuizClient({ id, title, intro, questions }: { id: string; title?: string; intro?: ReactNode; questions: QuizQuestionView[] }) {
  const [state, setState] = useStored(`ex:${id}`, stateSchema, EMPTY);
  const hydrated = useHydrated();
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [showAll, setShowAll] = useState<Record<number, boolean>>({});

  const answered = Object.keys(state.answers).length;
  const right = questions.filter((q, i) => state.answers[i] !== undefined && q.options[state.answers[i]]?.correct).length;
  const finished = hydrated && answered === questions.length;

  return (
    <ExerciseShell
      kind="Quiz"
      title={title}
      intro={intro}
      id={id}
      footer={
        <>
          <span className="text-sm text-muted" aria-live="polite">
            {hydrated && answered > 0 ? (
              finished ? (
                <strong className="text-fg">
                  You got {right} of {questions.length} right.
                </strong>
              ) : (
                `${answered} of ${questions.length} answered · ${right} right so far`
              )
            ) : (
              `${questions.length} question${questions.length === 1 ? '' : 's'}`
            )}
          </span>
          {hydrated && answered > 0 ? (
            <button
              type="button"
              className="btn btn-sm ml-auto"
              onClick={() => {
                setState(EMPTY);
                setPicked({});
                setShowAll({});
              }}
            >
              <IconReset /> Start again
            </button>
          ) : null}
        </>
      }
    >
      <ol className="space-y-6">
        {questions.map((q, qi) => {
          const locked = hydrated ? state.answers[qi] : undefined;
          const choice = locked ?? picked[qi];
          const name = `${id}-q${qi}`;
          return (
            <li key={qi}>
              <fieldset aria-labelledby={`${name}-p`}>
                <div className="mb-2" id={`${name}-p`}>
                  <span className="mb-0.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                    Question {qi + 1} of {questions.length}
                  </span>
                  <Rich className="font-semibold">{q.prompt}</Rich>
                </div>
                <div className="space-y-2">
                  {q.options.map((o, oi) => {
                    const isChoice = choice === oi;
                    const reveal = locked !== undefined && (isChoice || showAll[qi]);
                    const tone =
                      locked === undefined
                        ? isChoice
                          ? 'border-accent bg-accent-soft'
                          : 'border-line hover:border-line-strong'
                        : o.correct && (isChoice || showAll[qi])
                          ? 'border-good/60 bg-good-soft'
                          : isChoice
                            ? 'border-bad/50 bg-bad-soft'
                            : 'border-line';
                    return (
                      <div key={oi} className={`rounded-lg border ${tone}`}>
                        <label className={`flex items-start gap-3 px-3 py-2.5 ${locked === undefined ? 'cursor-pointer' : ''}`}>
                          <input
                            type="radio"
                            name={name}
                            className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
                            checked={isChoice}
                            disabled={locked !== undefined}
                            onChange={() => setPicked((p) => ({ ...p, [qi]: oi }))}
                          />
                          <span className="min-w-0 flex-1">
                            <Rich>{o.text}</Rich>
                          </span>
                          {locked !== undefined && (isChoice || showAll[qi]) ? (
                            o.correct ? (
                              <IconCheck className="mt-1 shrink-0 text-good" title="Correct answer" />
                            ) : isChoice ? (
                              <IconCross className="mt-1 shrink-0 text-bad" title="Not the best answer" />
                            ) : null
                          ) : null}
                        </label>
                        {reveal ? (
                          <div className="border-t border-line/70 px-3 py-2 pl-10 text-[0.93rem] text-fg/85">
                            {isChoice ? (
                              <strong className={o.correct ? 'text-good' : 'text-bad'}>{o.correct ? 'Right. ' : 'Not quite. '}</strong>
                            ) : null}
                            <Rich as="span">{o.explanation}</Rich>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {locked === undefined ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={picked[qi] === undefined}
                      onClick={() => setState((s) => ({ answers: { ...s.answers, [qi]: picked[qi] } }))}
                    >
                      Check answer
                    </button>
                  ) : (
                    <button type="button" className="btn btn-sm" aria-expanded={!!showAll[qi]} onClick={() => setShowAll((s) => ({ ...s, [qi]: !s[qi] }))}>
                      {showAll[qi] ? 'Hide the other explanations' : 'Why each option is right or wrong'}
                    </button>
                  )}
                </div>
              </fieldset>
            </li>
          );
        })}
      </ol>
    </ExerciseShell>
  );
}
