import { expect, test, type Page } from '@playwright/test';
import { HtmlValidate } from 'html-validate';

import { readFileSync } from 'node:fs';

import { PAGES } from './site';

// The repository's config, the standard preset, which agrees with Prettier
const validator = new HtmlValidate(
  JSON.parse(
    readFileSync(new URL('../.htmlvalidate.json', import.meta.url), 'utf8')
  )
);
/** Each page, and the states of it that add markup to what it opens with */
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
/** The validator's findings for some HTML, one line each */
const problems = async (html: string, label: string) => {
  const report = await validator.validateString(html, `${label}.html`);

  return report.results.flatMap(({ messages }) =>
    messages.map(
      ({ line, column, ruleId, message }) =>
        `${line}:${column} ${ruleId}: ${message}`
    )
  );
};

for (const { name, path, prepare } of STATES) {
  test(`${name}: valid HTML, as served and after its scripts ran`, async ({
    page
  }) => {
    const response = await page.goto(path);

    await page.waitForLoadState('networkidle');
    await prepare?.(page);

    // The file as GitHub Pages serves it, and the page the scripts built
    expect(
      await problems((await response?.text()) ?? '', name),
      'served'
    ).toEqual([]);
    expect(await problems(await page.content(), name), 'rendered').toEqual([]);
  });
}
