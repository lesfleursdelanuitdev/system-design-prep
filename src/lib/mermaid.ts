'use client';
// Loads Mermaid on first use and renders diagrams one at a time (Mermaid's renderer
// shares global state, so concurrent renders can trip over each other).
type Mermaid = typeof import('mermaid').default;

let loader: Promise<Mermaid> | null = null;
let queue: Promise<unknown> = Promise.resolve();
let counter = 0;
let configured: string | null = null;

const FONT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

const THEMES = {
  light: {
    darkMode: false,
    background: '#ffffff',
    primaryColor: '#e0f0ee',
    primaryBorderColor: '#0b6b69',
    primaryTextColor: '#1d2127',
    secondaryColor: '#f2f0eb',
    secondaryBorderColor: '#8a8276',
    tertiaryColor: '#ffffff',
    tertiaryBorderColor: '#c9c2b6',
    lineColor: '#56606b',
    textColor: '#1d2127',
    noteBkgColor: '#fdf3e1',
    noteBorderColor: '#c98a14',
    noteTextColor: '#1d2127',
    fontFamily: FONT,
    fontSize: '15px',
  },
  dark: {
    darkMode: true,
    background: '#171a1e',
    primaryColor: '#14302e',
    primaryBorderColor: '#52c5bd',
    primaryTextColor: '#e7e9ec',
    secondaryColor: '#1f2328',
    secondaryBorderColor: '#6b7480',
    tertiaryColor: '#171a1e',
    tertiaryBorderColor: '#414852',
    lineColor: '#a3abb6',
    textColor: '#e7e9ec',
    noteBkgColor: '#2b2210',
    noteBorderColor: '#d9a33a',
    noteTextColor: '#e7e9ec',
    fontFamily: FONT,
    fontSize: '15px',
  },
} as const;

function load(): Promise<Mermaid> {
  loader ??= import('mermaid').then((m) => m.default);
  return loader;
}

export type RenderResult = { ok: true; svg: string } | { ok: false; error: string };

export function renderMermaid(code: string, theme: 'light' | 'dark'): Promise<RenderResult> {
  const job = queue.then(async (): Promise<RenderResult> => {
    const mermaid = await load();
    if (configured !== theme) {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        themeVariables: THEMES[theme],
        fontFamily: FONT,
        flowchart: { htmlLabels: true, curve: 'basis' },
        sequence: { mirrorActors: false },
      });
      configured = theme;
    }
    const id = `mmd-${++counter}`;
    try {
      const { svg } = await mermaid.render(id, code.trim());
      return { ok: true, svg };
    } catch (e) {
      document.getElementById(id)?.remove();
      document.getElementById(`d${id}`)?.remove();
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, error: msg.split('\n').slice(0, 6).join('\n') };
    }
  });
  queue = job.catch(() => undefined);
  return job;
}
