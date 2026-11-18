import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('no page errors and no failed requests', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('requestfailed', (r) => errors.push(`failed: ${r.url()}`));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  for (const id of ['truss', 'stirling', 'dog', 'rov']) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    await expect(page.locator(`#${id} [data-tool]`)).toHaveAttribute('data-ready', 'true');
  }
  await page.locator('#contact').scrollIntoViewIfNeeded();
  expect(errors).toEqual([]);
});

test('the page never scrolls sideways', async ({ page }) => {
  await page.goto('/');
  for (const id of ['top', 'work', 'truss', 'stirling', 'dog', 'rov', 'life', 'record', 'contact']) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(over, `overflow at #${id}`).toBeLessThanOrEqual(0);
  }
});

test('nothing inside a section pokes out past the viewport', async ({ page }) => {
  await page.goto('/');
  const width = page.viewportSize()!.width;
  const wide = await page.locator('main *').evaluateAll((els, w) =>
    els.filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > w + 1 || r.left < -1); })
      .map((e) => `${e.tagName}.${e.className}`.slice(0, 60)).slice(0, 8), width);
  expect(wide).toEqual([]);
});

test('the name and the seeking line fit on the first screen', async ({ page }) => {
  await page.goto('/');
  const h = page.viewportSize()!.height;
  const name = await page.locator('h1').boundingBox();
  expect(name!.y + name!.height).toBeLessThan(h);
  await expect(page.locator('.seeking')).toBeInViewport();
});

test('no axe violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, JSON.stringify(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })), null, 2)).toEqual([]);
});

test('no axe violations after every tool has mounted and coursework is open', async ({ page }) => {
  await page.goto('/');
  for (const id of ['truss', 'stirling', 'dog', 'rov', 'life']) await page.locator(`#${id}`).scrollIntoViewIfNeeded();
  await expect(page.locator('#rov [data-tool]')).toHaveAttribute('data-ready', 'true');
  await page.locator('#record summary').click();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, JSON.stringify(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })), null, 2)).toEqual([]);
});

test('skip link and in-page navigation move focus', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip')).toBeFocused();
  await page.locator('.bar nav').getByRole('link', { name: 'Contact' }).click();
  await expect(page.locator('#contact')).toBeInViewport();
});

test('print hides the canvases and keeps the content', async ({ page }) => {
  await page.goto('/');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#column')).toBeHidden();
  await expect(page.locator('.bar')).toBeHidden();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('#truss .facts')).toBeVisible();
  // Polled: the emulated media can take a frame to reach computed style under load.
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(255, 255, 255)');
});
