'use client';
import { useId, useRef } from 'react';
import { z } from 'zod';
import { TEMPLATES } from '@/lib/templates';
import { useHydrated, useStored } from '@/lib/storage';
import { IconDownload } from '../icons';
import { CopyButton, download } from './CopyButton';
import { MermaidEditor } from './MermaidEditor';

const schema = z.object({ code: z.string().max(100_000), template: z.string().max(40) });
const START = { code: TEMPLATES[0].code, template: TEMPLATES[0].id };

/** The diagram playground: Mermaid editor, live preview, starter templates. */
export function Playground() {
  const [saved, setSaved] = useStored('tool:playground', schema, START);
  const hydrated = useHydrated();
  const s = hydrated ? saved : START;
  const svg = useRef<string | null>(null);
  const selectId = useId();
  const current = TEMPLATES.find((t) => t.id === s.template);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor={selectId} className="label">
            Start from a template
          </label>
          <select
            id={selectId}
            className="field w-auto"
            value={s.template}
            onChange={(e) => {
              const t = TEMPLATES.find((x) => x.id === e.target.value);
              if (!t) return;
              const edited = s.code.trim() !== (current?.code ?? '').trim();
              if (edited && !window.confirm('Replace your diagram with this template?')) return;
              setSaved({ code: t.code, template: t.id });
            }}
          >
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        {current ? <p className="hint max-w-md pb-2">{current.when}</p> : null}
        <div className="ml-auto flex gap-2 pb-0.5">
          <CopyButton text={s.code} label="Copy text" />
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              if (svg.current) download('diagram.svg', svg.current, 'image/svg+xml');
            }}
          >
            <IconDownload /> SVG
          </button>
        </div>
      </div>
      <MermaidEditor value={s.code} onChange={(code) => setSaved((p) => ({ ...p, code }))} rows={22} onSvg={(x) => (svg.current = x)} />
    </div>
  );
}
