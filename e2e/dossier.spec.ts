import { expect, test } from '@playwright/test';

async function openRoyalInquestPuzzle(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Royal Inquest/ }).click();
  await page.getByRole('list', { name: 'Royal Inquest levels' }).getByRole('button', { name: /^Level 1\b/ }).click();
  await page.getByRole('button', { name: 'Begin the inquest' }).click();
  await expect(page.getByRole('grid')).toBeVisible();
}

// puzzle.css switches the dossier from a mobile drawer to a desktop sidebar at 801px — key the
// assertion off the actual viewport width against that breakpoint, not the project's nickname,
// since a "tablet"-sized viewport (e.g. 768px portrait) is still below it and gets drawer behavior.
const DOSSIER_SIDEBAR_BREAKPOINT = 801;

test('dossier is a collapsible drawer below 801px, an always-open sidebar at/above it', async ({ page }) => {
  await openRoyalInquestPuzzle(page);

  const toggle = page.locator('.dossier-toggle');
  const content = page.locator('.dossier-content');
  const viewportWidth = page.viewportSize()!.width;

  if (viewportWidth < DOSSIER_SIDEBAR_BREAKPOINT) {
    await expect(toggle).toBeVisible();
    await expect(content).toBeVisible();

    await toggle.click();
    await expect(content).toHaveClass(/collapsed/);
    await expect(content).toBeHidden();

    await toggle.click();
    await expect(content).not.toHaveClass(/collapsed/);
    await expect(content).toBeVisible();
  } else {
    await expect(toggle).toBeHidden();
    await expect(content).toBeVisible();
  }
});

test('toolbar buttons keep at least a 44x44 touch target on mobile', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'touch-target check only meaningful on the mobile project');
  await openRoyalInquestPuzzle(page);

  const buttons = await page.getByRole('toolbar', { name: 'Puzzle actions' }).getByRole('button').all();
  expect(buttons.length).toBeGreaterThan(0);
  for (const button of buttons) {
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
});
