import { test, expect, type Page } from '@playwright/test';

async function ready(page: Page, id: string) {
  await page.goto('/');
  await page.locator(`#${id}`).scrollIntoViewIfNeeded();
  await expect(page.locator(`#${id} [data-tool]`)).toHaveAttribute('data-ready', 'true');
}

test.describe('truss solver', () => {
  test('holds below the tested load and fails at it', async ({ page }) => {
    await ready(page, 'truss');
    const t = page.locator('#truss');
    await t.locator('#t-load').fill('20.6');
    await expect(t.locator('[data-out="status"]')).toContainText('Holding');
    await expect(t.locator('[data-out="critical"]')).toHaveText('82.4 N');
    await t.locator('#t-load').fill('20.7');
    await expect(t.locator('[data-out="status"]')).toContainText('Failed');
    await expect(t.locator('[data-out="critical"]')).toHaveText('82.8 N');
    await expect(t.locator('line.t-broken')).toHaveCount(1);
  });

  test('the button ramps to 20.7 N and reset restores the defaults', async ({ page }) => {
    await ready(page, 'truss');
    const t = page.locator('#truss');
    await t.getByRole('button', { name: 'Load it to 20.7 N' }).click();
    await expect(t.locator('#t-load-out')).toHaveText('20.7 N');
    await expect(t.locator('[data-out="status"]')).toContainText('Failed');
    await t.getByRole('button', { name: 'Reset' }).click();
    await expect(t.locator('#t-load-out')).toHaveText('12.0 N');
    await expect(t.locator('[data-out="status"]')).toContainText('Holding');
  });

  test('geometry changes the answer: a deeper truss carries more', async ({ page }) => {
    await ready(page, 'truss');
    const t = page.locator('#truss');
    await t.locator('#t-depth').fill('10');
    await expect(t.locator('[data-out="failLoad"]')).toHaveText('28.6 N');
    await t.locator('#t-panels').fill('6');
    await expect(t.locator('line.t-member')).toHaveCount(24);
    await t.getByRole('radio', { name: 'Pratt' }).check();
    await expect(t.locator('[data-out="criticalKind"]')).toContainText('bottom chord, compression');
  });

  test('the load can be moved to another joint from the keyboard', async ({ page }) => {
    await ready(page, 'truss');
    const t = page.locator('#truss');
    await t.locator('#t-node').fill('2');
    // Half the lever arm: the root chord carries half as much.
    await expect(t.locator('[data-out="critical"]')).toHaveText('24.0 N');
    await expect(t.locator('[data-out="failLoad"]')).toHaveText('41.4 N');
  });

  test('dragging the arrow changes the load and clicking a joint moves it', async ({ page }) => {
    await ready(page, 'truss');
    const t = page.locator('#truss');
    const handle = await t.locator('[data-handle="load"]').boundingBox();
    const x = handle!.x + handle!.width / 2, y = handle!.y + handle!.height / 2;
    await page.mouse.move(x, y); await page.mouse.down();
    await page.mouse.move(x, y + 30, { steps: 6 }); await page.mouse.up();
    const after = Number((await t.locator('#t-load-out').textContent())!.replace(' N', ''));
    expect(after).toBeGreaterThan(12.5);
    await t.locator('circle[data-node]').nth(1).click();
    await expect(t.locator('circle.t-loaded')).toHaveCount(1);
    await expect(t.locator('[data-out="failLoad"]')).not.toHaveText('20.7 N');
  });

  test('the load slider works from the keyboard', async ({ page }) => {
    await ready(page, 'truss');
    const load = page.locator('#t-load');
    await load.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#t-load-out')).toHaveText('12.1 N');
  });
});

