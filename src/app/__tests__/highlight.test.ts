import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { loadHighlighter } from '../highlight';

describe('loadHighlighter', () => {
  it('highlights JSON and HTML with both themes as CSS variables', async () => {
    const colorize = await loadHighlighter();
    const json = colorize('{ "a": 1 }', 'json');
    const html = colorize('<code class="x">#000</code>', 'html', {
      className: 'demo-html'
    });

    assert.match(
      json,
      /^<pre class="shiki shiki-themes Accessible \(AA\) Light Accessible \(AA\) Dark"/
    );
    assert.match(json, /--shiki-light:#[0-9A-F]{6};--shiki-dark:#[0-9A-F]{6}/i);
    assert.match(html, /^<pre class="demo-html shiki /);
    // The code itself is escaped, never markup
    assert.ok(html.includes('&#x3C;') || html.includes('&lt;'));
    assert.ok(!html.includes('<code class="x">'));
  });

  it('makes the <pre> a Tab stop unless asked not to', async () => {
    const colorize = await loadHighlighter();

    assert.match(colorize('1', 'json'), /<pre [^>]*tabindex="0"/);
    assert.doesNotMatch(
      colorize('1', 'json', { focusable: false }),
      /tabindex/
    );
  });
});
