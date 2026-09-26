import type { Metadata } from 'next';
import Link from 'next/link';
import { Playground } from '@/components/tools/Playground';

export const metadata: Metadata = { title: 'Diagram playground', description: 'Write Mermaid and see the diagram as you type.' };

export default function PlaygroundPage() {
  return (
    <main id="main" className="mx-auto max-w-[90rem] px-4 pb-24 pt-10 sm:px-6">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight">Diagram playground</h1>
        <p className="mt-3 text-lg text-muted">
          Diagrams as text: write <a className="text-accent underline" href="https://mermaid.js.org/intro/" target="_blank" rel="noopener noreferrer">Mermaid</a> on
          the left and see the picture on the right. Start from a template; your diagram is saved in this browser. Not sure which diagram to draw? See{' '}
          <Link className="text-accent underline" href="/learn/the-toolbox/uml-the-useful-parts/">
            UML, only the useful parts
          </Link>
          .
        </p>
      </div>
      <div className="mt-8">
        <Playground />
      </div>
    </main>
  );
}
