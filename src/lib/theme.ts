'use client';
import { useSyncExternalStore } from 'react';

export type ThemeChoice = 'system' | 'light' | 'dark';

/** Runs in <head> before the first paint so the page never flashes the wrong theme. */
export const themeScript = `(function(){try{var c='system';try{var r=localStorage.getItem('sdp:theme');if(r)c=JSON.parse(r)}catch(e){}var d=c==='dark'||(c!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var h=document.documentElement;h.dataset.theme=d?'dark':'light';h.dataset.themeChoice=c}catch(e){}})();`;

export function applyTheme(choice: ThemeChoice) {
  const dark = choice === 'dark' || (choice === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const html = document.documentElement;
  html.dataset.theme = dark ? 'dark' : 'light';
  html.dataset.themeChoice = choice;
}

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => obs.disconnect();
}

/** The theme actually showing: 'light' or 'dark'. */
export function useResolvedTheme(): 'light' | 'dark' {
  return useSyncExternalStore(
    subscribe,
    () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'),
    () => 'light',
  );
}
