import fs from 'node:fs';
import { expect, test } from '@playwright/test';
import { watchErrors } from './helpers';

test('exporting the capstone as markdown, then comparing with the reference', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/capstone/');
  await page.getByLabel('Your name (optional)').fill('Sam');
  await page.getByLabel('User stories (markdown)').fill('| # | Story | Acceptance criteria |\n|---|---|---|\n| S1 | As a curator, I want to tag an item | Tagging twice leaves one tag |');
  await page.getByLabel(/^Measure/).fill('within 10 s for 95% of batches');

  await page.getByRole('button', { name: 'Failure modes' }).first().click();
  await page.getByLabel('Row 1: step').fill('Nightly pull');
  await page.getByLabel('Row 1: what can go wrong').fill('A page times out');
  await page.getByLabel('Row 1: what happens').fill('Retry 3 times, then mark nothing missing');

  await page.getByRole('button', { name: 'Review and export' }).first().click();
  const md = page.getByLabel('Your design as markdown');
  await expect(md).toContainText('# Shelf: design on one page');
  await expect(md).toContainText('by Sam');
  await expect(md).toContainText('As a curator, I want to tag an item');
  await expect(md).toContainText('| Nightly pull | A page times out | Retry 3 times, then mark nothing missing |');

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'shelf-design.md' }).click();
  const file = await download;
  const text = fs.readFileSync((await file.path())!, 'utf8');
  expect(text).toContain('## 8. Failure modes');

  await expect(page.getByRole('heading', { name: 'The reference design' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Submit and show the reference design' }).click();
  await expect(page.getByRole('heading', { name: 'The reference design' })).toBeVisible();

  // The draft survives a reload, and each step can now be compared with the reference.
  await page.reload();
  await page.getByRole('button', { name: 'Failure modes' }).first().click();
  await expect(page.getByLabel('Row 1: step')).toHaveValue('Nightly pull');
  await page.getByText(/Compare with the reference design’s failure modes/).click();
  await expect(page.getByText('Retry 3 times with backoff, then abandon')).toBeVisible();
  expect(errors).toEqual([]);
});
