import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

test('sections exist in the order of the dive', async ({ page }) => {
  await page.goto('/');
  const ids = await page.locator('main > section').evaluateAll((els) => els.map((e) => e.id));
  expect(ids).toEqual(['top', 'work', 'truss', 'stirling', 'dog', 'rov', 'life', 'record', 'contact']);
});

test('landmarks: one main, one h1, footer outside main', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1, name: 'Dylan Wollet' })).toBeVisible();
  await expect(page.locator('body > footer')).toHaveCount(1);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('the facts a recruiter checks are present and exact', async ({ page }) => {
  await page.goto('/');
  const body = page.locator('main');
  await expect(body).toContainText('Seeking a Summer 2027 engineering internship in marine or space.');
  await expect(body).toContainText('3.833 / 4.0');
  await expect(body).toContainText('expected May 2028');
  await expect(body).toContainText('President’s List, Spring 2026');
  await expect(body).toContainText('Dean’s List, Fall 2024 and Spring 2025');
  await expect(body).toContainText('Digital Marketing Manager');
  await expect(body).toContainText('Oct 2026 to present');
  await expect(body).toContainText('Aug 2026 to Oct 2026');
  await expect(body).toContainText('Jul 2024 to Aug 2026');
  for (const s of ['Fullpath', 'VinSolutions', 'Xtime', 'Dealertrack', 'vAuto', '1926 Beverage Company', 'McKinney Electric', 'Good Shepherd Church']) {
    await expect(body).toContainText(s);
  }
  await expect(page.locator('#truss')).toContainText('Loaded it to failure at 20.7 N');
  await expect(page.locator('#truss')).toContainText('about 82.8 N');
  await expect(page.locator('#dog')).toContainText('$241.09 and 28.81 lb');
  await expect(page.locator('#record')).toContainText('high school externship');
  await expect(page.locator('#record')).toContainText('In progress, 2026');
});

test('unbuilt work says so plainly', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#rov')).toContainText('Concept stage. Nothing is built.');
  await expect(page.locator('#rov')).toContainText('not a validated design');
  await expect(page.locator('#dog')).toContainText('Not built or tested.');
  await expect(page.locator('#life')).toContainText('One user: me.');
});

test('every tool states its model and what its inputs are not', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#truss .tool-foot')).toContainText('Buckling is not modeled');
  await expect(page.locator('#truss .tool-foot')).toContainText('not a record of the truss I built');
  await expect(page.locator('#stirling .tool-foot')).toContainText('not measurements of the engine I machined');
  await expect(page.locator('#dog .tool-foot')).toContainText('not the assembly I designed');
});

test('excluded content never appears', async ({ page }) => {
  await page.goto('/');
  // textContent (not innerText) so collapsed <details> content is covered too.
  const text = (await page.evaluate(() => document.body.textContent ?? '')).toLowerCase();
  for (const banned of ['lorem', 'todo', 'tbd']) {
    expect(text).not.toMatch(new RegExp(`\\b${banned}\\b`));
  }
});

test('phone number is absent from built HTML', () => {
  const html = readFileSync('dist/index.html', 'utf8');
  expect(html).not.toMatch(/\(?\b\d{3}\)?[-.]\d{3}[-.]\d{4}\b/);
});

test('the public resume is a PDF with no recoverable phone number', async ({ request }) => {
  const res = await request.get('/Dylan_Wollet_Resume.pdf');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('application/pdf');
  let text: string;
  try {
    text = execFileSync('python3', ['-c', 'import sys\nfrom pypdf import PdfReader\nprint("".join(p.extract_text() for p in PdfReader(sys.argv[1]).pages))', 'public/Dylan_Wollet_Resume.pdf'], { encoding: 'utf8' });
  } catch {
    test.skip(true, 'python3 with pypdf is needed to read the PDF text');
    return;
  }
  expect(text).toContain('DYLAN WOLLET');
  expect(text).toContain('dfw24@fsu.edu');
  expect(text).not.toMatch(/\(?\b\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/);
});

test('contact links point where they say', async ({ page }) => {
  await page.goto('/');
  const c = page.locator('#contact');
  await expect(c.getByRole('link', { name: 'dfw24@fsu.edu' })).toHaveAttribute('href', 'mailto:dfw24@fsu.edu');
  await expect(c.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', /linkedin\.com\/in\/dylan-wollet/);
  await expect(c.getByRole('link', { name: 'Resume (PDF)' })).toHaveAttribute('href', '/Dylan_Wollet_Resume.pdf');
  await expect(page.locator('#work').getByRole('link', { name: 'the1926company.com' })).toHaveAttribute('href', 'https://the1926company.com');
  await expect(page.locator('#life').getByRole('link', { name: /Overload/ })).toHaveAttribute('href', 'https://overloadylan.netlify.app/');
});

test('share metadata is present', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://dylanwollet.netlify.app/og.png');
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Summer 2027/);
});
