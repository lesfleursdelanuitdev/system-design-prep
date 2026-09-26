import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { IconArrowLeft, IconArrowRight, IconClock } from '@/components/icons';
import { CompleteButton } from '@/components/layout/LessonProgress';
import { DesignMap } from '@/components/lesson/DesignMap';
import { lessonComponents } from '@/components/mdx';
import { getGlossaryMap, getLesson, getLessons, getNeighbours, getUnitLessons } from '@/lib/content';
import { compileLesson } from '@/lib/markdown';

type Params = { unit: string; lesson: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getLessons().map((l) => ({ unit: l.unitSlug, lesson: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { unit, lesson } = await params;
  const l = getLesson(unit, lesson);
  return l ? { title: l.title, description: l.summary } : {};
}

export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const { unit, lesson } = await params;
  const l = getLesson(unit, lesson);
  if (!l) notFound();
  const Content = await compileLesson(l.body);
  const { prev, next } = getNeighbours(l);
  const siblings = getUnitLessons(unit);
  const glossary = getGlossaryMap();
  const terms = l.terms.map((t) => glossary.get(t)).filter((t) => t !== undefined);

  return (
    <article className="mx-auto max-w-[44rem]">
      <header className="mb-8">
        <p className="mb-3 text-sm font-semibold text-accent">
          <Link href={`/learn/${l.unitSlug}/`} className="hover:underline">
            Unit {l.unit} · {l.unitTitle}
          </Link>
        </p>
        {l.mapPart ? (
          <div className="mb-5">
            <DesignMap variant="strip" current={l.mapPart} />
          </div>
        ) : null}
        <h1 className="text-[1.95rem] font-bold leading-tight tracking-tight sm:text-[2.3rem]">{l.title}</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted">{l.summary}</p>
        <p className="mt-3 flex items-center gap-3 text-sm text-muted">
          <span className="inline-flex items-center gap-1">
            <IconClock /> {l.minutes} min
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Lesson {l.order} of {siblings.length}
          </span>
        </p>
      </header>

      <div className="prose">
        <Content components={lessonComponents} />
      </div>

      {terms.length ? (
        <section className="mt-12 rounded-xl border border-line bg-surface px-5 py-4" aria-labelledby="key-terms">
          <h2 id="key-terms" className="text-lg font-bold">
            Key terms
          </h2>
          <dl className="mt-2 divide-y divide-line">
            {terms.map((t) => (
              <div key={t.id} className="grid gap-x-4 gap-y-0.5 py-2 sm:grid-cols-[10rem_1fr]">
                <dt className="font-semibold">
                  <Link href={`/glossary/#${t.id}`} className="text-accent hover:underline">
                    {t.term}
                  </Link>
                </dt>
                <dd className="text-[0.95rem] text-fg/85">{t.short}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
        <CompleteButton lessonId={l.id} />
        <Link href="/glossary/" className="text-sm text-muted underline-offset-2 hover:underline">
          All terms in the glossary
        </Link>
      </div>

      <nav aria-label="Previous and next lesson" className="mt-6 grid gap-3 sm:grid-cols-2">
        {prev ? (
          <Link href={prev.href} rel="prev" className="card group flex flex-col px-4 py-3 hover:border-accent">
            <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
              <IconArrowLeft /> Previous
            </span>
            <span className="mt-0.5 font-semibold group-hover:text-accent">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={next.href} rel="next" className="card group flex flex-col px-4 py-3 text-right hover:border-accent">
            <span className="flex items-center justify-end gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Next <IconArrowRight />
            </span>
            <span className="mt-0.5 font-semibold group-hover:text-accent">{next.title}</span>
          </Link>
        ) : (
          <Link href="/capstone/" className="card group flex flex-col px-4 py-3 text-right hover:border-accent">
            <span className="flex items-center justify-end gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Finally <IconArrowRight />
            </span>
            <span className="mt-0.5 font-semibold group-hover:text-accent">Capstone: design Shelf on one page</span>
          </Link>
        )}
      </nav>
    </article>
  );
}
