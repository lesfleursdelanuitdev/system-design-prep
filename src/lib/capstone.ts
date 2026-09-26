// The capstone: a one-page design for Shelf, built step by step, exported as markdown.
import { z } from 'zod';
import { contractMarkdown } from './contract/markdown';
import type { Contract } from './contract/model';
import { scenarioMarkdown } from './scenario';
import type { ScenarioParts } from './schemas';

const t = (max = 20_000) => z.string().max(max);

export const failureRowSchema = z.object({ step: t(300), what: t(600), response: t(1000) });
export type FailureRow = z.infer<typeof failureRowSchema>;

export const capstoneSchema = z.object({
  title: t(200),
  author: t(200),
  stories: t(),
  constraints: t(),
  domainModel: t(),
  domainNotes: t(),
  modules: t(),
  dataModel: t(),
  dataNotes: t(),
  sequence: t(),
  sequenceNotes: t(),
  state: t(),
  stateNotes: t(),
  failures: z.array(failureRowSchema).max(40),
  permissions: t(),
  adrTitle: t(300),
  adrStatus: t(60),
  adrContext: t(),
  adrOptions: t(),
  adrDecision: t(),
  adrConsequences: t(),
  submitted: z.boolean(),
  step: z.number().int().min(0).max(20),
});
export type Capstone = z.infer<typeof capstoneSchema>;

export const STARTERS = {
  stories: `| # | Story | Acceptance criteria |
|---|---|---|
| S1 | As a curator, I want …, so that … | … |
| S2 | As an app, I want …, so that … | … |`,
  constraints: `**Constraints**
- …

**Priorities, in order**
1. …
2. …

**When they conflict:** …`,
  domainModel: `classDiagram
  direction LR
  class Source {
    id
  }
  class Item {
    itemId
  }
  Source "1" --> "0..*" Item : owns`,
  modules: `| Module | Owns | May call |
|---|---|---|
| … | … | … |`,
  dataModel: `erDiagram
  SOURCES ||--o{ ITEMS : owns
  SOURCES {
    text id PK
  }
  ITEMS {
    text source_id PK
    text item_id PK
  }`,
  sequence: `sequenceDiagram
  autonumber
  participant App as Recipe site
  participant API as Shelf API
  App->>API: POST /v1/sources/recipes/changes
  API-->>App: 200`,
  state: `stateDiagram-v2
  [*] --> Present : first seen
  Present --> Missing : …`,
  permissions: `| Role | Privileges | Scope |
|---|---|---|
| App | … | its home scope |`,
} as const;

export const EMPTY_CAPSTONE: Capstone = {
  title: 'Shelf',
  author: '',
  stories: STARTERS.stories,
  constraints: STARTERS.constraints,
  domainModel: STARTERS.domainModel,
  domainNotes: '',
  modules: STARTERS.modules,
  dataModel: STARTERS.dataModel,
  dataNotes: '',
  sequence: STARTERS.sequence,
  sequenceNotes: '',
  state: STARTERS.state,
  stateNotes: '',
  failures: [{ step: '', what: '', response: '' }],
  permissions: STARTERS.permissions,
  adrTitle: 'Push, pull, or both?',
  adrStatus: 'Accepted',
  adrContext: '',
  adrOptions: '',
  adrDecision: '',
  adrConsequences: '',
  submitted: false,
  step: 0,
};

export type StepId = 'requirements' | 'domain' | 'modules' | 'data' | 'contract' | 'flow' | 'state' | 'failure' | 'permissions' | 'adr' | 'export';

export const STEPS: { id: StepId; title: string; lesson?: { href: string; label: string } }[] = [
  { id: 'requirements', title: 'Requirements', lesson: { href: '/learn/requirements/what-it-must-do/', label: 'Unit 2: Requirements' } },
  { id: 'domain', title: 'Domain model', lesson: { href: '/learn/domain-model/finding-the-nouns/', label: 'Unit 3: The domain model' } },
  { id: 'modules', title: 'Modules', lesson: { href: '/learn/boundaries/drawing-the-lines/', label: 'Unit 4: Boundaries and modules' } },
  { id: 'data', title: 'Data model', lesson: { href: '/learn/data-model/from-concepts-to-tables/', label: 'Unit 5: The data model' } },
  { id: 'contract', title: 'One contract', lesson: { href: '/learn/contracts/worked-example/', label: 'Unit 6: Contracts' } },
  { id: 'flow', title: 'One flow', lesson: { href: '/learn/flows-and-state/sequence-diagrams/', label: 'Sequence diagrams' } },
  { id: 'state', title: 'One state diagram', lesson: { href: '/learn/flows-and-state/state-diagrams/', label: 'State diagrams' } },
  { id: 'failure', title: 'Failure modes', lesson: { href: '/learn/when-things-go-wrong/listing-failure-modes/', label: 'Unit 8: When things go wrong' } },
  { id: 'permissions', title: 'Permissions', lesson: { href: '/learn/security/who-can-do-what-where/', label: 'Unit 9: Security' } },
  { id: 'adr', title: 'One decision (ADR)', lesson: { href: '/learn/changing-over-time/recording-decisions/', label: 'Recording decisions' } },
  { id: 'export', title: 'Review and export' },
];

