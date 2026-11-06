import type { Page } from '@playwright/test';

/** The site's pages, by their path under the base URL */
export const PAGES = [
  { name: 'flow', path: '' },
  { name: 'playground', path: 'playground' },
  { name: '404', path: 'no/such/page', status: 404 }
] as const;

export const THEMES = ['dark', 'light'] as const;

export type Theme = (typeof THEMES)[number];

/**
 * Opens pages in a theme: the stored choice the site reads (`dtf-theme`), and
 * the system setting the 404 page follows.
 */
export const useTheme = async (page: Page, theme: Theme): Promise<void> => {
  await page.emulateMedia({ colorScheme: theme });
  await page.addInitScript((value) => {
    try {
      localStorage.setItem('dtf-theme', value);
    } catch {
      // Storage blocked: the page falls back to the system setting
    }
  }, theme);
};

/** The zoom level the pane shows, as a number: 100 for "100%" */
export const zoomLevel = async (page: Page): Promise<number> =>
  parseInt((await page.locator('.zoom-value').textContent()) ?? '', 10);

/** The canvas transform as numbers */
export const canvasTransform = async (
  page: Page
): Promise<{ x: number; y: number; scale: number }> => {
  const transform = await page
    .locator('.container')
    .evaluate((element) => (element as HTMLElement).style.transform);
  const [, x, y, scale] =
    /translate\((-?[\d.]+)px, (-?[\d.]+)px\) scale\(([\d.]+)\)/.exec(
      transform
    ) ?? [];

  return { x: Number(x), y: Number(y), scale: Number(scale) };
};
