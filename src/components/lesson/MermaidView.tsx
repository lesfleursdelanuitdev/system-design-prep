'use client';
import { useEffect, useState } from 'react';
import { renderMermaid } from '@/lib/mermaid';
import { useResolvedTheme } from '@/lib/theme';

/** Renders Mermaid text to SVG in the browser. Re-renders when the code or the theme changes. */
export function MermaidView({
  code,
  label,
  describedBy,
  debounce = 0,
  onResult,
}: {
  code: string;
  label?: string;
  describedBy?: string;
  debounce?: number;
  onResult?: (r: { ok: boolean; error?: string; svg?: string }) => void;
}) {
  const theme = useResolvedTheme();
  const [state, setState] = useState<{ svg?: string; error?: string; pending: boolean }>({ pending: true });

  useEffect(() => {
    let cancelled = false;
    const t = window.setTimeout(() => {
      renderMermaid(code, theme).then((r) => {
        if (cancelled) return;
        if (r.ok) setState({ svg: r.svg, pending: false });
        else setState((s) => ({ svg: s.svg, error: r.error, pending: false }));
        onResult?.(r.ok ? { ok: true, svg: r.svg } : { ok: false, error: r.error });
      });
    }, debounce);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, theme, debounce]);

  return (
    <div className="relative">
      {state.error ? (
        <div role="alert" className="diagram-error mb-2 rounded-md border border-bad/40 bg-bad-soft px-3 py-2 text-sm text-bad">
          <strong>This diagram has an error.</strong>
          <pre className="mt-1 whitespace-pre-wrap font-mono text-xs">{state.error}</pre>
        </div>
      ) : null}
      {state.svg ? (
        <div
          className={`diagram-canvas overflow-x-auto ${state.error ? 'opacity-40' : ''}`}
          role="img"
          aria-label={label ?? 'Diagram'}
          aria-describedby={describedBy}
          dangerouslySetInnerHTML={{ __html: state.svg }}
        />
      ) : state.pending ? (
        <div className="flex min-h-24 items-center justify-center text-sm text-muted" aria-busy="true">
          Drawing diagram…
        </div>
      ) : null}
    </div>
  );
}
