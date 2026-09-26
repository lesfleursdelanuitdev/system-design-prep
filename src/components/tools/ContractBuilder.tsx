'use client';
import { useId, useMemo, useState, type ReactNode } from 'react';
import { toJsonSchemaText } from '@/lib/contract/jsonschema';
import { contractMarkdown } from '@/lib/contract/markdown';
import {
  contractSchema,
  emptyField,
  FIELD_TYPES,
  GUARANTEES,
  hasBody,
  METHODS,
  SCALAR_TYPES,
  type Contract,
  type Field,
  type GuaranteeKey,
  type Param,
  type ScalarField,
} from '@/lib/contract/model';
import { toOpenApiYaml } from '@/lib/contract/openapi';
import { preset, PRESETS } from '@/lib/contract/presets';
import { contractWarnings, type Warning } from '@/lib/contract/warnings';
import { toZod } from '@/lib/contract/zod';
import { useHydrated, useStored } from '@/lib/storage';
import { IconAlert, IconClose, IconDownload, IconInfo } from '../icons';
import { CopyButton, download } from './CopyButton';

const DEFAULT = preset('list-items');

type Section = Warning['section'];
const SECTIONS: { id: Section; title: string; blurb: string }[] = [
  { id: 'endpoint', title: '1. Sides and the endpoint', blurb: 'Who provides it, who calls it, and where it lives.' },
  { id: 'inputs', title: '2. Inputs', blurb: 'Parameters in the path, query or headers, and the request body.' },
  { id: 'outputs', title: '3. Output', blurb: 'What comes back when it works.' },
  { id: 'errors', title: '4. Errors', blurb: 'Every way it can fail, and what the caller sees.' },
  { id: 'guarantees', title: '5. Guarantees', blurb: 'The behaviour callers may rely on.' },
  { id: 'auth', title: '6. Who may call it', blurb: 'Keys, privileges and scope.' },
];

const optNum = (s: string) => (s.trim() === '' || !Number.isFinite(Number(s)) ? undefined : Number(s));

