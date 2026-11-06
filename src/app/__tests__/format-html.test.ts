import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { renderDesignToken } from '../../tokens';
import { formatHtml } from '../format-html';

describe('formatHtml', () => {
  it('puts each child of a pill on its own line, keeping code whole', () => {
    const html = renderDesignToken({
      id: 'mono',
      $type: 'fontFamily',
      value: ['Menlo', 'monospace']
    });
    const lines = formatHtml(html).split('\n');

    assert.match(lines[0], /^<span class="design-token font"/);
    assert.equal(
      lines[1],
      '  <span class="text" style="font-family: &#34;Menlo&#34;, monospace">Aa</span>'
    );
    assert.equal(lines[2], '  $mono');
    assert.equal(
      lines[3],
      '  <code><span class="part">&#34;Menlo&#34;</span>, <span class="part">monospace</span></code>'
    );
    assert.equal(lines[4], '</span>');
    assert.equal(lines.length, 5);
  });

  it('loses nothing but whitespace', () => {
    const html = renderDesignToken({
      id: 'shadow',
      $type: 'shadow',
      value: {
        color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.2 },
        offsetX: { value: 0, unit: 'px' },
        offsetY: { value: 1, unit: 'px' },
        blur: { value: 2, unit: 'px' },
        spread: { value: 0, unit: 'px' }
      }
    });

    assert.equal(
      formatHtml(html)
        .split('\n')
        .map((line) => line.trim())
        .join(''),
      html
    );
  });

  it('handles void elements, self-closing tags, text and a missing close', () => {
    assert.equal(
      formatHtml('<p>a<br>b<img src="x" /></p>text<div><b>c</b>'),
      [
        '<p>',
        '  a',
        '  <br>',
        '  b',
        '  <img src="x" />',
        '</p>',
        'text',
        '<div>',
        '  <b>c</b>'
      ].join('\n')
    );
    assert.equal(formatHtml('</b>x'), 'x');
    assert.equal(formatHtml('<i>a</i>', '\t'), '<i>a</i>');
  });
});
