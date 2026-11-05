import 'global-jsdom/register';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DTCGDocument } from '../../types/tokens';
import { DTF_EXTENSION_KEY, flattenTokens } from '../design-tokens';
import {
  createDesignTokenElement,
  getDesignTokenKind,
  renderDesignToken
} from '../render-design-token';

const srgb = (r: number, g: number, b: number) => ({
  colorSpace: 'srgb',
  components: [r / 255, g / 255, b / 255]
});
const tokens = flattenTokens({
  color: {
    $type: 'color',
    base: {
      blue: { '100': { $value: { ...srgb(0, 84, 240), hex: '#0054f0' } } },
      beige: { '100': { $value: srgb(250, 249, 247) } },
      brown: { '100': { $value: srgb(110, 98, 94) } }
    },
    accent: {
      blue: { $value: '{color.base.blue.100}', $description: 'Accent' }
    },
    cta: { $value: '{color.accent.blue}' },
    text: {
      'lightest-beige': { $value: '{color.base.beige.100}' },
      'light-brown': { $value: '{color.base.brown.100}' }
    }
  },
  size: {
    $type: 'dimension',
    font: { '14': { $value: { value: 0.875, unit: 'rem' } } },
    spacing: { '4': { $value: { value: 4, unit: 'px' } } }
  },
  border: {
    $type: 'dimension',
    radius: { medium: { $value: { value: 6, unit: 'px' } } },
    width: { large: { $value: { value: 8, unit: 'px' } } },
    focus: {
      $type: 'border',
      $value: {
        color: '{color.cta}',
        width: '{border.width.large}',
        style: 'dashed'
      }
    }
  },
  font: {
    family: {
      sans: { $type: 'fontFamily', $value: ['If Sans', 'Arial', 'sans-serif'] }
    },
    weight: {
      $type: 'fontWeight',
      'semi-bold': { $value: 'semi-bold' },
      '36': {
        $value: 36,
        $extensions: {
          [DTF_EXTENSION_KEY]: { variable: true, 'font-family': ['If Sans'] }
        }
      }
    }
  },
  shadow: {
    medium: {
      $type: 'shadow',
      $value: {
        color: { colorSpace: 'srgb', components: [0.2, 0.2, 0.2], alpha: 0.2 },
        offsetX: { value: 0, unit: 'px' },
        offsetY: { value: 0, unit: 'px' },
        blur: { value: 10, unit: 'px' },
        spread: { value: 0, unit: 'px' }
      }
    }
  },
  motion: {
    fast: {
      $type: 'duration',
      $value: { value: 150, unit: 'ms' },
      $deprecated: true
    }
  },
  forced: {
    $type: 'dimension',
    gap: {
      $value: { value: 1, unit: 'rem' },
      $extensions: { [DTF_EXTENSION_KEY]: { kind: 'generic' } }
    }
  }
} as unknown as DTCGDocument);
const byId = Object.fromEntries(tokens.map((token) => [token.id, token]));
const el = (id: string) => createDesignTokenElement(byId[id]);

describe('getDesignTokenKind', () => {
  it('derives the pill variant from $type and path', () => {
    const expected = {
      'color-base-blue-100': 'color-base',
      'color-accent-blue': 'color',
      'color-text-light-brown': 'text-color',
      'size-font-14': 'font-size',
      'size-spacing-4': 'size',
      'border-radius-medium': 'border-radius',
      'border-width-large': 'border-width',
      'border-focus': 'border-width',
      'font-family-sans': 'font',
      'font-weight-36': 'font-weight',
      'shadow-medium': 'shadow',
      'motion-fast': 'generic',
      'forced-gap': 'generic'
    };

    Object.entries(expected).forEach(([id, kind]) =>
      assert.equal(getDesignTokenKind(byId[id]), kind, id)
    );
  });
});

