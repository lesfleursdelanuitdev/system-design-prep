import type { Metadata } from 'next';
import { GlossaryList } from '@/components/layout/GlossaryList';
import { mdComponents } from '@/components/mdComponentsBasic';
import { getGlossary } from '@/lib/content';
import { renderMarkdown } from '@/lib/markdown';

export const metadata: Metadata = { title: 'Glossary', description: 'Every term used in the course, in plain English.' };

export default async function GlossaryPage() {
  const entries = getGlossary();
  const names = new Map(entries.map((e) => [e.id, e.term]));
  const items = await Promise.all(
    entries.map(async (e) => ({
      id: e.id,
      term: e.term,
      short: e.short,
      aka: e.aka ?? [],
      see: (e.see ?? []).map((id) => ({ id, term: names.get(id) ?? id })),
      long: e.long ? await renderMarkdown(e.long, mdComponents) : null,
    })),
  );
  return (
    <main id="main" className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight">Glossary</h1>
      <p className="mt-3 text-lg text-muted">Every term the course uses, in plain English first. {entries.length} terms.</p>
      <GlossaryList items={items} />
    </main>
  );
}
