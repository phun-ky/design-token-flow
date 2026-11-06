import { expect, test } from '@playwright/test';

import { canvasTransform, zoomLevel } from './site';

test.beforeEach(async ({ page }) => {
  await page.goto('');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
});

test('opens at 100%, fitted to the page width, with every pill', async ({
  page
}) => {
  await expect(page.locator('h1')).toHaveText('Token flow');
  await expect(page.locator('.design-token')).toHaveCount(201);
  expect(await zoomLevel(page)).toBe(100);

  const fits = await page.evaluate(() => {
    const flow = document.querySelector('.container') as HTMLElement;
    const canvas = document.querySelector('.app-viewport') as HTMLElement;

    return (
      Math.abs(
        flow.getBoundingClientRect().width -
          canvas.getBoundingClientRect().width
      ) <= 1
    );
  });

  expect(fits).toBe(true);
});

test('zooms with the buttons, and fits to the screen', async ({ page }) => {
  await page.getByRole('button', { name: 'Zoom in' }).click();
  expect(await zoomLevel(page)).toBe(110);
  await page.getByRole('button', { name: 'Zoom out' }).click();
  await page.getByRole('button', { name: 'Zoom out' }).click();
  expect(await zoomLevel(page)).toBe(90);
  await page.locator('.zoom-value').click();
  expect(await zoomLevel(page)).toBe(100);

  await page.getByRole('button', { name: 'Fit to screen' }).click();
  expect(await zoomLevel(page)).toBeLessThan(100);

  const inside = await page.evaluate(() => {
    const flow = (
      document.querySelector('.container') as HTMLElement
    ).getBoundingClientRect();
    const canvas = (
      document.querySelector('.app-viewport') as HTMLElement
    ).getBoundingClientRect();

    return (
      flow.left >= canvas.left - 1 &&
      flow.right <= canvas.right + 1 &&
      flow.top >= canvas.top - 1 &&
      flow.bottom <= canvas.bottom + 1
    );
  });

  expect(inside, 'the whole flow is on screen').toBe(true);
});

test('zooms with the wheel around the pointer', async ({ page }) => {
  const canvas = await page.locator('.app-viewport').boundingBox();
  const pointer = { x: 500, y: 400 };
  const before = await canvasTransform(page);

  await page.mouse.move(canvas!.x + pointer.x, canvas!.y + pointer.y);
  await page.mouse.wheel(0, -200);
  await expect.poll(() => zoomLevel(page)).toBeGreaterThan(100);

  const after = await canvasTransform(page);
  // The point of the flow under the pointer, before and after
  const at = (state: typeof before) => ({
    x: (pointer.x - state.x) / state.scale,
    y: (pointer.y - state.y) / state.scale
  });

  expect(at(after).x).toBeCloseTo(at(before).x, 0);
  expect(at(after).y).toBeCloseTo(at(before).y, 0);
});

test('pans by dragging', async ({ page }) => {
  const canvas = await page.locator('.app-viewport').boundingBox();
  const before = await canvasTransform(page);
  const start = { x: canvas!.x + 400, y: canvas!.y + 300 };

  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x - 200, start.y - 100, { steps: 5 });
  await page.mouse.up();

  const after = await canvasTransform(page);

  expect(after.x - before.x).toBeCloseTo(-200, 0);
  expect(after.y - before.y).toBeCloseTo(-100, 0);
  expect(after.scale).toBe(before.scale);
});

test('pans and zooms with the keyboard from the skip link', async ({
  page
}) => {
  await page.keyboard.press('Tab');
  await expect(page.locator('.app-skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#content')).toBeFocused();

  const start = await canvasTransform(page);

  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Shift+ArrowDown');

  const panned = await canvasTransform(page);

  expect(panned.x - start.x).toBe(-40);
  expect(panned.y - start.y).toBe(-200);

  await page.keyboard.press('+');
  expect(await zoomLevel(page)).toBe(110);
  await page.keyboard.press('-');
  expect(await zoomLevel(page)).toBe(100);
  await page.keyboard.press('f');
  expect(await zoomLevel(page)).toBeLessThan(100);
  await page.keyboard.press('0');
  expect(await zoomLevel(page)).toBe(100);
});

test('switches the theme, and keeps it on reload and on the playground', async ({
  page
}) => {
  const isLight = () =>
    page.evaluate(() =>
      document.documentElement.classList.contains('theme--light')
    );
  const wasLight = await isLight();

  await page.getByRole('switch', { name: 'Dark theme' }).click();
  expect(await isLight()).toBe(!wasLight);

  await page.reload();
  expect(await isLight()).toBe(!wasLight);

  await page.getByRole('link', { name: 'Playground' }).click();
  await expect(page).toHaveURL(/\/playground$/);
  expect(await isLight()).toBe(!wasLight);
});
