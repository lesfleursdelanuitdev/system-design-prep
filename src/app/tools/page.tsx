import type { Metadata } from 'next';
import Link from 'next/link';
import { AvailabilityCalculator } from '@/components/tools/AvailabilityCalculator';
import { ContractBuilder } from '@/components/tools/ContractBuilder';
import { EstimationCalculator } from '@/components/tools/EstimationCalculator';
import { ScenarioBuilder } from '@/components/tools/ScenarioBuilder';

export const metadata: Metadata = { title: 'Tools', description: 'Calculators and builders from the course, all on one page.' };

const TOC = [
  { id: 'estimate', label: 'Estimation calculator' },
  { id: 'availability', label: 'Availability calculator' },
  { id: 'scenario', label: 'Quality-scenario builder' },
  { id: 'contract', label: 'Contract builder' },
];

export default function ToolsPage() {
  return (
    <main id="main" className="mx-auto max-w-[90rem] px-4 pb-24 pt-10 sm:px-6">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight">Tools</h1>
        <p className="mt-3 text-lg text-muted">
          The interactive pieces from the lessons, gathered in one place. Everything runs in your browser; what you type is saved only here. The{' '}
          <Link href="/playground/" className="text-accent underline">
            diagram playground
          </Link>{' '}
          has its own page.
        </p>
        <nav aria-label="On this page" className="mt-4 flex flex-wrap gap-2">
          {TOC.map((t) => (
            <a key={t.id} href={`#${t.id}`} className="tag !text-sm hover:!text-fg">
              {t.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="mt-8 grid gap-8 xl:grid-cols-2">
        <section id="estimate" aria-label="Estimation calculator" className="scroll-mt-20">
          <EstimationCalculator />
        </section>
        <section id="availability" aria-label="Availability calculator" className="scroll-mt-20">
          <AvailabilityCalculator />
        </section>
      </div>
      <section id="scenario" aria-label="Quality-scenario builder" className="mt-8 max-w-3xl scroll-mt-20">
        <ScenarioBuilder />
      </section>
      <section id="contract" aria-labelledby="contract-title" className="mt-12 scroll-mt-20">
        <h2 id="contract-title" className="text-2xl font-bold tracking-tight">
          Contract builder
        </h2>
        <p className="mt-2 max-w-3xl text-muted">
          Describe one endpoint: its sides, inputs, output, errors, guarantees and who may call it. The builder writes matching OpenAPI, JSON Schema and Zod, and
          warns about anything left unsaid.
        </p>
        <ContractBuilder />
      </section>
    </main>
  );
}
