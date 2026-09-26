'use client';
import { useId } from 'react';
import { MermaidView } from './MermaidView';

/**
 * A Mermaid diagram with a text description underneath (always visible, for screen
 * readers and for anyone who prefers words). Write the Mermaid as a ```mermaid fence
 * inside the component; it arrives here as `code`.
 */
export function Diagram({ code, title, description, caption }: { code: string; title?: string; description?: string; caption?: string }) {
  const id = useId();
  const descId = `${id}-desc`;
  return (
    <figure className="diagram my-6 overflow-hidden rounded-xl border border-line bg-surface">
      {title ? <div className="border-b border-line px-4 py-2 text-sm font-semibold">{title}</div> : null}
      <div className="px-3 py-4 sm:px-5">
        <MermaidView code={code} label={title ?? 'Diagram'} describedBy={description ? descId : undefined} />
      </div>
      {description || caption ? (
        <figcaption className="space-y-1 border-t border-line bg-surface-2 px-4 py-3 text-[0.9rem] leading-relaxed">
          {caption ? <p className="font-medium">{caption}</p> : null}
          {description ? (
            <p id={descId} className="text-muted">
              <span className="font-semibold text-fg">In words: </span>
              {description}
            </p>
          ) : null}
        </figcaption>
      ) : null}
      <details className="border-t border-line text-sm">
        <summary className="cursor-pointer px-4 py-2 text-muted hover:text-fg">Show the Mermaid source</summary>
        <pre className="code m-3 mt-0 whitespace-pre">{code.trim()}</pre>
      </details>
    </figure>
  );
}
