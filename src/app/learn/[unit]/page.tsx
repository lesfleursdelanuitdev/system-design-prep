import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { IconArrowRight, IconClock } from '@/components/icons';
import { UnitProgress } from '@/components/layout/ContinueLink';
import { DesignMap } from '@/components/lesson/DesignMap';
import { getUnit, getUnitLessons, getUnits } from '@/lib/content';

type Params = { unit: string };
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getUnits()
    .filter((u) => getUnitLessons(u.slug).length > 0)
    .map((u) => ({ unit: u.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const u = getUnit((await params).unit);
  return u ? { title: `Unit ${u.number}: ${u.title}`, description: u.summary } : {};
}

export default async function UnitPage({ params }: { params: Promise<Params> }) {
  const { unit } = await params;
  const u = getUnit(unit);
  const lessons = getUnitLessons(unit);
  if (!u || lessons.length === 0) notFound();
  const minutes = lessons.reduce((a, l) => a + l.minutes, 0);
  return (
    <div className="mx-auto max-w-[44rem]">
      <p className="text-sm font-semibold text-accent">Unit {u.number}</p>
      <h1 className="mt-1 text-[2rem] font-bold leading-tight tracking-tight sm:text-[2.4rem]">{u.title}</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted">{u.summary}</p>
      {u.mapPart ? (
        <div className="mt-6">
          <DesignMap variant="strip" current={u.mapPart} />
        </div>
      ) : null}
      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-bold">
          {lessons.length} lessons · about {minutes} minutes
        </h2>
        <UnitProgress ids={lessons.map((l) => l.id)} />
      </div>
      <ol className="mt-3 space-y-3">
        {lessons.map((l) => (
          <li key={l.id}>
            <Link href={l.href} className="card group flex items-start gap-4 px-4 py-3.5 hover:border-accent">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft font-bold text-accent">{l.order}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold group-hover:text-accent">{l.title}</span>
                <span className="mt-0.5 block text-[0.95rem] text-muted">{l.summary}</span>
              </span>
              <span className="hidden shrink-0 items-center gap-1 text-sm text-muted sm:flex">
                <IconClock /> {l.minutes}
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <p className="mt-8">
        <Link href={lessons[0].href} className="btn btn-primary">
          Start the unit <IconArrowRight />
        </Link>
      </p>
    </div>
  );
}
