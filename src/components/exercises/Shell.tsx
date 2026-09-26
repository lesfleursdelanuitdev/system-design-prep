import type { ReactNode } from 'react';

/** The frame every exercise sits in. */
export function ExerciseShell({
  kind,
  title,
  intro,
  children,
  footer,
  id,
}: {
  kind: string;
  title?: string;
  intro?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  id?: string;
}) {
  return (
    <section
      className="exercise not-prose my-6 overflow-hidden rounded-xl border border-line bg-surface text-[0.975rem] shadow-[var(--shadow)]"
      aria-labelledby={id ? `${id}-title` : undefined}
      data-exercise={id}
    >
      <header className="border-b border-line bg-surface-2 px-4 py-3 sm:px-5">
        <div className="text-xs font-bold uppercase tracking-wider text-accent">{kind}</div>
        {title ? (
          <h3 id={id ? `${id}-title` : undefined} className="mt-0.5 text-[1.05rem] font-bold leading-snug">
            {title}
          </h3>
        ) : null}
        {intro ? <div className="mt-1 space-y-2 text-[0.95rem] text-fg/85">{intro}</div> : null}
      </header>
      <div className="px-4 py-4 sm:px-5">{children}</div>
      {footer ? <footer className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3 sm:px-5">{footer}</footer> : null}
    </section>
  );
}

/** Markdown rendered on the server, dropped into client components. */
export function Rich({ children, className = '', as: Tag = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'span' }) {
  return (
    <Tag
      className={`space-y-2 [&_a]:text-accent [&_a]:underline [&_code]:rounded [&_code]:bg-surface-2 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.85em] [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:border-line [&_pre]:p-3 [&_pre]:text-[0.8rem] [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_table]:w-full [&_table]:text-sm [&_td]:border-b [&_td]:border-line [&_td]:px-2 [&_td]:py-1 [&_th]:border-b [&_th]:border-line [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_ul]:list-disc [&_ul]:pl-5 ${className}`}
    >
      {children}
    </Tag>
  );
}
