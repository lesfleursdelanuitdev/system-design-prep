import { expect, test } from '@playwright/test';
import { lessons, plain, quiz, sort, watchErrors } from './helpers';

test('finishing a quiz: feedback for each answer, a score, and it is remembered', async ({ page }) => {
  const errors = watchErrors(page);
  const lesson = lessons().find((l) => l.id === 'getting-oriented/meet-shelf')!;
  const ex = quiz('u1-shelf-facts');
  await page.goto(lesson.href);
  const box = page.locator(`[data-exercise="${ex.id}"]`);
  for (const [qi, q] of ex.questions.entries()) {
    const group = box.locator('fieldset').nth(qi);
    // Answer the first question wrongly, the rest correctly.
    const pick = qi === 0 ? q.options.findIndex((o) => !o.correct) : q.options.findIndex((o) => o.correct);
    await group.getByRole('radio').nth(pick).check();
    await group.getByRole('button', { name: 'Check answer' }).click();
    await expect(group.getByText(qi === 0 ? 'Not quite.' : 'Right.', { exact: true })).toBeVisible();
    await expect(group.getByText(plain(q.options[pick].explanation).replace(/^(Right|Not quite)\.\s*/, ''))).toBeVisible();
  }
  const n = ex.questions.length;
  await expect(box.getByText(`You got ${n - 1} of ${n} right.`)).toBeVisible();
  // Every option's explanation can be shown, including the wrong ones.
  await box.getByRole('button', { name: 'Why each option is right or wrong' }).first().click();
  for (const o of ex.questions[0].options) await expect(box.getByText(plain(o.explanation).replace(/^(Right|Not quite)\.\s*/, ''))).toBeVisible();
  await page.reload();
  await expect(box.getByText(`You got ${n - 1} of ${n} right.`)).toBeVisible();
  await box.getByRole('button', { name: 'Start again' }).click();
  await expect(box.getByText(`${n} questions`)).toBeVisible();
  expect(errors).toEqual([]);
});

test('sorting: each placement shows right or wrong and why', async ({ page }) => {
  const lesson = lessons().find((l) => l.id === 'getting-oriented/what-designing-means')!;
  const ex = sort('u1-cheap-or-expensive');
  await page.goto(lesson.href);
  const box = page.locator(`[data-exercise="${ex.id}"]`);
  const label = (id: string) => ex.buckets.find((b) => b.id === id)!.label;
  const wrong = (id: string) => ex.buckets.find((b) => b.id !== id)!.label;
  for (const [i, item] of ex.items.entries()) {
    const group = box.getByRole('group', { name: `Where does item ${i + 1} go?` });
    await group.getByRole('button', { name: i === 0 ? wrong(item.bucket) : label(item.bucket) }).click();
  }
  await expect(box.getByText(`${ex.items.length - 1} of ${ex.items.length} in the right place.`)).toBeVisible();
  await box.getByRole('group', { name: 'Where does item 1 go?' }).getByRole('button', { name: label(ex.items[0].bucket) }).click();
  await expect(box.getByText(`${ex.items.length} of ${ex.items.length} in the right place. All correct.`)).toBeVisible();
});
