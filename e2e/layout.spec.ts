import { expect, test } from '@playwright/test';

import { PAGES, THEMES, useTheme } from './site';

const WIDTHS = [390, 768, 1440];

// No horizontal scroll on any page, at phone, tablet and desktop widths, in
// both themes
for (const { name, path } of PAGES) {
  for (const theme of THEMES) {
    for (const width of WIDTHS) {
      test(`${name}, ${theme}, ${width} px: no horizontal scroll`, async ({
        page
      }) => {
        await page.setViewportSize({ width, height: 800 });
        await useTheme(page, theme);
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        await page.evaluate(() => document.fonts.ready);

        const { scrollWidth, viewport, wide } = await page.evaluate(() => {
          const root = document.documentElement;

          return {
            scrollWidth: Math.max(root.scrollWidth, document.body.scrollWidth),
            viewport: root.clientWidth,
            // For the message: elements reaching past the right edge
            wide: [...document.body.querySelectorAll('*')]
              .filter(
                (element) =>
                  element.getBoundingClientRect().right >
                    root.clientWidth + 1 &&
                  !element.closest('.app-viewport, .demo-source-code, pre')
              )
              .slice(0, 5)
              .map(
                (element) =>
                  `${element.tagName.toLowerCase()}.${String(element.className).split(' ')[0]}`
              )
          };
        });

        expect(scrollWidth, `too wide: ${wide.join(', ')}`).toBeLessThanOrEqual(
          viewport
        );
      });
    }
  }
}
