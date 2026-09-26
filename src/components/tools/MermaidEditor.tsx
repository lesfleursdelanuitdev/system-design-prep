'use client';
import { useId, useState } from 'react';
import { MermaidView } from '../lesson/MermaidView';

/** A Mermaid text box with a live preview. */
export function MermaidEditor({
  value,
  onChange,
  label = 'Mermaid',
  rows = 14,
  layout = 'split',
  onSvg,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  rows?: number;
  layout?: 'split' | 'stack';
  onSvg?: (svg: string | null) => void;
}) {
  const id = useId();
  const [ok, setOk] = useState(true);
  return (
    <div className={`grid gap-3 ${layout === 'split' ? 'lg:grid-cols-2' : ''}`}>
      <div className="min-w-0">
        <label htmlFor={id} className="label">
          {label}
        </label>
        <textarea
          id={id}
          className="field mono !leading-relaxed"
          rows={rows}
          value={value}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Tab' && !e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey) {
              // Two spaces instead of leaving the box. Press Esc then Tab to move on.
              const t = e.currentTarget;
              if (t.dataset.escaped === '1') return;
              e.preventDefault();
              const { selectionStart: s, selectionEnd: en } = t;
              onChange(value.slice(0, s) + '  ' + value.slice(en));
              requestAnimationFrame(() => t.setSelectionRange(s + 2, s + 2));
            } else if (e.key === 'Escape') {
              e.currentTarget.dataset.escaped = '1';
            } else {
              e.currentTarget.dataset.escaped = '';
            }
          }}
          aria-describedby={`${id}-help`}
        />
        <p id={`${id}-help`} className="hint mt-1">
          Tab indents. Press Esc, then Tab, to leave the box. {ok ? '' : 'The preview shows the last version that worked.'}
        </p>
      </div>
      <div className="min-w-0">
        <div className="label" aria-hidden="true">
          Preview
        </div>
        <div className="min-h-40 rounded-lg border border-line bg-surface p-3">
          <MermaidView
            code={value}
            debounce={350}
            label="Preview of your diagram"
            onResult={(r) => {
              setOk(r.ok);
              onSvg?.(r.ok ? (r.svg ?? null) : null);
            }}
          />
        </div>
      </div>
    </div>
  );
}
