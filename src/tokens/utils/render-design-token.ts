import { DTCGBorderValue, DTCGColorValue, DTCGDimensionValue, DTCGFontFamilyValue, FlatDesignToken } from '../types/tokens';

import { colorToHex, fontFamilyToCss, getExtension, toCssValue } from './design-tokens';
import { light_or_dark } from './light-or-dark';

/**
 * The visual variants of a design token pill, matching the selectors in the
 * design token stylesheet (`.design-token.color.base`, `.design-token.font-size` etc.).
 */
export type DesignTokenKind =
  | 'color-base'
  | 'color'
  | 'text-color'
  | 'font'
  | 'font-weight'
  | 'font-size'
  | 'size'
  | 'shadow'
  | 'border-radius'
  | 'border-width'
  | 'generic';

const KINDS: DesignTokenKind[] = [
  'color-base',
  'color',
  'text-color',
  'font',
  'font-weight',
  'font-size',
  'size',
  'shadow',
  'border-radius',
  'border-width',
  'generic'
];

/**
 * What the renderer needs: a flattened token (see `flattenTokens`). Only `id`, `$type` and the resolved `value` are required.
 */
export type RenderableDesignToken = Pick<FlatDesignToken, 'id' | '$type' | 'value'> & Partial<FlatDesignToken>;

export interface RenderDesignTokenOptions {
  /** Prefix shown before the token id in the pill. Defaults to `$` */
  prefix?: string;
}

type AttrValue = string | number | boolean | null | undefined;

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&#39;'
};
const escapeHTML = (value: AttrValue): string => String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
const isSet = (value: AttrValue): value is string | number | true =>
  value !== null && value !== undefined && value !== '' && value !== false;
const toAttrs = (attrs: Record<string, AttrValue>): string =>
  Object.entries(attrs)
    .filter(([, value]) => isSet(value))
    .map(([key, value]) => ` ${key}="${escapeHTML(value)}"`)
    .join('');
const toStyle = (styles: Record<string, AttrValue>): string =>
  Object.entries(styles)
    .filter(([, value]) => isSet(value))
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');
const span = (className: string, styles: Record<string, AttrValue> = {}, content = ''): string =>
  `<span${toAttrs({ class: className, style: toStyle(styles) })}>${content}</span>`;
const code = (value: AttrValue): string => `<code>${escapeHTML(value)}</code>`;

/**
 * Resolves which pill variant a token is rendered as, from its `$type` and path.
 *
 * Override it per token with `$extensions["net.phun-ky.design-token-flow"].kind`.
 * Colors with a literal value (not an alias) are shown as large base colors.
 *
 * @param {RenderableDesignToken} token - The design token
 * @returns {DesignTokenKind} The pill variant
 * @example
 * ```ts
 * getDesignTokenKind({ id: 'size-font-14', $type: 'dimension', value: { value: 0.875, unit: 'rem' } });
 * // => 'font-size'
 * ```
 */
export const getDesignTokenKind = (token: RenderableDesignToken): DesignTokenKind => {
  const override = getExtension(token).kind as DesignTokenKind | undefined;

  if (override && KINDS.includes(override)) return override;

  const path = token.path ?? token.id.split('-');
  const has = (...names: string[]) => names.some((name) => path.includes(name));

  switch (token.$type) {
    case 'color':
      if (has('text')) return 'text-color';

      return token.aliasOf || token.ancestors?.length ? 'color' : 'color-base';
    case 'dimension':
      if (has('font', 'font-size', 'fontSize')) return 'font-size';

      if (has('radius', 'border-radius', 'borderRadius')) return 'border-radius';

      if (has('border-width', 'borderWidth') || (has('border') && has('width'))) return 'border-width';

      return 'size';
    case 'fontFamily':
      return 'font';
    case 'fontWeight':
      return 'font-weight';
    case 'shadow':
      return 'shadow';
    case 'border':
      return 'border-width';
    default:
      return 'generic';
  }
};

/**
 * Returns `light` or `dark` for colors that can be expressed in hex, `undefined` otherwise.
 */
const getLightness = (color: DTCGColorValue): 'light' | 'dark' | undefined => {
  const hex = colorToHex(color);

  return hex ? light_or_dark(hex as `#${string}`) : undefined;
};

