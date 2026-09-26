import { expect, test } from '@playwright/test';
import { lessons, watchErrors } from './helpers';

test('reading a lesson: parts, glossary tooltip, completing it, moving on', async ({ page }) => {
  const errors = watchErrors(page);
  const [first, second] = lessons();
  await page.goto(first.href);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(first.title);
  for (const part of ['In one sentence', 'Example', 'The general idea', 'Common mistakes', 'Try it', 'Key terms']) {
    await expect(page.getByRole('heading', { level: 2, name: new RegExp(part) })).toBeVisible();
  }

  // Hovering a dotted term shows its definition; clicking pins it with a glossary link.
  const term = page.locator('.term-trigger').first();
  await term.hover();
  const tip = page.locator('.term-tip:visible');
  await expect(tip).toHaveCount(1);
  await term.click();
  await expect(tip.getByRole('link', { name: 'Open in the glossary' })).toBeVisible();
  await page.keyboard.press('Escape');

  // Mark complete: the sidebar ticks it, and it survives a reload.
  await page.getByRole('button', { name: 'Mark this lesson complete' }).click();
  await expect(page.getByRole('button', { name: 'Completed' })).toBeVisible();
  const sidebar = page.getByRole('navigation', { name: 'Course contents' }).first();
  await expect(sidebar.getByRole('link', { name: `${first.title} (completed)` })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Completed' })).toBeVisible();

  // Next lesson.
  await page.getByRole('link', { name: new RegExp(`Next.*${second.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(second.title);
  expect(errors).toEqual([]);
});

test('the home page offers to continue where you left off', async ({ page }) => {
  const [first] = lessons();
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Start with Unit 1/ })).toBeVisible();
  await page.goto(first.href);
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Continue/ })).toBeVisible();
});

test('light and dark themes', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  const toggle = page.getByRole('button', { name: /^Theme:/ });
  await toggle.click(); // system → light
  await expect(html).toHaveAttribute('data-theme', 'light');
  await toggle.click(); // light → dark
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'dark');
});