const filled = (value: string, starter?: string) => value.trim().length > 0 && value.trim() !== (starter ?? '').trim();

/** Which steps have something real in them (not just the starter text). */
export function stepDone(id: StepId, c: Capstone, scenario?: Partial<ScenarioParts>, contract?: Contract): boolean {
  switch (id) {
    case 'requirements':
      return filled(c.stories, STARTERS.stories) && filled(c.constraints, STARTERS.constraints) && !!scenario?.measure?.trim();
    case 'domain':
      return filled(c.domainModel, STARTERS.domainModel);
    case 'modules':
      return filled(c.modules, STARTERS.modules);
    case 'data':
      return filled(c.dataModel, STARTERS.dataModel);
    case 'contract':
      return !!contract && contract.errors.length > 0 && Object.values(contract.guarantees).some((g) => g.trim());
    case 'flow':
      return filled(c.sequence, STARTERS.sequence);
    case 'state':
      return filled(c.state, STARTERS.state);
    case 'failure':
      return c.failures.some((f) => f.step.trim() && f.what.trim() && f.response.trim());
    case 'permissions':
      return filled(c.permissions, STARTERS.permissions);
    case 'adr':
      return [c.adrContext, c.adrOptions, c.adrDecision, c.adrConsequences].every((x) => x.trim());
    case 'export':
      return c.submitted;
  }
}

const block = (s: string) => s.trim() || '_Not written yet._';
const mermaid = (code: string) => (code.trim() ? ['```mermaid', code.trim(), '```'].join('\n') : '_Not drawn yet._');
const notes = (s: string) => (s.trim() ? `\n\n${s.trim()}` : '');
const cell = (s: string) => s.trim().replace(/\|/g, '\\|').replace(/\n+/g, '<br>') || '—';

/** The whole design as one markdown document. */
export function capstoneMarkdown(c: Capstone, scenario: Partial<ScenarioParts> | undefined, contract: Contract | undefined, date = new Date()): string {
  const failures = c.failures.filter((f) => f.step.trim() || f.what.trim() || f.response.trim());
  const byline = [c.author.trim() && `by ${c.author.trim()}`, date.toISOString().slice(0, 10)].filter(Boolean).join(' · ');
  const out = [
    `# ${c.title.trim() || 'Shelf'}: design on one page`,
    '',
    `_${byline}_`,
    '',
    '## 1. Requirements',
    '',
    '### User stories',
    '',
    block(c.stories),
    '',
    '### Quality scenario',
    '',
    scenario && Object.values(scenario).some((v) => typeof v === 'string' && v.trim()) ? scenarioMarkdown(scenario, 'Scenario') : '_Not written yet._',
    '',
    '### Constraints and priorities',
    '',
    block(c.constraints),
    '',
    '## 2. Domain model',
    '',
    mermaid(c.domainModel) + notes(c.domainNotes),
    '',
    '## 3. Modules',
    '',
    block(c.modules),
    '',
    '## 4. Data model',
    '',
    mermaid(c.dataModel) + notes(c.dataNotes),
    '',
    '## 5. One contract',
    '',
    contract ? contractMarkdown(contract) : '_Not written yet._',
    '',
    '## 6. One flow',
    '',
    mermaid(c.sequence) + notes(c.sequenceNotes),
    '',
    '## 7. One state diagram',
    '',
    mermaid(c.state) + notes(c.stateNotes),
    '',
    '## 8. Failure modes',
    '',
    failures.length
      ? ['| Step | What can go wrong | What happens |', '|---|---|---|', ...failures.map((f) => `| ${cell(f.step)} | ${cell(f.what)} | ${cell(f.response)} |`)].join('\n')
      : '_Not written yet._',
    '',
    '## 9. Permissions',
    '',
    block(c.permissions),
    '',
    `## 10. One decision: ${c.adrTitle.trim() || 'ADR-001'}`,
    '',
    `- **Status:** ${c.adrStatus.trim() || 'Proposed'}`,
    '',
    '**Context**',
    '',
    block(c.adrContext),
    '',
    '**Options**',
    '',
    block(c.adrOptions),
    '',
    '**Decision**',
    '',
    block(c.adrDecision),
    '',
    '**Consequences**',
    '',
    block(c.adrConsequences),
    '',
  ];
  return out.join('\n');
}

export function capstoneFilename(c: Capstone): string {
  const slug = (c.title.trim() || 'shelf')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug || 'design'}-design.md`;
}