/**
 * Creates the HTML markup for a design token pill.
 *
 * Takes a flattened DTCG token (see `flattenTokens`) and picks the variant from its `$type`:
 * base colors, colors, text colors, font families, font weights, font sizes, sizes,
 * shadows, border radii and border widths. Other types render as a pill with their CSS value.
 * All values are HTML escaped.
 *
 * @param {RenderableDesignToken} token - The design token to render
 * @param {RenderDesignTokenOptions} [options] - Render options
 * @returns {string} The HTML markup for the token
 * @example
 * ```ts
 * const [token] = flattenTokens({ color: { $type: 'color', blue: { $value: { colorSpace: 'srgb', components: [0, 0.33, 0.94] } } } });
 * renderDesignToken(token);
 * // => '<span class="design-token color base" id="color-blue" ...><span class="drop" style="background-color: #0054f0"></span>$color-blue<code>#0054f0</code></span>'
 * ```
 */
export const renderDesignToken = (token: RenderableDesignToken, options: RenderDesignTokenOptions = {}): string => {
  const { prefix = '$' } = options;
  const kind = getDesignTokenKind(token);
  const label = escapeHTML(`${prefix}${token.id}`);
  const css = toCssValue(token);
  const isColor = token.$type === 'color';
  const color = isColor ? (token.value as DTCGColorValue) : undefined;
  const hex = color ? colorToHex(color) : undefined;
  const classNames = ['design-token'];
  const pillStyles: Record<string, AttrValue> = {};

  let content: string;

  switch (kind) {
    case 'color-base': {
      classNames.push('color', 'base');
      content = span('drop', { 'background-color': css }) + label + code(hex ?? css);
      break;
    }
    case 'color': {
      classNames.push('color');
      content = span('drop', { 'background-color': css }) + label;
      break;
    }
    case 'text-color': {
      const lightness = color ? getLightness(color) : undefined;

      classNames.push('text-color');

      if (lightness) classNames.push(lightness);

      // Light text colors sit on a dark pill, so the label is shown in the color itself
      if (lightness === 'light') pillStyles.color = css;

      content = span('text', { color: css }, 'Aa') + label;
      break;
    }
    case 'font': {
      classNames.push('font');
      content = label + code(css);
      break;
    }
    case 'font-weight': {
      const extension = getExtension(token);
      const family = extension['font-family'] as DTCGFontFamilyValue | undefined;
      const variable = extension.variable === true;

      classNames.push('font-weight');
      content =
        span(
          'text',
          {
            'font-family': family ? fontFamilyToCss(family) : undefined,
            'font-weight': variable ? 'normal' : css,
            'font-variation-settings': variable ? `"wght" ${css}` : undefined
          },
          'Aa'
        ) + label;
      break;
    }
    case 'shadow': {
      classNames.push('shadow');
      content = span('box-shadow', { 'box-shadow': css }) + label + code(css);
      break;
    }
    case 'border-radius': {
      classNames.push('border-radius');
      content = span('radius', { 'border-bottom-right-radius': css }) + label;
      break;
    }
    case 'border-width': {
      const isBorder = token.$type === 'border';
      const width = isBorder
        ? toCssValue({ $type: 'dimension', value: (token.value as DTCGBorderValue).width as DTCGDimensionValue })
        : css;

      // The full value badge is drawn by CSS from `data-value`
      classNames.push('border-width');
      content = span('width', { height: width }) + label;
      break;
    }
    case 'font-size':
    case 'size': {
      // The value badge is drawn by CSS from `data-value`
      classNames.push(kind);
      content = label;
      break;
    }
    default: {
      content = label + code(css);
    }
  }

  const attrs = toAttrs({
    class: classNames.join(' '),
    id: token.id,
    title: token.$description,
    'data-type': token.$type,
    'data-name': token.name,
    'data-value': css,
    'data-hex': hex,
    'data-color': isColor ? css : undefined,
    'data-alias': token.aliasOf,
    'data-ancestors': token.ancestors?.join(','),
    'data-descendants': token.descendants?.join(','),
    'data-deprecated': token.$deprecated,
    style: toStyle(pillStyles)
  });

  return `<span${attrs}>${content}</span>`;
};

/**
 * DOM version of {@link renderDesignToken}: returns the pill as an `HTMLElement`.
 *
 * @param {RenderableDesignToken} token - The design token to render
 * @param {RenderDesignTokenOptions} [options] - Render options
 * @returns {HTMLElement} The design token element
 */
export const createDesignTokenElement = (token: RenderableDesignToken, options?: RenderDesignTokenOptions): HTMLElement => {
  const template = document.createElement('template');

  template.innerHTML = renderDesignToken(token, options);

  return template.content.firstElementChild as HTMLElement;
};
