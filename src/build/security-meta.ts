import { createHash } from 'node:crypto';

/**
 * Security `<meta>` tags for the built pages. GitHub Pages can't send response
 * headers, so the Content Security Policy and the referrer policy go in each
 * page's `<head>`. Only for the build: in dev, Vite injects styles that this
 * policy would block.
 */

// A <script> element without a src attribute, and its source
const INLINE_SCRIPT = /<script\b(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi;
const CHARSET_META = /<meta\s+charset=[^>]*>/i;
// CSP keywords are written in single quotes, such as 'self'
const keyword = (name: string): string => `'${name}'`;

/**
 * The CSP source for an inline script: its SHA-256 hash, so the policy allows
 * exactly that script and nothing injected later.
 *
 * @param {string} source The script's text, exactly as it is in the page
 * @returns {string} The hash source, such as `'sha256-...'`
 */
export const scriptHash = (source: string): string =>
  `'sha256-${createHash('sha256').update(source, 'utf8').digest('base64')}'`;

/**
 * @param {string} html A page
 * @returns {string[]} The source of each inline script, in page order
 */
export const getInlineScripts = (html: string): string[] =>
  [...html.matchAll(INLINE_SCRIPT)].map(([, source]) => source);

/**
 * The page's Content Security Policy. Everything comes from the site itself:
 * scripts (plus the hashed inline ones) and styles. `style` attributes are
 * allowed, since the pills set their swatch colours with them; nothing else
 * may load, so a token value can't fetch from another host.
 *
 * @param {string[]} scriptHashes Hash sources of the inline scripts
 * @returns {string} The policy
 */
export const contentSecurityPolicy = (scriptHashes: string[]): string =>
  [
    `default-src ${keyword('none')}`,
    [`script-src ${keyword('self')}`, ...scriptHashes].join(' '),
    `style-src ${keyword('self')}`,
    `style-src-attr ${keyword('unsafe-inline')}`,
    `img-src ${keyword('self')}`,
    `base-uri ${keyword('none')}`,
    `form-action ${keyword('none')}`
  ].join('; ');

/**
 * Adds the Content Security Policy and the referrer policy right after
 * `<meta charset>`, before any script or style, so they cover the whole page.
 *
 * @param {string} html A built page
 * @returns {string} The page with the security `<meta>` tags
 * @throws {Error} When the page has no `<meta charset>` to anchor them to
 */
export const addSecurityMeta = (html: string): string => {
  const charset = CHARSET_META.exec(html);

  if (!charset) {
    throw new Error(
      'addSecurityMeta: the page has no <meta charset>, so the Content Security Policy has nowhere to go'
    );
  }

  const hashes = [...new Set(getInlineScripts(html).map(scriptHash))];
  const meta = [
    `<meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy(hashes)}" />`,
    '<meta name="referrer" content="no-referrer" />'
  ];
  const end = charset.index + charset[0].length;

  return `${html.slice(0, end)}\n    ${meta.join('\n    ')}${html.slice(end)}`;
};
