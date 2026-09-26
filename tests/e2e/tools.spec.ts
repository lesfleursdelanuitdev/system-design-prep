import fs from 'node:fs';
import { expect, test } from '@playwright/test';
import { parse as parseYaml } from 'yaml';
import { diagramsSettled, watchErrors } from './helpers';

test('using the contract builder: presets, three outputs, warnings, download', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/tools/#contract');
  const builder = page.locator('.contract-builder');
  const output = builder.getByLabel(/output$/);

  // Starts on Shelf's list endpoint.
  await expect(output).toContainText('openapi: 3.1.0');
  await expect(output).toContainText('/shelf/items:');
  await builder.getByRole('tab', { name: 'Zod' }).click();
  await expect(output).toContainText('export const ListItemsResponse = z.object({');
  await builder.getByRole('tab', { name: 'JSON Schema' }).click();
  await expect(output).toContainText('"$schema": "https://json-schema.org/draft/2020-12/schema"');

  // A blank contract warns about missing errors and guarantees.
  await builder.getByLabel('Start from').selectOption('blank');
  await expect(builder.getByText(/No errors listed/)).toBeVisible();
  await expect(builder.getByText(/Safe to send twice\? is blank/)).toBeVisible();

  // Filling things in updates every output.
  await builder.getByLabel('Summary').fill('Get one thing');
  await builder.getByRole('button', { name: 'Add an error' }).click();
  await builder.getByLabel('Error 1: HTTP status').fill('404');
  await builder.getByLabel('Error 1: code').fill('thing_not_found');
  await builder.getByLabel('Error 1: when it happens').fill('No thing has this id.');
  await expect(builder.getByText(/No errors listed/)).toHaveCount(0);
  await builder.getByRole('tab', { name: 'OpenAPI' }).click();
  await expect(output).toContainText('thing_not_found');

  const download = page.waitForEvent('download');
  await builder.getByRole('button', { name: 'openapi.yaml' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('openapi.yaml');
  const doc = parseYaml(fs.readFileSync((await file.path())!, 'utf8'));
  expect(doc.paths['/v1/things/{thingId}'].get.summary).toBe('Get one thing');
  expect(errors).toEqual([]);
});

test('the calculators show their working', async ({ page }) => {
  await page.goto('/tools/');
  await expect(page.getByText('5,000 users × 30 requests each = 150,000 requests a day.')).toBeVisible();
  await page.getByLabel('Users per day').fill('50000');
  await expect(page.getByText('50,000 users × 30 requests each = 1,500,000 requests a day.')).toBeVisible();
  await page.getByRole('button', { name: '99.99%' }).click();
  await expect(page.getByRole('cell', { name: '4 min 23 s' })).toBeVisible();
});

test('the diagram playground renders as you type', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/playground/');
  await diagramsSettled(page);
  await expect(page.locator('.diagram-canvas svg')).toBeVisible();
  const editor = page.getByLabel('Mermaid');
  await editor.fill('flowchart LR\n  A[Recipe site] --> B[Shelf]');
  await expect(page.locator('.diagram-canvas')).toContainText('Recipe site');
  await editor.fill('flowchart LR\n  A[Recipe site --> ');
  await expect(page.locator('.diagram-error')).toContainText('This diagram has an error');
  expect(errors).toEqual([]);
});
