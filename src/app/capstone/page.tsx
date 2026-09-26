import type { Metadata } from 'next';
import { CapstoneForm } from '@/components/capstone/CapstoneForm';
import { mdComponents } from '@/components/mdComponentsBasic';
import type { StepId } from '@/lib/capstone';
import { readReference } from '@/lib/content';
import { renderMarkdown } from '@/lib/markdown';

export const metadata: Metadata = {
  title: 'Capstone: design Shelf on one page',
  description: 'A guided form that walks through every part of a design and produces a one-page design document.',
};

// Which section of the reference design (## 2., ## 3., …) goes with which step.
const SECTION_FOR: Partial<Record<StepId, number>> = {
  requirements: 2,
  domain: 3,
  modules: 4,
  data: 5,
  contract: 6,
  flow: 7,
  state: 8,
  failure: 9,
  permissions: 10,
  adr: 11,
};

export default async function CapstonePage() {
  const md = readReference('shelf-design.md');
  // Drop the document title and the italic intro line; the page supplies its own.
  const body = md.replace(/^# .*\n+/, '').replace(/^\*[^\n]*\*\n+/, '');
  const parts = body.split(/^(?=## \d+\.)/m);
  const byNumber = new Map<number, string>();
  for (const p of parts) {
    const m = /^## (\d+)\./.exec(p);
    if (m) byNumber.set(Number(m[1]), p.replace(/^## .*\n/, ''));
  }
  const sections: Partial<Record<StepId, React.ReactNode>> = {};
  for (const [step, n] of Object.entries(SECTION_FOR)) {
    const text = byNumber.get(n);
    if (text) sections[step as StepId] = await renderMarkdown(text, mdComponents);
  }
  const reference = await renderMarkdown(body, mdComponents);
  const intro = /^\*([^\n]*)\*$/m.exec(md)?.[1] ?? '';

  return (
    <main id="main" className="mx-auto max-w-[90rem] px-4 pb-24 pt-10 sm:px-6">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-accent">Capstone</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight">Design Shelf on one page</h1>
        <p className="mt-3 text-lg text-muted">
          Walk through every part of the map and write Shelf’s design as you go. At the end you get one markdown document to copy or download. When you
          submit, a finished reference design appears for you to compare against.
        </p>
      </div>
      <div className="mt-8">
        <CapstoneForm referenceIntro={intro} reference={reference} sections={sections} />
      </div>
    </main>
  );
}
