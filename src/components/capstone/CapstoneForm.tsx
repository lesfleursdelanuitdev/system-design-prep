'use client';
import Link from 'next/link';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { capstoneFilename, capstoneMarkdown, capstoneSchema, EMPTY_CAPSTONE, STEPS, stepDone, type Capstone, type StepId } from '@/lib/capstone';
import { contractSchema, type Contract } from '@/lib/contract/model';
import { preset } from '@/lib/contract/presets';
import { removeStored, useHydrated, useStored } from '@/lib/storage';
import { IconArrowLeft, IconArrowRight, IconCheck, IconClose, IconDownload, IconReset } from '../icons';
import { ContractBuilder } from '../tools/ContractBuilder';
import { CopyButton, download } from '../tools/CopyButton';
import { MermaidEditor } from '../tools/MermaidEditor';
import { EMPTY_SCENARIO, ScenarioBuilder, scenarioStateSchema } from '../tools/ScenarioBuilder';

const DRAFT_KEY = 'capstone:draft';
const SCENARIO_KEY = 'capstone:scenario';
const CONTRACT_KEY = 'capstone:contract';
const BLANK_CONTRACT: Contract = preset('blank');

const GUIDE: Record<StepId, ReactNode> = {
  requirements: (
    <ul>
      <li>Three to five user stories, each with acceptance criteria someone could check.</li>
      <li>One quality scenario whose measure is a number.</li>
      <li>The constraints (fixed facts) and your priorities, in order, including which wins when two conflict.</li>
    </ul>
  ),
  domain: (
    <ul>
      <li>The main concepts (the nouns) and how they relate, with how many of each.</li>
      <li>In the notes: what identifies each thing, and who owns the truth about it.</li>
    </ul>
  ),
  modules: (
    <ul>
      <li>Group the concepts into modules. For each: what it owns and which modules it may call.</li>
      <li>Dependencies should point one way. Nothing should know about recipes or quizzes.</li>
    </ul>
  ),
  data: (
    <ul>
      <li>Tables with their primary and foreign keys.</li>
      <li>In the notes: which columns are cached copies, and how deleting works.</li>
    </ul>
  ),
  contract: (
    <ul>
      <li>Pick one contract. The list endpoint each app provides is a good choice.</li>
      <li>Fill in every section. The builder warns about anything left unsaid; aim for no warnings.</li>
    </ul>
  ),
  flow: (
    <ul>
      <li>One flow, step by step, such as an app pushing a change.</li>
      <li>Show what happens on a repeated request, or when a step fails (an <code>alt</code> block).</li>
    </ul>
  ),
  state: (
    <ul>
      <li>The life of an item (or a tag): every state, and what moves it from one to the next.</li>
      <li>Label each transition with its cause and any time limit.</li>
    </ul>
  ),
  failure: (
    <ul>
      <li>For each step in your flows: what if it fails, is slow, or runs twice?</li>
      <li>At least five rows. Say what the system does, not just what goes wrong.</li>
    </ul>
  ),
  permissions: (
    <ul>
      <li>The privileges, the roles that bundle them, and the scope each role works in.</li>
      <li>Start from “default deny”: give each role only what it needs.</li>
    </ul>
  ),
  adr: (
    <ul>
      <li>One decision you made, written as an ADR: context, the options you compared, the choice, and its consequences.</li>
      <li>“Push, pull, or both?” is a good one.</li>
    </ul>
  ),
  export: null,
};

