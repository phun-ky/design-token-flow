import { expect, test } from '@playwright/test';

import { PAGES, THEMES, useTheme } from './site';

// Every page in both themes: requests only to the site's own origin, nothing
// failing, no console errors and no Content Security Policy violations
for (const { name, path, ...rest } of PAGES) {
  const status = 'status' in rest ? rest.status : 200;

  for (const theme of THEMES) {
    test(`${name}, ${theme}: only the site's own origin, nothing fails`, async ({
      page,
      baseURL
    }) => {
      const url = new URL(path, baseURL).href;
      const origin = new URL(url).origin;
      const foreign: string[] = [];
      const failed: string[] = [];
      const errors: string[] = [];

      page.on('request', (request) => {
        const target = request.url();

        if (!target.startsWith(origin) && !target.startsWith('data:'))
          foreign.push(target);
      });
      page.on('response', (response) => {
        // The 404 page's own document is meant to be a 404
        if (response.status() >= 400 && response.url() !== url)
          failed.push(`${response.status()} ${response.url()}`);
      });
      page.on('requestfailed', (request) =>
        failed.push(`${request.failure()?.errorText} ${request.url()}`)
      );
      page.on('console', (message) => {
        if (message.type() === 'error' && message.location().url !== url)
          errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));
      await useTheme(page, theme);
      await page.addInitScript(() =>
        document.addEventListener('securitypolicyviolation', (event) =>
          console.error(
            `Content Security Policy: ${event.effectiveDirective} blocked ${event.blockedURI}`
          )
        )
      );

      const response = await page.goto(url);

      await page.waitForLoadState('networkidle');

      expect(response?.status()).toBe(status);
      expect(foreign, 'requests to other origins').toEqual([]);
      expect(failed, 'failed requests').toEqual([]);
      expect(errors, 'console errors').toEqual([]);
    });
  }
}
