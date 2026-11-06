import { expect, test } from '@playwright/test';

import { PAGES } from './site';

// Where the site is published; links to it are checked against the build
const PRODUCTION = 'https://phun-ky.net/site-design-token-flow/';

// Every link and referenced file on every page resolves: anchors to an
// element, the site's own URLs (and its production URLs, such as the
// canonical URL and the social card) to a file, other hosts to a 2xx or 3xx
for (const { name, path } of PAGES) {
  test(`${name}: every link and referenced file resolves`, async ({
    page,
    baseURL,
    request
  }) => {
    const base = new URL(baseURL as string);

    await page.goto(path);
    await page.waitForLoadState('networkidle');

    const references = await page.evaluate(() =>
      [
        ...[...document.querySelectorAll('a[href], link[href]')].map(
          (element) => element.getAttribute('href') as string
        ),
        ...[...document.querySelectorAll('img[src], script[src]')].map(
          (element) => element.getAttribute('src') as string
        ),
        ...[
          ...document.querySelectorAll(
            'meta[property="og:image"], meta[property="og:url"], meta[name="twitter:image"]'
          )
        ].map((element) => element.getAttribute('content') as string)
      ].filter(Boolean)
    );
    const broken: string[] = [];

    expect(references.length).toBeGreaterThan(0);

    for (const reference of new Set(references)) {
      if (reference.startsWith('#')) {
        const exists = await page.evaluate(
          (id) => Boolean(document.getElementById(id)),
          reference.slice(1)
        );

        if (!exists) broken.push(`${reference} (no element)`);

        continue;
      }

      const absolute = new URL(reference, page.url()).href;
      const target = absolute.startsWith(PRODUCTION)
        ? new URL(absolute.slice(PRODUCTION.length), base).href
        : absolute;
      const response = await request.get(target, { maxRedirects: 5 });
      const ok =
        new URL(target).origin === base.origin
          ? response.status() === 200
          : response.status() < 400;

      if (!ok) broken.push(`${reference} (${response.status()})`);
    }

    expect(broken, 'broken links').toEqual([]);
  });
}
