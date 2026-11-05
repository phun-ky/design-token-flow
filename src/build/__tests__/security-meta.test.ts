import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { describe, it } from 'node:test';

import {
  addSecurityMeta,
  contentSecurityPolicy,
  getInlineScripts,
  scriptHash
} from '../security-meta';

const THEME_SCRIPT = `
      try {
        if (localStorage.getItem('dtf-theme') === 'light')
          document.documentElement.classList.add('theme--light');
      } catch {}
    `;
const PAGE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Page</title>
    <script>${THEME_SCRIPT}</script>
    <script type="module" crossorigin src="./assets/index.js"></script>
    <link rel="stylesheet" crossorigin href="./assets/index.css">
  </head>
  <body></body>
</html>`;

const getPolicy = (html: string): string => {
  const match = /http-equiv="Content-Security-Policy" content="([^"]*)"/.exec(
    html
  );

  assert.ok(match, 'no Content Security Policy in the page');

  return match[1];
};

describe('scriptHash', () => {
  it('is the base64 SHA-256 of the exact source, as a CSP hash source', () => {
    const expected = createHash('sha256')
      .update(THEME_SCRIPT, 'utf8')
      .digest('base64');

    assert.equal(scriptHash(THEME_SCRIPT), `'sha256-${expected}'`);
  });

  it('changes with any change to the source, whitespace included', () => {
    assert.notEqual(scriptHash('a()'), scriptHash('a() '));
  });

  it('hashes the source as UTF-8', () => {
    const expected = createHash('sha256')
      .update(Buffer.from('ø', 'utf8'))
      .digest('base64');

    assert.equal(scriptHash('ø'), `'sha256-${expected}'`);
  });
});

describe('getInlineScripts', () => {
  it('finds inline scripts and skips scripts with a src', () => {
    assert.deepEqual(getInlineScripts(PAGE), [THEME_SCRIPT]);
  });

  it('finds inline scripts with attributes, in page order', () => {
    const html =
      '<script type="module">first()</script><SCRIPT>second()</SCRIPT><script src="x.js"></script>';

    assert.deepEqual(getInlineScripts(html), ['first()', 'second()']);
  });

  it('finds nothing in a page without inline scripts', () => {
    assert.deepEqual(getInlineScripts('<script src="./a.js"></script>'), []);
  });
});

describe('contentSecurityPolicy', () => {
  it('allows only the site itself, style attributes and the given hashes', () => {
    assert.equal(
      contentSecurityPolicy(["'sha256-abc='"]),
      "default-src 'none'; script-src 'self' 'sha256-abc='; style-src 'self'; style-src-attr 'unsafe-inline'; img-src 'self'; base-uri 'none'; form-action 'none'"
    );
  });

  it('never allows inline scripts or eval', () => {
    const policy = contentSecurityPolicy([]);

    assert.match(policy, /script-src 'self';/);
    assert.doesNotMatch(policy, /script-src[^;]*'unsafe-(inline|eval)'/);
  });
});

describe('addSecurityMeta', () => {
  it('adds the policy, with the inline script hash, right after the charset', () => {
    const html = addSecurityMeta(PAGE);
    const head = html.slice(html.indexOf('<head>'));

    assert.equal(
      getPolicy(html),
      contentSecurityPolicy([scriptHash(THEME_SCRIPT)])
    );
    assert.ok(
      head.indexOf('<meta charset') < head.indexOf('Content-Security-Policy')
    );
    assert.ok(
      head.indexOf('Content-Security-Policy') < head.indexOf('<title>')
    );
    assert.ok(
      head.indexOf('Content-Security-Policy') < head.indexOf('<script')
    );
  });

  it('adds a no-referrer policy', () => {
    assert.match(
      addSecurityMeta(PAGE),
      /<meta name="referrer" content="no-referrer" \/>/
    );
  });

  it('lists each hash once when scripts repeat', () => {
    const html = PAGE.replace(
      '</head>',
      `<script>${THEME_SCRIPT}</script></head>`
    );
    const hash = scriptHash(THEME_SCRIPT);

    assert.equal(getPolicy(addSecurityMeta(html)).split(hash).length, 2);
  });

  it('leaves the rest of the page as it was', () => {
    const html = addSecurityMeta(PAGE);

    assert.equal(
      html
        .replace(/\n {4}<meta http-equiv="Content-Security-Policy"[^>]*>/, '')
        .replace(/\n {4}<meta name="referrer"[^>]*>/, ''),
      PAGE
    );
  });

  it('throws when there is no charset meta to anchor to', () => {
    assert.throws(
      () => addSecurityMeta('<html><head><title>x</title></head></html>'),
      /no <meta charset>/
    );
  });
});