test.describe('stirling cycle', () => {
  test('no temperature difference means no work; the Carnot limit follows the temperatures', async ({ page }) => {
    await ready(page, 'stirling');
    const s = page.locator('#stirling');
    await expect(s.locator('[data-out="carnot"]')).toHaveText('50.0%');
    await s.locator('#s-hot').fill('900');
    await expect(s.locator('[data-out="carnot"]')).toHaveText('66.7%');
    await s.locator('#s-hot').fill('300');
    await expect(s.locator('[data-out="carnot"]')).toHaveText('0.0%');
    await expect(s.locator('[data-out="work"]')).toHaveText(/^-?0\.000$/);
    await expect(s.locator('[data-out="status"]')).toContainText('No net work');
  });

  test('the flywheel turns when dragged', async ({ page }) => {
    await ready(page, 'stirling');
    const s = page.locator('#stirling');
    const wheel = await s.locator('.s-wheel').boundingBox();
    const cx = wheel!.x + wheel!.width / 2, cy = wheel!.y + wheel!.height / 2, r = wheel!.width * 0.4;
    const before = await s.locator('.s-pin').first().getAttribute('cx');
    await page.mouse.move(cx + r, cy); await page.mouse.down();
    await page.mouse.move(cx, cy + r, { steps: 8 }); await page.mouse.up();
    await expect(s.locator('.s-pin').first()).not.toHaveAttribute('cx', before!);
  });

  test('zero phase lead collapses the loop', async ({ page }) => {
    await ready(page, 'stirling');
    const s = page.locator('#stirling');
    await s.locator('#s-phase').fill('0');
    await expect(s.locator('[data-out="status"]')).toContainText('No net work');
  });
});

test.describe('sizing tool', () => {
  test('swapping a material changes mass and cost, and limits are enforced', async ({ page }) => {
    await ready(page, 'dog');
    const d = page.locator('#dog');
    const before = await d.locator('[data-out="mass"]').textContent();
    await expect(d.locator('[data-out="status"]')).toContainText('Closes');
    await d.locator('[data-part="deck"]').getByRole('radio', { name: 'Ti-6Al-4V' }).check();
    await expect(d.locator('[data-out="mass"]')).not.toHaveText(before!);
    // Titanium is stiffer than aluminum but much denser, so a stiffness-governed deck gets heavier.
    await expect(d.locator('[data-out="status"]')).toContainText('Over on weight and on cost');
    await d.locator('#z-mass').fill('60');
    await expect(d.locator('[data-out="status"]')).toContainText('Over on cost');
    await d.locator('[data-part="deck"]').getByRole('radio', { name: 'Aluminum 6061-T6' }).check();
    await expect(d.locator('[data-out="status"]')).toContainText('Closes');
    await expect(d.locator('[data-out="mass"]')).toHaveText(before!);
  });
});

test.describe('rov concept study', () => {
  test('the tube holds at 30 m and buckles before 300 m', async ({ page }) => {
    await ready(page, 'rov');
    const r = page.locator('#rov');
    await expect(r.locator('[data-out="status"]')).toContainText('Holding at 30 m');
    await expect(r.locator('[data-out="crush"]')).toHaveText('190 m');
    await r.locator('#r-depth').fill('300');
    await expect(r.locator('[data-out="status"]')).toContainText('Failed by buckling at 300 m');
    await r.locator('#r-wall').fill('12');
    await expect(r.locator('[data-out="status"]')).toContainText('Holding at 300 m');
  });
});

test.describe('off the clock', () => {
  test('logging sets follows double progression', async ({ page }) => {
    await page.goto('/');
    await page.locator('#life').scrollIntoViewIfNeeded();
    await expect(page.locator('#life')).toHaveAttribute('data-ready', 'true');
    const l = page.locator('[data-life="lifting"]');
    await expect(l.locator('.lift-target strong')).toHaveText('130 lb × 11');
    await l.getByRole('button', { name: 'Log the set' }).click();
    await expect(l.locator('.lift-target strong')).toHaveText('130 lb × 12');
    await l.getByRole('button', { name: 'Log the set' }).click();
    await expect(l.locator('.lift-target strong')).toHaveText('135 lb × 8');
    await expect(l.locator('[data-out="lift-status"]')).toContainText('Add 5 lb');
  });

  test('goal time sets the marathon pace', async ({ page }) => {
    await page.goto('/');
    await page.locator('#life').scrollIntoViewIfNeeded();
    await expect(page.locator('#life')).toHaveAttribute('data-ready', 'true');
    const r = page.locator('[data-life="running"]');
    await r.locator('#run-goal').fill('210');
    await expect(r.locator('#run-goal-out')).toHaveText('3:30');
    await expect(r.locator('[data-out="pace"]')).toHaveText('8:01 per mile');
  });
});
