import { test, expect } from '@playwright/test';

test.use({ reducedMotion: 'no-preference' });

test('the loader runs once, then gets out of the way', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#loader')).toBeVisible();
  await expect(page.locator('#loader')).toBeHidden({ timeout: 6000 });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.reload();
  await expect(page.locator('#loader')).toBeHidden();
});

test('content arrives as it is scrolled to and never stays hidden', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#loader')).toBeHidden({ timeout: 6000 });
  await expect(page.locator('#top .statement')).toHaveClass(/in/);
  await page.locator('#truss .facts li').first().scrollIntoViewIfNeeded();
  await expect(page.locator('#truss .facts li').first()).toHaveClass(/in/);
  await expect(page.locator('#truss .facts li').first()).toHaveCSS('opacity', '1');
});

test('the depth reading follows the scroll', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#loader')).toBeHidden({ timeout: 6000 });
  await expect(page.locator('#depth-out')).toHaveText('+000.0 m');
  await page.evaluate(() => { const el = document.getElementById('rov')!; window.scrollTo(0, el.offsetTop + el.offsetHeight / 2 - innerHeight / 2); });
  await expect(page.locator('#depth-out')).toHaveText(/−1[01]\d\.\d m/);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.locator('#depth-out')).toHaveText(/\+\d{3}\.\d km/);
});

test('with reduced motion there is no loader and nothing waits to be revealed', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('#loader')).toBeHidden();
  await expect(page.locator('html')).not.toHaveClass(/motion/);
  await expect(page.locator('#contact .statement')).toHaveCSS('opacity', '1');
  await context.close();
});