/** The capstone: a guided form that produces a one-page design document. */
export function CapstoneForm({ referenceIntro, reference, sections }: { referenceIntro: ReactNode; reference: ReactNode; sections: Partial<Record<StepId, ReactNode>> }) {
  const [c, setC] = useStored<Capstone>(DRAFT_KEY, capstoneSchema, EMPTY_CAPSTONE);
  const [scenario] = useStored(SCENARIO_KEY, scenarioStateSchema, EMPTY_SCENARIO);
  const [contract] = useStored(CONTRACT_KEY, contractSchema, BLANK_CONTRACT);
  const hydrated = useHydrated();
  const top = useRef<HTMLDivElement>(null);
  const uid = useId();
  const d = hydrated ? c : EMPTY_CAPSTONE;
  const stepIndex = Math.min(d.step, STEPS.length - 1);
  const step = STEPS[stepIndex];
  const set = <K extends keyof Capstone>(k: K) => (v: Capstone[K]) => setC((p) => ({ ...p, [k]: v }));
  const done = (id: StepId) => hydrated && stepDone(id, d, scenario, contract);
  const doneCount = STEPS.filter((s) => s.id !== 'export' && done(s.id)).length;

  const go = (i: number) => {
    setC((p) => ({ ...p, step: Math.max(0, Math.min(STEPS.length - 1, i)) }));
    requestAnimationFrame(() => top.current?.scrollIntoView({ block: 'start' }));
  };

  useEffect(() => {
    if (!hydrated) return;
    const h = window.location.hash.slice(1);
    const i = STEPS.findIndex((s) => s.id === h);
    if (i >= 0) setC((p) => ({ ...p, step: i }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const md = hydrated ? capstoneMarkdown(d, scenario, contract) : '';

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] xl:gap-10" ref={top} style={{ scrollMarginTop: 'calc(var(--header-h) + 1rem)' }}>
      <nav aria-label="Capstone steps" className="min-w-0 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
        <p className="mb-2 text-sm text-muted" aria-live="polite">
          {doneCount} of {STEPS.length - 1} parts written
        </p>
        <ol className="flex gap-1.5 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {STEPS.map((s, i) => (
            <li key={s.id} className="shrink-0">
              <button
                type="button"
                onClick={() => go(i)}
                aria-current={i === stepIndex ? 'step' : undefined}
                className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm ${
                  i === stepIndex ? 'border-accent bg-accent-soft font-semibold text-accent' : 'border-transparent hover:bg-surface-2'
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[0.7rem] font-bold ${
                    done(s.id) ? 'border-good bg-good text-bg' : 'border-line-strong text-muted'
                  }`}
                >
                  {done(s.id) ? <IconCheck strokeWidth={3.5} /> : i + 1}
                </span>
                <span className="whitespace-nowrap lg:whitespace-normal">{s.title}</span>
                {done(s.id) ? <span className="sr-only">(written)</span> : null}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="min-w-0">
        {stepIndex === 0 ? (
          <div className="card mb-6 grid gap-3 px-4 py-4 sm:grid-cols-2">
            <Field label="Name of the design" value={d.title} onChange={set('title')} />
            <Field label="Your name (optional)" value={d.author} onChange={set('author')} />
          </div>
        ) : null}

        <section aria-labelledby={`${uid}-h`}>
          <p className="text-sm font-semibold text-accent">
            Step {stepIndex + 1} of {STEPS.length}
          </p>
          <h2 id={`${uid}-h`} className="mt-1 text-2xl font-bold tracking-tight">
            {step.title}
          </h2>
          {GUIDE[step.id] ? (
            <div className="mt-3 rounded-lg border border-line bg-surface px-4 py-3 text-[0.95rem] [&_code]:font-mono [&_code]:text-[0.9em] [&_li+li]:mt-1 [&_ul]:list-disc [&_ul]:pl-5">
              <div className="mb-1 font-semibold">What to write</div>
              {GUIDE[step.id]}
              {step.lesson ? (
                <p className="mt-2 text-sm text-muted">
                  Need a reminder?{' '}
                  <Link href={step.lesson.href} className="text-accent underline" target="_blank">
                    {step.lesson.label}
                  </Link>{' '}
                  (opens in a new tab).
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-5 space-y-5">
            {step.id === 'requirements' ? (
              <>
                <Field label="User stories (markdown)" value={d.stories} onChange={set('stories')} multiline rows={9} mono />
                <ScenarioBuilder
                  storageKey={SCENARIO_KEY}
                  title="Quality scenario"
                  intro={<p>One situation Shelf must handle well, with a measure someone could check.</p>}
                />
                <Field label="Constraints and priorities (markdown)" value={d.constraints} onChange={set('constraints')} multiline rows={10} mono />
              </>
            ) : null}
            {step.id === 'domain' ? (
              <>
                <MermaidEditor label="Domain model (Mermaid class diagram)" value={d.domainModel} onChange={set('domainModel')} rows={16} />
                <Field label="Notes: identity and ownership" value={d.domainNotes} onChange={set('domainNotes')} multiline rows={5} />
              </>
            ) : null}
            {step.id === 'modules' ? <Field label="Modules (markdown)" value={d.modules} onChange={set('modules')} multiline rows={12} mono /> : null}
            {step.id === 'data' ? (
              <>
                <MermaidEditor label="Data model (Mermaid ER diagram)" value={d.dataModel} onChange={set('dataModel')} rows={18} />
                <Field label="Notes: cached columns, deleting, retention" value={d.dataNotes} onChange={set('dataNotes')} multiline rows={5} />
              </>
            ) : null}
            {step.id === 'contract' ? <ContractBuilder storageKey={CONTRACT_KEY} initial={BLANK_CONTRACT} compact /> : null}
            {step.id === 'flow' ? (
              <>
                <MermaidEditor label="One flow (Mermaid sequence diagram)" value={d.sequence} onChange={set('sequence')} rows={16} />
                <Field label="Notes" value={d.sequenceNotes} onChange={set('sequenceNotes')} multiline rows={4} />
              </>
            ) : null}
            {step.id === 'state' ? (
              <>
                <MermaidEditor label="One state diagram (Mermaid)" value={d.state} onChange={set('state')} rows={14} />
                <Field label="Notes: what each state means" value={d.stateNotes} onChange={set('stateNotes')} multiline rows={5} />
              </>
            ) : null}
            {step.id === 'failure' ? <FailureTable rows={d.failures} onChange={set('failures')} /> : null}
            {step.id === 'permissions' ? <Field label="Permissions (markdown)" value={d.permissions} onChange={set('permissions')} multiline rows={12} mono /> : null}
            {step.id === 'adr' ? (
              <div className="grid gap-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
                  <Field label="Decision" value={d.adrTitle} onChange={set('adrTitle')} />
                  <div>
                    <label className="label" htmlFor={`${uid}-status`}>
                      Status
                    </label>
                    <select id={`${uid}-status`} className="field" value={d.adrStatus} onChange={(e) => set('adrStatus')(e.target.value)}>
                      {['Proposed', 'Accepted', 'Superseded'].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <Field label="Context: what forces are at play?" value={d.adrContext} onChange={set('adrContext')} multiline rows={5} />
                <Field label="Options: what did you compare, and what does each cost?" value={d.adrOptions} onChange={set('adrOptions')} multiline rows={7} />
                <Field label="Decision: what did you choose?" value={d.adrDecision} onChange={set('adrDecision')} multiline rows={3} />
                <Field label="Consequences: what follows, good and bad?" value={d.adrConsequences} onChange={set('adrConsequences')} multiline rows={5} />
              </div>
            ) : null}
            {step.id === 'export' ? (
              <ExportStep
                md={md}
                filename={capstoneFilename(d)}
                submitted={d.submitted}
                onSubmit={() => setC((p) => ({ ...p, submitted: true }))}
                onReset={() => {
                  if (!window.confirm('Delete your whole design and start again? This can’t be undone.')) return;
                  removeStored(SCENARIO_KEY);
                  removeStored(CONTRACT_KEY);
                  setC(EMPTY_CAPSTONE);
                }}
                missing={STEPS.filter((s) => s.id !== 'export' && !done(s.id)).map((s) => s.title)}
                referenceIntro={referenceIntro}
                reference={reference}
              />
            ) : null}
          </div>

          {d.submitted && sections[step.id] ? (
            <details className="mt-6 rounded-xl border border-accent/40 bg-surface">
              <summary className="cursor-pointer px-4 py-3 font-semibold text-accent">Compare with the reference design’s {step.title.toLowerCase()}</summary>
              <div className="prose border-t border-line px-4 py-3 !max-w-none">{sections[step.id]}</div>
            </details>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            {stepIndex > 0 ? (
              <button type="button" className="btn" onClick={() => go(stepIndex - 1)}>
                <IconArrowLeft /> {STEPS[stepIndex - 1].title}
              </button>
            ) : (
              <span />
            )}
            {stepIndex < STEPS.length - 1 ? (
              <button type="button" className="btn btn-primary" onClick={() => go(stepIndex + 1)}>
                {STEPS[stepIndex + 1].title} <IconArrowRight />
              </button>
            ) : null}
          </div>
          <p className="hint mt-3">Everything you write here is saved in this browser as you type. Nothing is sent anywhere.</p>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
  rows = 4,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  rows?: number;
  mono?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      {multiline ? (
        <textarea id={id} className={`field ${mono ? 'mono' : ''}`} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} className="field" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function FailureTable({ rows, onChange }: { rows: Capstone['failures']; onChange: (r: Capstone['failures']) => void }) {
  const update = (i: number, k: keyof Capstone['failures'][number], v: string) => onChange(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  return (
    <div>
      <ol className="space-y-3">
        {rows.map((r, i) => (
          <li key={i} className="card grid gap-2 p-3 sm:grid-cols-[1fr_1.4fr_1.6fr_auto]">
            <input className="field" aria-label={`Row ${i + 1}: step`} placeholder="Step (e.g. Nightly pull)" value={r.step} onChange={(e) => update(i, 'step', e.target.value)} />
            <textarea className="field !min-h-0" rows={2} aria-label={`Row ${i + 1}: what can go wrong`} placeholder="What can go wrong" value={r.what} onChange={(e) => update(i, 'what', e.target.value)} />
            <textarea className="field !min-h-0" rows={2} aria-label={`Row ${i + 1}: what happens`} placeholder="What the system does about it" value={r.response} onChange={(e) => update(i, 'response', e.target.value)} />
            <button type="button" className="btn btn-ghost btn-sm h-9 w-9 !px-0 text-muted hover:text-bad" aria-label={`Remove row ${i + 1}`} onClick={() => onChange(rows.filter((_, j) => j !== i))}>
              <IconClose />
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="btn btn-sm mt-3" onClick={() => onChange([...rows, { step: '', what: '', response: '' }])} disabled={rows.length >= 40}>
        Add a row
      </button>
    </div>
  );
}

function ExportStep({
  md,
  filename,
  submitted,
  onSubmit,
  onReset,
  missing,
  referenceIntro,
  reference,
}: {
  md: string;
  filename: string;
  submitted: boolean;
  onSubmit: () => void;
  onReset: () => void;
  missing: string[];
  referenceIntro: ReactNode;
  reference: ReactNode;
}) {
  return (
    <div className="space-y-5">
      {missing.length ? (
        <p className="callout callout-warning">
          <span className="font-semibold">Still to write:</span> {missing.join(', ')}. You can export anyway; those parts will say “not written yet”.
        </p>
      ) : (
        <p className="callout callout-tip">
          <span className="font-semibold">Every part has something in it.</span> Read it through once as someone new to Shelf would.
        </p>
      )}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-2 px-3 py-2">
          <span className="text-sm font-semibold">Your design, as markdown</span>
          <div className="flex gap-1.5">
            <CopyButton text={md} />
            <button type="button" className="btn btn-sm" onClick={() => download(filename, md)}>
              <IconDownload /> {filename}
            </button>
          </div>
        </div>
        <pre className="code m-0 max-h-[60vh] overflow-auto whitespace-pre-wrap !rounded-none !border-0 !bg-surface" tabIndex={0} aria-label="Your design as markdown">
          {md}
        </pre>
      </div>
      {!submitted ? (
        <div className="rounded-xl border border-accent bg-accent-soft px-4 py-4">
          <p className="font-semibold">Finished?</p>
          <p className="mt-1 text-[0.95rem]">Submit to see a finished reference design for Shelf, and compare it with yours part by part. You can keep editing afterwards.</p>
          <button type="button" className="btn btn-primary mt-3" onClick={onSubmit}>
            <IconCheck /> Submit and show the reference design
          </button>
        </div>
      ) : (
        <section aria-labelledby="reference-title" className="rounded-xl border border-accent/50 bg-surface">
          <div className="border-b border-line px-4 py-3 sm:px-6">
            <h3 id="reference-title" className="text-lg font-bold">
              The reference design
            </h3>
            <div className="mt-1 text-[0.95rem] text-muted">{referenceIntro}</div>
          </div>
          <div className="prose !max-w-none px-4 py-4 sm:px-6">{reference}</div>
        </section>
      )}
      <div className="border-t border-line pt-4">
        <button type="button" className="btn btn-sm text-bad" onClick={onReset}>
          <IconReset /> Delete my design and start again
        </button>
      </div>
    </div>
  );
}
