import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { diagramsSettled, lessons, watchErrors } from './helpers';

test.describe('every lesson', () => {
  for (const l of lessons()) {
    test(`${l.id} renders, with every diagram drawn`, async ({ page }) => {
      const errors = watchErrors(page);
      await page.goto(l.href);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(l.title);
      await diagramsSettled(page);
      await expect(page.locator('.diagram-error')).toHaveCount(0);
      expect(errors).toEqual([]);
    });
  }
});

test('search finds lessons and glossary terms', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.keyboard.press('/');
  const box = page.getByRole('searchbox', { name: 'Search lessons and terms' });
  await expect(box).toBeFocused();
  await box.fill('idempotency');
  const results = page.getByRole('listbox', { name: 'Search results' });
  await expect(results.getByRole('option').first()).toBeVisible();
  await expect(results).toContainText('Glossary');
  await box.fill('zzzz-no-such-thing');
  await expect(page.getByText('Nothing matches')).toBeVisible();
  await box.fill('meet shelf');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/meet-shelf/);
});

test('the glossary filters, and links to terms work', async ({ page }) => {
  await page.goto('/glossary/#latency');
  await expect(page.locator('#latency')).toBeInViewport();
  await page.getByLabel('Filter the glossary').fill('idempot');
  await expect(page.getByRole('heading', { name: 'Idempotency', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Latency', exact: true })).toHaveCount(0);
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 740 } });

  test('the menu opens, navigates and closes', async ({ page }) => {
    const [first] = lessons();
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    const menu = page.getByRole('dialog', { name: 'Menu' });
    await expect(menu).toBeVisible();
    await menu.getByRole('button', { name: /Show lessons in unit 1/ }).click();
    await menu.getByRole('link', { name: first.title }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(first.title);
    await expect(menu).toBeHidden();
  });

  for (const path of ['/', '/glossary/', '/tools/', '/capstone/', ...lessons().map((l) => l.href)]) {
    test(`no sideways scrolling on ${path}`, async ({ page }) => {
      await page.goto(path);
      await diagramsSettled(page);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test.describe('accessibility (axe)', () => {
  const pages = ['/', '/glossary/', '/tools/', '/playground/', '/capstone/', ...lessons().slice(0, 4).map((l) => l.href)];
  for (const path of pages) {
    for (const theme of ['light', 'dark'] as const) {
      test(`${path} (${theme})`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: theme });
        await page.goto(path);
        await diagramsSettled(page);
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        const summary = results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length}) e.g. ${v.nodes[0]?.target.join(' ')}`);
        expect(summary).toEqual([]);
      });
    }
  }
});