/** Form for one endpoint → OpenAPI YAML, JSON Schema and Zod, side by side. */
export function ContractBuilder({
  storageKey = 'tool:contract',
  value,
  onChange,
  compact = false,
}: {
  storageKey?: string;
  value?: Contract;
  onChange?: (c: Contract) => void;
  compact?: boolean;
}) {
  const [saved, setSaved] = useStored<Contract>(storageKey, contractSchema, DEFAULT);
  const hydrated = useHydrated();
  const controlled = value !== undefined && onChange !== undefined;
  const c = controlled ? value : hydrated ? saved : DEFAULT;
  const update = (fn: (c: Contract) => Contract) => {
    if (controlled) onChange(fn(structuredClone(c)));
    else setSaved((p) => fn(structuredClone(p)));
  };
  const warnings = useMemo(() => contractWarnings(c), [c]);
  const count = (s: Section) => warnings.filter((w) => w.section === s && w.level !== 'tip').length;
  const uid = useId();

  return (
    <div className="contract-builder not-prose my-6 text-[0.95rem]">
      <div className={`grid gap-5 ${compact ? '' : '2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'}`}>
        <div className="min-w-0 space-y-4">
          <div className="card flex flex-wrap items-end gap-3 px-4 py-3">
            <div className="min-w-[14rem] flex-1">
              <label className="label" htmlFor={`${uid}-preset`}>
                Start from
              </label>
              <select
                id={`${uid}-preset`}
                className="field"
                defaultValue=""
                onChange={(e) => {
                  if (!e.target.value) return;
                  const p = preset(e.target.value);
                  if (controlled) onChange(p);
                  else setSaved(p);
                  e.target.value = '';
                }}
              >
                <option value="">Choose an example…</option>
                {PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="hint max-w-sm">Your changes are saved in this browser. Choosing an example replaces what’s here.</p>
          </div>

          <Block section={SECTIONS[0]} warnings={warnings} count={count('endpoint')}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Text label="Provider (who serves it)" value={c.provider} onChange={(v) => update((x) => ({ ...x, provider: v }))} placeholder="e.g. Shelf" />
              <Text label="Consumer (who calls it)" value={c.consumer} onChange={(v) => update((x) => ({ ...x, consumer: v }))} placeholder="e.g. a source app" />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[7rem_1fr]">
              <div>
                <label className="label" htmlFor={`${uid}-method`}>
                  Method
                </label>
                <select id={`${uid}-method`} className="field" value={c.method} onChange={(e) => update((x) => ({ ...x, method: e.target.value as Contract['method'] }))}>
                  {METHODS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
              <Text label="Path" mono value={c.path} onChange={(v) => update((x) => ({ ...x, path: v }))} placeholder="/v1/things/{thingId}" />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Text label="Summary" value={c.summary} onChange={(v) => update((x) => ({ ...x, summary: v }))} placeholder="What it does, in a few words" />
              <Text label="Operation name" mono value={c.operationId} onChange={(v) => update((x) => ({ ...x, operationId: v }))} placeholder="listItems" />
            </div>
            <div className="mt-3">
              <Text label="Description" multiline value={c.description} onChange={(v) => update((x) => ({ ...x, description: v }))} />
            </div>
          </Block>

          <Block section={SECTIONS[1]} warnings={warnings} count={count('inputs')}>
            <h4 className="mb-2 font-semibold">Parameters</h4>
            <FieldList
              fields={c.params}
              isParams
              onChange={(params) => update((x) => ({ ...x, params: params as Param[] }))}
              addLabel="Add a parameter"
              make={() => ({ ...emptyField(), in: 'query', required: false }) as Param}
            />
            {hasBody(c.method) ? (
              <>
                <h4 className="mb-2 mt-5 font-semibold">Request body (JSON)</h4>
                <FieldList fields={c.body} onChange={(body) => update((x) => ({ ...x, body }))} addLabel="Add a body field" make={emptyField} />
              </>
            ) : (
              <p className="hint mt-3">{c.method} requests have no body.</p>
            )}
          </Block>

          <Block section={SECTIONS[2]} warnings={warnings} count={count('outputs')}>
            <div className="grid gap-3 sm:grid-cols-[7rem_1fr]">
              <div>
                <label className="label" htmlFor={`${uid}-status`}>
                  Status
                </label>
                <select
                  id={`${uid}-status`}
                  className="field"
                  value={c.responseStatus}
                  onChange={(e) => update((x) => ({ ...x, responseStatus: Number(e.target.value) }))}
                >
                  {[200, 201, 202, 204].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <Text label="What it means" value={c.responseDescription} onChange={(v) => update((x) => ({ ...x, responseDescription: v }))} />
            </div>
            {c.responseStatus === 204 ? (
              <p className="hint mt-3">204 means “done, no body”.</p>
            ) : (
              <>
                <h4 className="mb-2 mt-4 font-semibold">Response body (JSON)</h4>
                <FieldList fields={c.response} onChange={(response) => update((x) => ({ ...x, response }))} addLabel="Add a response field" make={emptyField} />
              </>
            )}
          </Block>

          <Block section={SECTIONS[3]} warnings={warnings} count={count('errors')}>
            <ul className="space-y-2">
              {c.errors.map((e, i) => (
                <li key={i} className="grid grid-cols-[5.5rem_1fr_auto] gap-2 rounded-lg border border-line p-2 sm:grid-cols-[5.5rem_11rem_1fr_auto]">
                  <input
                    className="field mono"
                    type="number"
                    min={400}
                    max={599}
                    aria-label={`Error ${i + 1}: HTTP status`}
                    value={e.status}
                    onChange={(ev) => update((x) => ({ ...x, errors: x.errors.map((y, j) => (j === i ? { ...y, status: Number(ev.target.value) || 400 } : y)) }))}
                  />
                  <input
                    className="field mono"
                    aria-label={`Error ${i + 1}: code`}
                    placeholder="code"
                    value={e.code}
                    onChange={(ev) => update((x) => ({ ...x, errors: x.errors.map((y, j) => (j === i ? { ...y, code: ev.target.value } : y)) }))}
                  />
                  <input
                    className="field col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto"
                    aria-label={`Error ${i + 1}: when it happens`}
                    placeholder="When does it happen? What should the caller do?"
                    value={e.when}
                    onChange={(ev) => update((x) => ({ ...x, errors: x.errors.map((y, j) => (j === i ? { ...y, when: ev.target.value } : y)) }))}
                  />
                  <RemoveButton label={`Remove error ${e.code || i + 1}`} onClick={() => update((x) => ({ ...x, errors: x.errors.filter((_, j) => j !== i) }))} />
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn-sm mt-2" onClick={() => update((x) => ({ ...x, errors: [...x.errors, { status: 400, code: '', when: '' }] }))}>
              Add an error
            </button>
          </Block>

          <Block section={SECTIONS[4]} warnings={warnings} count={count('guarantees')}>
            <div className="space-y-3">
              {GUARANTEES.map((g) => (
                <Text
                  key={g.key}
                  label={g.label}
                  hint={g.hint}
                  multiline
                  rows={2}
                  value={c.guarantees[g.key]}
                  onChange={(v) => update((x) => ({ ...x, guarantees: { ...x.guarantees, [g.key as GuaranteeKey]: v } }))}
                />
              ))}
            </div>
          </Block>

          <Block section={SECTIONS[5]} warnings={warnings} count={count('auth')}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor={`${uid}-scheme`}>
                  How callers prove who they are
                </label>
                <select
                  id={`${uid}-scheme`}
                  className="field"
                  value={c.auth.scheme}
                  onChange={(e) => update((x) => ({ ...x, auth: { ...x.auth, scheme: e.target.value as Contract['auth']['scheme'] } }))}
                >
                  <option value="bearer">A key in the Authorization header (Bearer)</option>
                  <option value="apiKey">A key in its own header</option>
                  <option value="none">Nothing: anyone may call it</option>
                </select>
              </div>
              {c.auth.scheme === 'apiKey' ? (
                <Text label="Header name" mono value={c.auth.headerName} onChange={(v) => update((x) => ({ ...x, auth: { ...x.auth, headerName: v } }))} />
              ) : null}
              {c.auth.scheme !== 'none' ? (
                <>
                  <Text label="Privilege needed" mono value={c.auth.privilege} onChange={(v) => update((x) => ({ ...x, auth: { ...x.auth, privilege: v } }))} placeholder="e.g. tags:apply" />
                  <Text label="Extra rule" value={c.auth.rule} onChange={(v) => update((x) => ({ ...x, auth: { ...x.auth, rule: v } }))} placeholder="e.g. the item must be in the key’s scope" />
                </>
              ) : null}
            </div>
          </Block>
        </div>

        <div className="min-w-0">
          <div className={compact ? '' : '2xl:sticky 2xl:top-[calc(var(--header-h)+1rem)]'}>
            <Output contract={c} warnings={warnings} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Block({ section, warnings, count, children }: { section: (typeof SECTIONS)[number]; warnings: Warning[]; count: number; children: ReactNode }) {
  const mine = warnings.filter((w) => w.section === section.id);
  return (
    <fieldset className="card px-4 py-4">
      <legend className="sr-only">{section.title}</legend>
      <div className="mb-3 flex items-start justify-between gap-3" aria-hidden="true">
        <div>
          <div className="font-bold">{section.title}</div>
          <div className="hint">{section.blurb}</div>
        </div>
        {count > 0 ? (
          <span className="tag !border-[var(--warn-line)] !bg-[var(--warn-bg)] !text-[var(--warn-ink)]">
            {count} to check
          </span>
        ) : null}
      </div>
      {children}
      {mine.length ? (
        <ul className="mt-3 space-y-1 border-t border-line pt-3" aria-label={`Things to check in ${section.title}`}>
          {mine.map((w, i) => (
            <li key={i} className={`flex items-start gap-1.5 text-[0.85rem] ${w.level === 'error' ? 'text-bad' : w.level === 'warn' ? 'text-[var(--warn-ink)]' : 'text-muted'}`}>
              {w.level === 'tip' ? <IconInfo className="mt-0.5 shrink-0" /> : <IconAlert className="mt-0.5 shrink-0" />}
              <span>{w.message}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </fieldset>
  );
}

function Text({
  label,
  value,
  onChange,
  hint,
  placeholder,
  multiline,
  rows = 3,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  mono?: boolean;
}) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label className="label" htmlFor={id}>
        {label}
      </label>
      {multiline ? (
        <textarea id={id} className={`field ${mono ? 'mono' : ''}`} rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} aria-describedby={hint ? `${id}-h` : undefined} />
      ) : (
        <input id={id} className={`field ${mono ? 'mono' : ''}`} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} aria-describedby={hint ? `${id}-h` : undefined} />
      )}
      {hint ? (
        <p id={`${id}-h`} className="hint mt-1">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="btn btn-sm btn-ghost h-9 w-9 !px-0 text-muted hover:text-bad" aria-label={label} title={label} onClick={onClick}>
      <IconClose />
    </button>
  );
}

type AnyField = Field | Param | ScalarField;

function FieldList<T extends AnyField>({
  fields,
  onChange,
  addLabel,
  make,
  isParams,
  nested,
}: {
  fields: T[];
  onChange: (f: T[]) => void;
  addLabel: string;
  make: () => T;
  isParams?: boolean;
  nested?: boolean;
}) {
  return (
    <div>
      {fields.length === 0 ? <p className="hint mb-2">None yet.</p> : null}
      <ul className="space-y-2">
        {fields.map((f, i) => (
          <li key={i}>
            <FieldRow
              field={f}
              index={i}
              isParam={isParams}
              nested={nested}
              onChange={(nf) => onChange(fields.map((x, j) => (j === i ? (nf as T) : x)))}
              onRemove={() => onChange(fields.filter((_, j) => j !== i))}
            />
          </li>
        ))}
      </ul>
      <button type="button" className="btn btn-sm mt-2" onClick={() => onChange([...fields, make()])}>
        {addLabel}
      </button>
    </div>
  );
}

function FieldRow({
  field: f,
  index,
  isParam,
  nested,
  onChange,
  onRemove,
}: {
  field: AnyField;
  index: number;
  isParam?: boolean;
  nested?: boolean;
  onChange: (f: AnyField) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const types = isParam || nested ? SCALAR_TYPES : FIELD_TYPES;
  const name = f.name || `field ${index + 1}`;
  const set = (patch: Partial<Field> & { in?: Param['in'] }) => onChange({ ...f, ...patch } as AnyField);
  const isString = f.type === 'string' || f.type === 'string[]';
  const isNum = f.type === 'integer' || f.type === 'number';
  const isArray = f.type === 'string[]' || f.type === 'object[]';
  const pathParam = isParam && (f as Param).in === 'path';

  return (
    <div className={`rounded-lg border border-line p-2 ${nested ? 'bg-bg' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <input className="field mono min-w-[8rem] flex-1 basis-32" aria-label={`Name of ${name}`} placeholder="name" value={f.name} onChange={(e) => set({ name: e.target.value })} />
        {isParam ? (
          <select className="field w-auto" aria-label={`Where ${name} goes`} value={(f as Param).in} onChange={(e) => set({ in: e.target.value as Param['in'] })}>
            <option value="path">path</option>
            <option value="query">query</option>
            <option value="header">header</option>
          </select>
        ) : null}
        <select
          className="field w-auto"
          aria-label={`Type of ${name}`}
          value={f.type}
          onChange={(e) => {
            const type = e.target.value as Field['type'];
            set({ type, ...(type === 'object[]' && !('fields' in f && f.fields) ? { fields: [emptyField() as ScalarField] } : {}) });
          }}
        >
          {types.map((t) => (
            <option key={t} value={t}>
              {t === 'datetime' ? 'date-time' : t === 'object[]' ? 'list of objects' : t === 'string[]' ? 'list of strings' : t}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={pathParam || f.required} disabled={pathParam} onChange={(e) => set({ required: e.target.checked })} />
          required
        </label>
        <button type="button" className="btn btn-sm btn-ghost text-muted" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? 'Less' : 'More'}
        </button>
        <RemoveButton label={`Remove ${name}`} onClick={onRemove} />
      </div>
      <input className="field mt-2 text-sm" aria-label={`What ${name} means`} placeholder="What it means (for the people reading the contract)" value={f.description} onChange={(e) => set({ description: e.target.value })} />
      {open ? (
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          {isString ? (
            <>
              <SmallNum label="max length" value={f.maxLength} onChange={(v) => set({ maxLength: v })} />
              <SmallNum label="min length" value={f.minLength} onChange={(v) => set({ minLength: v })} />
              <label className="flex items-center gap-1.5">
                <span>allowed values</span>
                <input
                  className="field mono w-48 !py-1"
                  placeholder="a, b, c"
                  value={(f.enum ?? []).join(', ')}
                  onChange={(e) => {
                    const list = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                    set({ enum: list.length ? list : undefined });
                  }}
                />
              </label>
            </>
          ) : null}
          {isNum ? (
            <>
              <SmallNum label="minimum" value={f.minimum} onChange={(v) => set({ minimum: v })} />
              <SmallNum label="maximum" value={f.maximum} onChange={(v) => set({ maximum: v })} />
            </>
          ) : null}
          {isArray ? <SmallNum label="max items" value={f.maxItems} onChange={(v) => set({ maxItems: v })} /> : null}
          {!isParam ? (
            <label className="flex items-center gap-1.5">
              <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={!!f.nullable} onChange={(e) => set({ nullable: e.target.checked || undefined })} />
              may be null
            </label>
          ) : null}
        </div>
      ) : null}
      {f.type === 'object[]' ? (
        <div className="mt-2 border-l-2 border-accent/40 pl-3">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Each item in “{f.name || 'the list'}” has</div>
          <FieldList
            fields={('fields' in f && f.fields) || []}
            nested
            onChange={(fields) => set({ fields: fields as ScalarField[] })}
            addLabel="Add a field to each item"
            make={() => emptyField() as ScalarField}
          />
        </div>
      ) : null}
    </div>
  );
}

function SmallNum({ label, value, onChange }: { label: string; value?: number; onChange: (v?: number) => void }) {
  return (
    <label className="flex items-center gap-1.5">
      <span>{label}</span>
      <input className="field mono w-20 !py-1" inputMode="numeric" value={value ?? ''} onChange={(e) => onChange(optNum(e.target.value))} />
    </label>
  );
}

const TABS = [
  { id: 'openapi', label: 'OpenAPI', file: 'openapi.yaml', type: 'application/yaml', note: 'The whole endpoint: paths, parameters, bodies, every response, security. Tools can draw docs, mock servers and clients from it.' },
  { id: 'jsonschema', label: 'JSON Schema', file: 'schemas.json', type: 'application/json', note: 'Just the shapes of the JSON bodies. Any language can check a document against it.' },
  { id: 'zod', label: 'Zod', file: 'contract.ts', type: 'text/typescript', note: 'Checks data at runtime in TypeScript and gives you the types for free.' },
  { id: 'summary', label: 'In words', file: 'contract.md', type: 'text/markdown', note: 'A readable summary for a design document.' },
] as const;

function Output({ contract, warnings }: { contract: Contract; warnings: Warning[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('openapi');
  const uid = useId();
  const text = useMemo(() => {
    try {
      if (tab === 'openapi') return toOpenApiYaml(contract);
      if (tab === 'jsonschema') return toJsonSchemaText(contract);
      if (tab === 'zod') return toZod(contract);
      return contractMarkdown(contract);
    } catch (e) {
      return `Couldn’t generate this: ${e instanceof Error ? e.message : String(e)}`;
    }
  }, [tab, contract]);
  const t = TABS.find((x) => x.id === tab)!;
  const serious = warnings.filter((w) => w.level !== 'tip').length;
  const downloadText = tab === 'jsonschema' ? text.replace(/^\/\/.*$/gm, '').trim() : text;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-2 px-3 py-2">
        <div role="tablist" aria-label="Generated contract" className="flex flex-wrap gap-1">
          {TABS.map((x) => (
            <button
              key={x.id}
              id={`${uid}-tab-${x.id}`}
              role="tab"
              type="button"
              aria-selected={tab === x.id}
              aria-controls={`${uid}-panel`}
              tabIndex={tab === x.id ? 0 : -1}
              className={`rounded-md px-2.5 py-1 text-sm font-semibold ${tab === x.id ? 'bg-surface text-accent shadow-sm' : 'text-muted hover:text-fg'}`}
              onClick={() => setTab(x.id)}
              onKeyDown={(e) => {
                const i = TABS.findIndex((y) => y.id === tab);
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  const next = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
                  setTab(next.id);
                  document.getElementById(`${uid}-tab-${next.id}`)?.focus();
                }
              }}
            >
              {x.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <CopyButton text={text} />
          <button type="button" className="btn btn-sm" onClick={() => download(t.file, downloadText, t.type)}>
            <IconDownload /> {t.file}
          </button>
        </div>
      </div>
      <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${tab}`}>
        <p className="border-b border-line px-4 py-2 text-sm text-muted">{t.note}</p>
        {serious > 0 ? (
          <p className="flex items-center gap-1.5 border-b border-line bg-[var(--warn-bg)] px-4 py-2 text-sm text-[var(--warn-ink)]">
            <IconAlert className="shrink-0" /> {serious} thing{serious === 1 ? '' : 's'} to check in the form. The output is only as complete as the form.
          </p>
        ) : null}
        <pre className="code m-0 max-h-[70vh] overflow-auto !rounded-none !border-0 !bg-surface" tabIndex={0} aria-label={`${t.label} output`}>
          {text}
        </pre>
      </div>
    </div>
  );
}
