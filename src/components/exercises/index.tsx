// Server wrappers: look an exercise up by id in content/exercises, render its markdown
// on the server, and hand the result to the interactive client component.
import { getExercise } from '@/lib/content';
import { renderInline, renderMarkdown } from '@/lib/markdown';
import type { Exercise } from '@/lib/schemas';
import { DiagramExerciseClient } from './DiagramExerciseClient';
import { QuizClient } from './QuizClient';
import { ScenarioBuilder } from '../tools/ScenarioBuilder';
import { SortClient } from './SortClient';
import { WriteClient } from './WriteClient';
import { mdComponents } from '../mdComponentsBasic';

function load<T extends Exercise['type']>(id: string, type: T): Extract<Exercise, { type: T }> {
  const ex = getExercise(id);
  if (ex.type !== type) throw new Error(`Exercise "${id}" is a ${ex.type}, not a ${type}`);
  return ex as Extract<Exercise, { type: T }>;
}

const inline = (s: string) => renderInline(s, mdComponents);
const block = (s: string) => renderMarkdown(s, mdComponents);
const maybe = (s?: string) => (s ? block(s) : Promise.resolve(undefined));

// The quiz already says "Right." or "Not quite." before an explanation, so drop a matching opener.
const VERDICT = /^\s*(right|correct|yes|exactly|not quite|wrong|incorrect|no)[.!:,]\s*/i;
const trimVerdict = (s: string) => {
  const out = s.replace(VERDICT, '');
  return out ? out.charAt(0).toUpperCase() + out.slice(1) : s;
};

export async function Quiz({ id }: { id: string }) {
  const ex = load(id, 'quiz');
  const questions = await Promise.all(
    ex.questions.map(async (q) => ({
      prompt: await block(q.prompt),
      options: await Promise.all(
        q.options.map(async (o) => ({ text: await inline(o.text), correct: !!o.correct, explanation: await inline(trimVerdict(o.explanation)) })),
      ),
    })),
  );
  return <QuizClient id={ex.id} title={ex.title} intro={await maybe(ex.intro)} questions={questions} />;
}

export async function Sort({ id }: { id: string }) {
  const ex = load(id, 'sort');
  const items = await Promise.all(ex.items.map(async (i) => ({ text: await inline(i.text), bucket: i.bucket, reason: await inline(i.reason) })));
  return <SortClient id={ex.id} title={ex.title} intro={await maybe(ex.intro)} buckets={ex.buckets} items={items} />;
}

export async function WriteIt({ id }: { id: string }) {
  const ex = load(id, 'write');
  return (
    <WriteClient
      id={ex.id}
      title={ex.title}
      intro={await maybe(ex.intro)}
      prompt={await block(ex.prompt)}
      starter={ex.starter}
      hints={await Promise.all(ex.hints.map(inline))}
      checklist={await Promise.all(ex.checklist.map(inline))}
      modelAnswer={await block(ex.modelAnswer)}
      rows={ex.rows}
    />
  );
}

export async function ScenarioExercise({ id }: { id: string }) {
  const ex = load(id, 'scenario');
  return (
    <ScenarioBuilder
      storageKey={`ex:${ex.id}`}
      exercise={{
        id: ex.id,
        title: ex.title,
        intro: await maybe(ex.intro),
        prompt: await block(ex.prompt),
        starter: ex.starter,
        modelAnswer: ex.modelAnswer,
        notes: await maybe(ex.notes),
      }}
    />
  );
}

export async function DiagramExercise({ id }: { id: string }) {
  const ex = load(id, 'diagram');
  return (
    <DiagramExerciseClient
      id={ex.id}
      title={ex.title}
      intro={await maybe(ex.intro)}
      prompt={await block(ex.prompt)}
      starter={ex.starter}
      hints={await Promise.all(ex.hints.map(inline))}
      modelAnswer={ex.modelAnswer}
      modelDescription={ex.modelDescription}
      checklist={await Promise.all(ex.checklist.map(inline))}
    />
  );
}