describe('renderDesignToken', () => {
  it('renders a literal color as a base pill with drop and hex code', () => {
    const pill = el('color-base-blue-100');

    assert.equal(pill.className, 'design-token color base');
    assert.equal(pill.dataset.hex, '#0054f0');
    assert.equal(pill.dataset.descendants, 'color-accent-blue');
    assert.equal(
      (pill.querySelector('.drop') as HTMLElement).style.backgroundColor,
      'rgb(0, 84, 240)'
    );
    assert.equal(pill.textContent, '$color-base-blue-100#0054f0');
  });

  it('renders an alias color with relations, alias and description', () => {
    const pill = el('color-accent-blue');

    assert.equal(pill.className, 'design-token color');
    assert.equal(pill.dataset.alias, 'color.base.blue.100');
    assert.equal(pill.dataset.ancestors, 'color-base-blue-100');
    assert.equal(pill.dataset.descendants, 'color-cta');
    assert.equal(pill.title, 'Accent');
    assert.equal(pill.querySelector('code'), null);
  });

  it('renders light and dark text colors', () => {
    const light = el('color-text-lightest-beige');
    const dark = el('color-text-light-brown');

    assert.equal(light.className, 'design-token text-color light');
    assert.equal(light.style.color, 'rgb(250, 249, 247)');
    assert.equal(light.querySelector('.text')?.textContent, 'Aa');
    assert.equal(dark.className, 'design-token text-color dark');
    assert.equal(dark.style.color, '');
  });

  it('renders font family, font size and size tokens', () => {
    assert.equal(
      el('font-family-sans').querySelector('code')?.textContent,
      '"If Sans", "Arial", sans-serif'
    );
    assert.equal(el('size-font-14').className, 'design-token font-size');
    assert.equal(el('size-font-14').dataset.value, '0.875rem');
    assert.equal(el('size-spacing-4').className, 'design-token size');
  });

  it('renders keyword and variable font weights', () => {
    const keyword = el('font-weight-semi-bold').querySelector(
      '.text'
    ) as HTMLElement;
    const variable = el('font-weight-36').querySelector('.text') as HTMLElement;

    assert.equal(keyword.style.fontWeight, '600');
    assert.equal(variable.style.fontWeight, 'normal');
    assert.equal(
      variable
        .getAttribute('style')
        ?.includes('font-variation-settings: "wght" 36'),
      true
    );
  });

  it('renders shadow, border radius, border width and border tokens', () => {
    assert.equal(
      el('shadow-medium').querySelector('code')?.textContent,
      '0px 0px 10px 0px rgb(51 51 51 / 0.2)'
    );
    assert.equal(
      (el('border-radius-medium').querySelector('.radius') as HTMLElement).style
        .borderBottomRightRadius,
      '6px'
    );
    assert.equal(
      (el('border-width-large').querySelector('.width') as HTMLElement).style
        .height,
      '8px'
    );

    const border = el('border-focus');

    assert.equal(
      (border.querySelector('.width') as HTMLElement).style.height,
      '8px'
    );
    assert.equal(border.dataset.value, '8px dashed #0054f0');
    assert.equal(border.querySelector('code'), null);
    assert.equal(border.dataset.ancestors, 'color-cta,border-width-large');
  });

  it('renders other types as a generic pill with the CSS value', () => {
    const pill = el('motion-fast');

    assert.equal(pill.className, 'design-token');
    assert.equal(pill.querySelector('code')?.textContent, '150ms');
    assert.equal(pill.dataset.deprecated, 'true');
  });

  it('supports a custom prefix', () => {
    assert.equal(
      createDesignTokenElement(byId['size-spacing-4'], { prefix: '--' })
        .textContent,
      '--size-spacing-4'
    );
  });

  it('escapes values', () => {
    const html = renderDesignToken({
      id: 'x"><script>',
      $type: 'fontFamily',
      value: '<b>"evil"</b>',
      $description: '"><img src=x>'
    });
    const template = document.createElement('template');

    template.innerHTML = html;
    assert.equal(html.includes('<script>'), false);
    assert.equal(html.includes('<b>'), false);
    assert.equal(html.includes('<img'), false);
    assert.equal(template.content.querySelectorAll('*').length, 2);
  });
});
