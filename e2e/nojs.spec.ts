import { test, expect } from '@playwright/test';

test.use({ javaScriptEnabled: false });

test('with JavaScript off, every section is readable and nothing is hidden behind a loader', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Dylan Wollet' })).toBeVisible();
  await expect(page.locator('#loader')).toBeHidden();
  for (const id of ['work', 'truss', 'stirling', 'dog', 'rov', 'life', 'record', 'contact']) {
    await expect(page.locator(`#${id} h2`)).toBeVisible();
  }
  await expect(page.locator('#work')).toContainText('Good Shepherd Church');
  await expect(page.locator('#contact').getByRole('link', { name: 'dfw24@fsu.edu' })).toBeVisible();
});

test('with JavaScript off, each tool shows a solved default state in text', async ({ page }) => {
  await page.goto('/');
  const truss = page.locator('#truss');
  await expect(truss.locator('.truss-svg line.t-member')).toHaveCount(16);
  await expect(truss.locator('.truss-svg circle.t-joint').first()).toBeVisible();
  await expect(truss.locator('[data-out="critical"]')).toHaveText('48.0 N');
  await expect(truss.locator('[data-out="failLoad"]')).toHaveText('20.7 N');
  await expect(page.locator('#stirling [data-out="carnot"]')).toHaveText('50.0%');
  await expect(page.locator('#dog [data-out="mass"]')).toHaveText(/^\d+\.\d\d$/);
  await expect(page.locator('#rov [data-out="pressure"]')).toHaveText('294 kPa');
  await expect(page.locator('#rov [data-out="status"]')).toContainText('Holding at 30 m');
});

test('with JavaScript off, controls that need script are not offered', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-action="tested"]')).toBeHidden();
  await expect(page.locator('[data-copy]')).toBeHidden();
  await expect(page.locator('[data-pads]')).toBeHidden();
});
