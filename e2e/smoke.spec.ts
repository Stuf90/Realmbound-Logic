import { expect, test } from '@playwright/test';

test.describe('Royal Inquest smoke', () => {
  test('ledger to puzzle and back', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'The King’s Ledger' })).toBeVisible();

    await page.getByRole('button', { name: /Royal Inquest/ }).click();
    const levelList = page.getByRole('list', { name: 'Royal Inquest levels' });
    await expect(levelList).toBeVisible();

    await levelList.getByRole('button', { name: /^Level 1\b/ }).click();
    await expect(page.getByRole('button', { name: 'Begin the inquest' })).toBeVisible();

    await page.getByRole('button', { name: 'Begin the inquest' }).click();
    await expect(page.getByRole('grid')).toBeVisible();
    await expect(page.getByRole('toolbar', { name: 'Puzzle actions' })).toBeVisible();

    await page.getByRole('button', { name: 'Back to Royal Inquest levels' }).click();
    await expect(levelList).toBeVisible();

    await page.getByRole('button', { name: 'Back to puzzle families' }).click();
    await expect(page.getByRole('heading', { name: 'The King’s Ledger' })).toBeVisible();
  });
});

test.describe('Siege Lines smoke', () => {
  test('ledger to puzzle and back', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /Siege Lines/ }).click();
    const levelList = page.getByRole('list', { name: 'Siege Lines levels' });
    await expect(levelList).toBeVisible();

    await levelList.getByRole('button', { name: /^Level 1\b/ }).click();
    await expect(page.getByRole('button', { name: 'Open the works' })).toBeVisible();

    await page.getByRole('button', { name: 'Open the works' }).click();
    await expect(page.locator('.siege-wrap')).toBeVisible();
    await expect(page.getByRole('toolbar', { name: 'Puzzle actions' })).toBeVisible();

    await page.getByRole('button', { name: 'Back to Siege Lines levels' }).click();
    await expect(levelList).toBeVisible();
  });
});
