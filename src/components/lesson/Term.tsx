import type { ReactNode } from 'react';
import { getGlossaryMap } from '@/lib/content';
import { TermTip } from './TermTip';

/** <Term id="latency">latency</Term> links a word to its glossary entry. */
export function Term({ id, children }: { id: string; children?: ReactNode }) {
  const entry = getGlossaryMap().get(id);
  if (!entry) throw new Error(`<Term id="${id}">: no such entry in content/glossary.yaml`);
  return (
    <TermTip id={entry.id} term={entry.term} short={entry.short}>
      {children ?? entry.term}
    </TermTip>
  );
}
