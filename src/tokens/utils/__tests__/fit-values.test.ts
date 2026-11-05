import 'global-jsdom/register';

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { fitWrappedValues, widestLine } from '../fit-values';
import { renderDesignToken } from '../render-design-token';

const rect = (left: number, right: number, top: number, bottom = top + 12) => ({
  left,
  right,
  top,
  bottom
});

describe('widestLine', () => {
  it('measures each line from its leftmost to its rightmost fragment', () => {
    assert.equal(
      widestLine([
        rect(10, 120, 0),
        rect(120, 300, 0),
        rect(10, 200, 14),
        rect(10, 90, 28)
      ]),
      290
    );
  });

  it('keeps fragments within 2 px of each other on one line', () => {
    assert.equal(widestLine([rect(0, 50, 0), rect(50, 140, 1.5, 13.5)]), 140);
    assert.equal(widestLine([rect(0, 50, 0), rect(50, 140, 6)]), 90);
  });

  it('skips empty fragments, and is 0 without content', () => {
    assert.equal(widestLine([rect(40, 40, 0), rect(0, 30, 14)]), 30);
    assert.equal(widestLine([]), 0);
  });
});

describe('fitWrappedValues', () => {
  // jsdom has no layout, so this covers what happens without measurements;
  // the narrowing itself is checked in a browser
  it('leaves values alone, and clears an earlier width', () => {
    // jsdom's Range has no getClientRects; no rects stand for "not laid out"
    Range.prototype.getClientRects = () => [] as unknown as DOMRectList;

    const root = document.createElement('div');

    root.innerHTML =
      renderDesignToken({
        id: 'mono',
        $type: 'fontFamily',
        value: ['Menlo', 'Monaco', 'monospace']
      }) + renderDesignToken({ id: 'size', $type: 'number', value: 1 });

    const [list, single] = [...root.querySelectorAll('code')];

    list.style.inlineSize = '100px';
    fitWrappedValues(root);

    assert.equal(list.querySelectorAll('.part').length, 3);
    assert.equal(list.style.inlineSize, '');
    assert.equal(single.style.inlineSize, '');
  });
});
