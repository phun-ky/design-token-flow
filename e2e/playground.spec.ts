import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('playground');
  await page.evaluate(() => localStorage.removeItem('dtf-demo'));
  await page.reload();
  await page.waitForLoadState('networkidle');
});

const pills = '#groups .design-token';

test('shows the showcase tokens, highlighted', async ({ page }) => {
  await expect(page.locator('h1')).toHaveText('Token pill playground');
  await expect(page.locator(pills)).toHaveCount(42);
  await expect(page.locator('.demo-source')).toHaveClass(/is-highlighted/);
});

test('selects a pill with the mouse or the keyboard', async ({ page }) => {
  await page.locator('[data-demo-id="color-palette-coral"]').click();
  await expect(page.locator('#details h2')).toHaveText('color.palette.coral');
  await expect(page.locator('#details pre.shiki').first()).toBeVisible();

  await page.locator('[data-demo-id="shadow-raised"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#details h2')).toHaveText('shadow.raised');
  // Pretty printed: the pill and its children on separate lines
  expect(
    (await page.locator('pre.demo-html').textContent())?.split('\n').length
  ).toBeGreaterThan(3);
});

test('copies the rendered HTML as one line', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.locator('[data-demo-id="shadow-raised"]').click();
  await page.locator('#copy').click();
  await expect(page.locator('#copy')).toHaveText('copied');

  const copied = await page.evaluate(() => navigator.clipboard.readText());
  const rendered = await page
    .locator('[data-demo-id="shadow-raised"]')
    .evaluate((element) => {
      const copy = element.cloneNode(true) as HTMLElement;

      // The playground adds these for selection and focus
      copy.classList.remove('is-selected', 'is-related');
      copy.removeAttribute('tabindex');
      copy.removeAttribute('data-demo-id');
      copy.querySelector('code')?.style.removeProperty('inline-size');

      if (!copy.querySelector('code')?.getAttribute('style'))
        copy.querySelector('code')?.removeAttribute('style');

      return copy.outerHTML;
    });

  expect(copied).not.toContain('\n');
  expect(copied).toBe(rendered);
});

test('filters, switches to the bundled tokens and reports invalid JSON', async ({
  page
}) => {
  await page.locator('#filter').fill('shadow');
  await expect(page.locator(pills)).toHaveCount(2);
  await page.locator('#filter').fill('');

  await page.locator('#preset').selectOption('bundled');
  await expect(page.locator(pills)).toHaveCount(201);

  await page.locator('#source').fill(
    JSON.stringify({
      size: { $type: 'dimension', r: { $value: { value: '1px', unit: 'px' } } }
    })
  );
  await expect(page.locator('#error')).toContainText(
    'Invalid token "size.r" (dimension): $value.value must be a number'
  );
  await expect(page.locator(pills)).toHaveCount(0);

  await page.locator('#source').fill(
    JSON.stringify({
      size: { $type: 'dimension', r: { $value: { value: 1, unit: 'px' } } }
    })
  );
  await expect(page.locator('#error')).toBeHidden();
  await expect(page.locator(pills)).toHaveCount(1);
});
