import { expect, test, type Page } from '@playwright/test';

import { getInlineScripts, scriptHash } from '../src/build/security-meta';

import { PAGES } from './site';

// The policies SECURITY.md documents, written out here so a directive dropped
// from the build plugin or the 404 page fails the check. CSP keywords are in
// single quotes, such as 'self'
const keyword = (name: string) => `'${name}'`;
const POLICY = (hashes: string[]) =>
  [
    `default-src ${keyword('none')}`,
    [`script-src ${keyword('self')}`, ...hashes].join(' '),
    `style-src ${keyword('self')}`,
    `style-src-attr ${keyword('unsafe-inline')}`,
    `img-src ${keyword('self')}`,
    `font-src ${keyword('self')}`,
    `base-uri ${keyword('none')}`,
    `form-action ${keyword('none')}`
  ].join('; ');
const POLICY_404 = [
  `default-src ${keyword('none')}`,
  `style-src ${keyword('self')}`,
  `img-src ${keyword('self')}`,
  `base-uri ${keyword('none')}`,
  `form-action ${keyword('none')}`
].join('; ');
// Every payload carries this, so a request or URL that leaks one is found
const MARKER = 'xss-marker';
// Markup that, if it were parsed instead of shown as text, would add an
// element with data-xss and try to run a script
const MARKUP = `<img src=x data-xss="${MARKER}" onerror=alert(1)>`;
const SCRIPT = `<script data-xss="${MARKER}">alert(1)</script>`;
const ATTRIBUTE = `x" data-xss="${MARKER}" onmouseover="alert(1)`;
// Font names are written as quoted CSS strings: this one ends its string and
// the declaration, then sets a custom property of its own
const CSS = `x"; --${MARKER}: injected; font-family: "y`;
const TOKENS = {
  [MARKUP]: {
    [ATTRIBUTE]: {
      $type: 'color',
      $value: { colorSpace: 'srgb', components: [1, 0, 0] },
      $description: SCRIPT,
      $extensions: { [MARKUP]: SCRIPT }
    },
    font: {
      $type: 'fontFamily',
      $value: [CSS, `</style>${MARKUP}`, 'sans-serif'],
      $description: MARKUP
    }
  }
};
/**
 * Collects what would show that a payload got through: dialogs, Content
 * Security Policy violations (an injected inline script or handler causes
 * one), and requests whose URL carries a payload.
 */
const watch = async (page: Page) => {
  const found: string[] = [];

  page.on('dialog', async (dialog) => {
    found.push(`dialog: ${dialog.message()}`);
    await dialog.dismiss();
  });
  page.on('request', (request) => {
    if (request.url().includes(MARKER)) found.push(`request: ${request.url()}`);
  });
  page.on('console', (message) => {
    if (message.text().startsWith('Content Security Policy'))
      found.push(message.text());
  });
  await page.addInitScript(() =>
    document.addEventListener('securitypolicyviolation', (event) =>
      console.error(
        `Content Security Policy: ${event.effectiveDirective} blocked ${event.blockedURI}`
      )
    )
  );

  return found;
};
/** Elements and CSS declarations a payload added */
const injected = (page: Page) =>
  page.evaluate(
    (marker) => ({
      elements: document.querySelectorAll('[data-xss]').length,
      declarations: [...document.querySelectorAll('*')].filter(
        (element) =>
          getComputedStyle(element).getPropertyValue(`--${marker}`) !== ''
      ).length
    }),
    MARKER
  );

test.describe('the playground shows token data as text', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('playground');
    await page.evaluate(() => localStorage.removeItem('dtf-demo'));
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('in names, values, descriptions, extensions and the prefix', async ({
    page
  }) => {
    const found = await watch(page);
    const url = page.url();

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.locator('#prefix').fill(MARKUP);
    await page.locator('#source').fill(JSON.stringify(TOKENS, null, 2));

    const pills = page.locator('#groups .design-token');

    await expect(pills).toHaveCount(2);
    await expect(page.locator('#error')).toBeHidden();
    await expect(pills.first()).toContainText(MARKUP);

    // Each pill's details: name, description, values and the rendered HTML
    for (const index of [0, 1]) {
      await pills.nth(index).click();
      await expect(page.locator('#details pre.shiki').first()).toBeVisible();
      await expect(page.locator('#details h2')).toContainText(MARKUP);
    }

    await expect(page.locator('#details')).toContainText(MARKUP);
    expect(await injected(page)).toEqual({ elements: 0, declarations: 0 });
    await pills.first().hover();
    expect(found, 'scripts, violations or leaked payloads').toEqual([]);
    // Nothing typed ends up in the address
    expect(page.url()).toBe(url);
  });

  test('refuses a value that would add CSS', async ({ page }) => {
    const found = await watch(page);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.locator('#source').fill(
      JSON.stringify({
        size: {
          $type: 'dimension',
          $value: {
            value: 1,
            unit: `px; background: url(https://example.com/${MARKER})`
          }
        }
      })
    );

    await expect(page.locator('#error')).toContainText('Invalid token "size"');
    await expect(page.locator('#groups .design-token')).toHaveCount(0);
    expect(found, 'scripts, violations or leaked payloads').toEqual([]);
  });
});

// Each built page carries the documented policy, with the hashes of its own
// inline scripts, before anything it governs, and the browser enforces it
for (const { name, path, ...rest } of PAGES) {
  const status = 'status' in rest ? rest.status : 200;

  test(`${name}: carries its Content Security Policy, and the browser enforces it`, async ({
    page
  }) => {
    const response = await page.goto(path);

    expect(response?.status()).toBe(status);

    const html = (await response?.text()) ?? '';
    const policy = await page
      .locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute('content');
    const scripts = getInlineScripts(html);

    expect(
      await page.locator('meta[name="referrer"]').getAttribute('content')
    ).toBe('no-referrer');

    if (name === '404') {
      // Written by hand, and the page has no scripts: none may run
      expect(scripts).toEqual([]);
      expect(policy).toBe(POLICY_404);
    } else {
      // The theme script, allowed by its hash
      expect(scripts).toHaveLength(1);
      expect(policy).toBe(POLICY(scripts.map(scriptHash)));
    }

    // Before every script, stylesheet and style in the page, as the browser
    // parsed it
    const before = await page.evaluate(() => {
      const meta = document.querySelector(
        'meta[http-equiv="Content-Security-Policy"]'
      );

      return (
        meta !== null &&
        [
          ...document.querySelectorAll('script, link[rel~="stylesheet"], style')
        ].every(
          (element) =>
            meta.compareDocumentPosition(element) &
            Node.DOCUMENT_POSITION_FOLLOWING
        )
      );
    });

    expect(before, 'the policy comes before every script and style').toBe(true);

    // An inline script added later is blocked and reported
    const result = await page.evaluate(
      () =>
        new Promise<{ ran: boolean; blocked: string }>((resolve) => {
          document.addEventListener(
            'securitypolicyviolation',
            (event) =>
              resolve({
                ran: 'injected' in window,
                blocked: event.effectiveDirective
              }),
            { once: true }
          );

          const script = document.createElement('script');

          script.textContent = 'window.injected = true';
          document.head.append(script);
        })
    );

    expect(result).toEqual({ ran: false, blocked: 'script-src-elem' });
  });
}
