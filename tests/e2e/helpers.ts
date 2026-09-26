import { expect, type Page } from '@playwright/test';
import { getExercise, getLessons } from '../../src/lib/content';
import type { QuizExercise, SortExercise } from '../../src/lib/schemas';

export const lessons = () => getLessons();
export const quiz = (id: string) => getExercise(id) as QuizExercise;
export const sort = (id: string) => getExercise(id) as SortExercise;

/** Collects uncaught errors and console errors (ignoring prefetches of pages that don't exist yet). */
export function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text());
  });
  return errors;
}

/** Waits until every Mermaid diagram on the page has rendered (or failed). */
export async function diagramsSettled(page: Page) {
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 30_000 });
}

/** Plain text of inline markdown, as it appears on the page. */
export function plain(md: string): string {
  return md.replace(/`([^`]*)`/g, '$1').replace(/\*\*([^*]*)\*\*/g, '$1').replace(/\*([^*]*)\*/g, '$1').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
}
