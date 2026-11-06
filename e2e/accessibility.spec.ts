import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { PAGES, THEMES, useTheme } from './site';

// WCAG 2.0, 2.1 and 2.2 at A and AA, plus axe's best practices, as checked by
// hand in #73
const TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22a',
  'wcag22aa',
  'best-practice'
];
/** Each page, and the states of it that show more than it opens with */
const STATES: {
  name: string;
  path: string;
  prepare?: (page: Page) => Promise<void>;
}[] = [
  ...PAGES.map(({ name, path }) => ({ name, path })),
  {
    name: 'playground with a pill selected',
    path: 'playground',
    prepare: async (page) => {
      await page.locator('[data-demo-id="shadow-raised"]').click();
      await expect(page.locator('#details pre.shiki').first()).toBeVisible();
    }
  }
];

for (const { name, path, prepare } of STATES) {
  for (const theme of THEMES) {
    test(`${name}, ${theme}: no axe violations`, async ({ page }, info) => {
      await useTheme(page, theme);
      // No transitions, so colours are checked as they end up, not halfway
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => document.fonts.ready);
      await prepare?.(page);

      const { violations, incomplete } = await new AxeBuilder({ page })
        .withTags(TAGS)
        .analyze();

      // axe can't decide some checks, such as contrast over the dotted
      // background; they are listed with the result for a person to look at
      if (incomplete.length > 0) {
        await info.attach('axe incomplete', {
          body: JSON.stringify(
            incomplete.map(({ id, nodes }) => ({
              id,
              targets: nodes.map(({ target }) => target.join(' '))
            })),
            null,
            2
          ),
          contentType: 'application/json'
        });
      }

      expect(
        violations.map(
          ({ id, help, nodes }) =>
            `${id}: ${help} (${nodes.map(({ target }) => target.join(' ')).join(', ')})`
        ),
        'axe violations'
      ).toEqual([]);
    });
  }
}
