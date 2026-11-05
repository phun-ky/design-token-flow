import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DTCGDocument } from '../../types/tokens';
import { colorToCss, flattenTokens, fontFamilyToCss, toCssValue } from '../design-tokens';

const blue = { colorSpace: 'srgb', components: [0, 0.3294, 0.9412], hex: '#0054f0' };

describe('flattenTokens', () => {
  it('inherits $type from the closest group and builds ids and names', () => {
    const [token] = flattenTokens({ color: { $type: 'color', base: { blue: { $value: blue } } } } as DTCGDocument);

    assert.equal(token.id, 'color-base-blue');
    assert.equal(token.name, 'color.base.blue');
    assert.equal(token.$type, 'color');
    assert.deepEqual(token.value, blue);
    assert.equal(token.aliasOf, undefined);
  });

  it('resolves chained aliases, their type and relations', () => {
    const tokens = flattenTokens({
      base: { blue: { $type: 'color', $value: blue } },
      accent: { $value: '{base.blue}' },
      cta: { $value: '{accent}' }
    } as DTCGDocument);
    const [base, accent, cta] = tokens;

    assert.equal(cta.$type, 'color');
    assert.deepEqual(cta.value, blue);
    assert.equal(cta.aliasOf, 'accent');
    assert.deepEqual(cta.ancestors, ['accent']);
    assert.deepEqual(accent.descendants, ['cta']);
    assert.deepEqual(base.descendants, ['accent']);
  });

  it('resolves JSON Pointer references and aliases inside composite values', () => {
    const [, , shadow] = flattenTokens({
      color: { $type: 'color', black: { $value: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.5 } } },
      space: { $type: 'dimension', md: { $value: { value: 4, unit: 'px' } } },
      shadow: {
        $type: 'shadow',
        md: {
          $value: {
            color: '{color.black}',
            offsetX: { $ref: '#/space/md/$value' },
            offsetY: { value: 2, unit: 'px' },
            blur: { value: 8, unit: 'px' },
            spread: { value: 0, unit: 'px' }
          }
        }
      }
    } as unknown as DTCGDocument);

    assert.deepEqual(shadow.ancestors.sort(), ['color-black', 'space-md']);
    assert.equal(toCssValue(shadow), '4px 2px 8px 0px rgb(0 0 0 / 0.5)');
  });

  it('supports $root tokens, $extends and $deprecated inheritance', () => {
    const tokens = flattenTokens({
      button: {
        $type: 'dimension',
        $deprecated: 'Use control',
        padding: { $value: { value: 8, unit: 'px' } },
        radius: { $value: { value: 4, unit: 'px' } }
      },
      control: {
        $extends: '{button}',
        $deprecated: false,
        accent: { $root: { $type: 'color', $value: blue } },
        radius: { $value: { value: 6, unit: 'px' } }
      }
    } as unknown as DTCGDocument);
    const byName = Object.fromEntries(tokens.map((token) => [token.name, token]));

    assert.equal(byName['button.padding'].$deprecated, 'Use control');
    assert.equal(byName['control.padding'].$deprecated, undefined);
    assert.equal(toCssValue(byName['control.radius']), '6px');
    assert.equal(byName['control.accent.$root'].id, 'control-accent');
  });

  it('rejects circular references, untyped tokens and invalid names', () => {
    assert.throws(
      () => flattenTokens({ a: { $type: 'number', $value: '{b}' }, b: { $value: '{a}' } } as DTCGDocument),
      /Circular reference/
    );
    assert.throws(() => flattenTokens({ a: { $value: 1 } } as DTCGDocument), /no \$type/);
    assert.throws(() => flattenTokens({ 'a.b': { $type: 'number', $value: 1 } } as DTCGDocument), /Invalid name/);
    assert.throws(() => flattenTokens({ a: { $type: 'number', $value: '{nope}' } } as DTCGDocument), /Unresolvable/);
  });
});

describe('CSS conversion', () => {
  it('converts colors in different color spaces', () => {
    assert.equal(colorToCss({ colorSpace: 'srgb', components: [0, 0.3294, 0.9412], hex: '#0054F0' }), '#0054f0');
    assert.equal(colorToCss({ colorSpace: 'srgb', components: [1, 0, 0] }), '#ff0000');
    assert.equal(colorToCss({ colorSpace: 'hsl', components: ['none', 50, 40], alpha: 0.8 }), 'hsl(none 50% 40% / 0.8)');
    assert.equal(colorToCss({ colorSpace: 'oklch', components: [0.6, 0.2, 260] }), 'oklch(0.6 0.2 260)');
    assert.equal(colorToCss({ colorSpace: 'display-p3', components: [1, 0, 0] }), 'color(display-p3 1 0 0)');
  });

  it('converts font families and other types', () => {
    assert.equal(fontFamilyToCss(['If Sans', 'Arial', 'sans-serif']), '"If Sans", "Arial", sans-serif');
    assert.equal(toCssValue({ $type: 'fontWeight', value: 'semi-bold' }), '600');
    assert.equal(toCssValue({ $type: 'cubicBezier', value: [0.5, 0, 1, 1] }), 'cubic-bezier(0.5, 0, 1, 1)');
    assert.equal(toCssValue({ $type: 'duration', value: { value: 200, unit: 'ms' } }), '200ms');
    assert.equal(
      toCssValue({
        $type: 'gradient',
        value: [
          { color: { colorSpace: 'srgb', components: [0, 0, 1] }, position: 0 },
          { color: { colorSpace: 'srgb', components: [1, 0, 0] }, position: 1.5 }
        ]
      }),
      'linear-gradient(90deg, #0000ff 0%, #ff0000 100%)'
    );
    assert.equal(
      toCssValue({
        $type: 'typography',
        value: {
          fontFamily: 'Roboto',
          fontSize: { value: 42, unit: 'px' },
          fontWeight: 700,
          letterSpacing: { value: 0.1, unit: 'px' },
          lineHeight: 1.2
        }
      }),
      '700 42px/1.2 "Roboto"'
    );
  });
});
