import Link from 'next/link';
import { IconArrowRight, IconBook, IconShelf } from '@/components/icons';
import { ContinueLink, UnitProgress } from '@/components/layout/ContinueLink';
import { DesignMap } from '@/components/lesson/DesignMap';
import { getOutline, getUnits } from '@/lib/content';

export default function Home() {
  const outline = getOutline();
  const units = getUnits();
  const meetShelf = outline.flatMap((u) => u.lessons).find((l) => l.id === 'getting-oriented/meet-shelf');
  return (
    <main id="main" className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <section className="pb-12 pt-12 sm:pt-16">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-accent">A short course for developers</p>
        <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">Design a system before you build it.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
          You can already write code. This course teaches the step before: deciding the parts, how they talk, and what they promise. In plain English, in short
          lessons, with one running example from first idea to a one-page design.
        </p>
        <div className="mt-8">
          <ContinueLink outline={outline} />
        </div>
      </section>

      <section aria-labelledby="map-title" className="border-t border-line pt-10">
        <div className="mb-5 max-w-2xl">
          <h2 id="map-title" className="text-2xl font-bold tracking-tight">
            The map
          </h2>
          <p className="mt-2 text-muted">
            Every design has the same eleven parts, and it helps to work through them in this order. Each lesson shows where it sits on this map. Pick a part to
            jump to its first lesson.
          </p>
        </div>
        <DesignMap />
      </section>

      <section aria-labelledby="shelf-title" className="mt-12 grid items-start gap-6 rounded-2xl border border-line bg-surface p-6 sm:p-8 md:grid-cols-[auto_1fr]">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-3xl text-accent" aria-hidden="true">
          <IconShelf />
        </span>
        <div>
          <h2 id="shelf-title" className="text-2xl font-bold tracking-tight">
            One example all the way through: Shelf
          </h2>
          <p className="mt-2 max-w-2xl leading-relaxed text-muted">
            Shelf is a small labelling service. Other apps (a recipe site, a quiz app, a photo gallery) keep their own items; Shelf lets people put tags on those
            items and find items by tag. It’s small enough to hold in your head and has just enough real questions: who owns an item, what happens when one is
            deleted, who may tag what. You’ll design it piece by piece, then write the whole design on one page.
          </p>
          {meetShelf ? (
            <Link href={meetShelf.href} className="mt-4 inline-flex items-center gap-1 font-semibold text-accent hover:underline">
              Meet Shelf <IconArrowRight />
            </Link>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="units-title" className="mt-12">
        <h2 id="units-title" className="text-2xl font-bold tracking-tight">
          Units
        </h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {outline.map((u) => {
            const unit = units.find((x) => x.slug === u.slug);
            return (
              <li key={u.slug}>
                <Link href={u.href} className="card group flex h-full flex-col px-5 py-4 hover:border-accent">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-muted">Unit {u.number}</span>
                    <UnitProgress ids={u.lessons.map((l) => l.id)} />
                  </span>
                  <span className="mt-1 text-lg font-bold group-hover:text-accent">{u.title}</span>
                  <span className="mt-1 flex-1 text-[0.95rem] leading-snug text-muted">{unit?.summary}</span>
                  <span className="mt-3 text-sm text-muted">
                    {u.lessons.length} lesson{u.lessons.length === 1 ? '' : 's'} · {u.lessons.reduce((a, l) => a + l.minutes, 0)} min
                  </span>
                </Link>
              </li>
            );
          })}
          <li>
            <Link href="/capstone/" className="group flex h-full flex-col rounded-xl border border-accent bg-accent-soft px-5 py-4">
              <span className="text-sm font-semibold text-accent">Capstone</span>
              <span className="mt-1 text-lg font-bold">Design Shelf on one page</span>
              <span className="mt-1 flex-1 text-[0.95rem] leading-snug text-fg/80">
                A guided form that walks through every part and gives you a one-page design document, plus a finished design to compare with.
              </span>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent">
                Open the capstone <IconArrowRight />
              </span>
            </Link>
          </li>
        </ol>
      </section>

      <section aria-labelledby="tools-title" className="mt-12 grid gap-4 md:grid-cols-3">
        <h2 id="tools-title" className="sr-only">
          Tools and reference
        </h2>
        {[
          { href: '/tools/', title: 'Tools', text: 'Estimation and availability calculators, a quality-scenario builder, and a contract builder that writes OpenAPI, JSON Schema and Zod.' },
          { href: '/playground/', title: 'Diagram playground', text: 'Write Mermaid, see the diagram as you type. Starter templates for class, sequence, state, ER and C4-style diagrams.' },
          { href: '/glossary/', title: 'Glossary', text: 'Every term used in the course, in plain English. Hover a dotted word in any lesson to see its entry.' },
        ].map((c) => (
          <Link key={c.href} href={c.href} className="card group px-5 py-4 hover:border-accent">
            <span className="flex items-center gap-2 font-bold group-hover:text-accent">
              <IconBook className="text-accent" /> {c.title}
            </span>
            <span className="mt-1 block text-[0.95rem] leading-snug text-muted">{c.text}</span>
          </Link>
        ))}
      </section>

      <footer className="mt-16 border-t border-line pt-6 text-sm text-muted">
        Your progress, answers and drafts are saved only in this browser. Nothing is sent anywhere.
      </footer>
    </main>
  );
}
