import { describe, expect, it } from 'vitest';
import { capstoneFilename, capstoneMarkdown, capstoneSchema, EMPTY_CAPSTONE, STARTERS, STEPS, stepDone } from '@/lib/capstone';
import { preset } from '@/lib/contract/presets';

const scenario = {
  source: 'The recipe site',
  stimulus: 'pushes 500 changed items in one request',
  environment: 'during normal traffic',
  response: 'Shelf applies every change',
  measure: 'within 10 s for 95% of batches',
};

describe('capstone', () => {
  it('the empty draft is valid and nothing counts as written', () => {
    expect(capstoneSchema.safeParse(EMPTY_CAPSTONE).success).toBe(true);
    for (const s of STEPS) expect(stepDone(s.id, EMPTY_CAPSTONE, undefined, preset('blank')), s.id).toBe(false);
  });

  it('marks a step done only when it has more than the starter text', () => {
    const c = { ...EMPTY_CAPSTONE, domainModel: STARTERS.domainModel + '\n  class Tag' };
    expect(stepDone('domain', c)).toBe(true);
    expect(stepDone('requirements', { ...c, stories: 'S1', constraints: 'One server' }, scenario)).toBe(true);
    expect(stepDone('requirements', { ...c, stories: 'S1', constraints: 'One server' }, { ...scenario, measure: '' })).toBe(false);
    expect(stepDone('contract', c, undefined, preset('list-items'))).toBe(true);
    expect(stepDone('failure', { ...c, failures: [{ step: 'Pull', what: 'times out', response: 'retry' }] })).toBe(true);
  });

  it('exports every section, in order, as markdown', () => {
    const c = {
      ...EMPTY_CAPSTONE,
      author: 'Sam',
      failures: [{ step: 'Nightly pull', what: 'a page | fails', response: 'retry 3 times\nthen abandon' }],
      adrContext: 'Apps miss pushes.',
    };
    const md = capstoneMarkdown(c, scenario, preset('list-items'), new Date('2026-09-26T10:00:00Z'));
    const headings = md.split('\n').filter((l) => l.startsWith('## '));
    expect(headings).toEqual([
      '## 1. Requirements',
      '## 2. Domain model',
      '## 3. Modules',
      '## 4. Data model',
      '## 5. One contract',
      '## 6. One flow',
      '## 7. One state diagram',
      '## 8. Failure modes',
      '## 9. Permissions',
      '## 10. One decision: Push, pull, or both?',
    ]);
    expect(md).toContain('_by Sam · 2026-09-26_');
    expect(md).toContain('| Measure | within 10 s for 95% of batches |');
    expect(md).toContain('**`GET /shelf/items`**');
    expect(md).toContain('```mermaid\nclassDiagram');
    expect(md).toContain('| Nightly pull | a page \\| fails | retry 3 times<br>then abandon |');
    expect(md).toContain('**Decision**\n\n_Not written yet._');
  });

  it('says what is missing rather than leaving gaps', () => {
    const md = capstoneMarkdown({ ...EMPTY_CAPSTONE, stories: '', failures: [] }, undefined, undefined);
    expect(md).toContain('### User stories\n\n_Not written yet._');
    expect(md).toContain('## 5. One contract\n\n_Not written yet._');
    expect(md).toContain('## 8. Failure modes\n\n_Not written yet._');
  });

  it('makes a safe file name', () => {
    expect(capstoneFilename({ ...EMPTY_CAPSTONE, title: 'Shelf v2: tags!' })).toBe('shelf-v2-tags-design.md');
    expect(capstoneFilename({ ...EMPTY_CAPSTONE, title: '   ' })).toBe('shelf-design.md');
  });
});
