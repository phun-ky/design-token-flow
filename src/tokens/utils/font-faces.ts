import type { FlatDesignToken } from '../types/tokens';

import { getExtension } from './design-tokens';

/**
 * A font face described by a `fontFamily` token: what `new FontFace(family,
 * source, descriptors)` takes, or what an `@font-face` rule says.
 */
export interface DesignTokenFontFace {
  /** The token's id */
  id: string;
  /** The family name, the token's value */
  family: string;
  /** The `src` list, such as `url("./fonts/a.woff2") format("woff2")` */
  source: string;
  /** `@font-face` descriptors from the token, `display` defaulting to `swap` */
  descriptors: {
    display: string;
    style?: string;
    weight?: string;
    stretch?: string;
    unicodeRange?: string;
  };
}

/** Font file formats, in the order browsers should try them, with their CSS names */
const FORMATS: [extension: string, format: string][] = [
  ['woff2', 'woff2'],
  ['woff', 'woff'],
  ['ttf', 'truetype'],
  ['otf', 'opentype'],
  ['eot', 'embedded-opentype']
];
const DESCRIPTORS = ['display', 'style', 'weight', 'stretch', 'unicodeRange'];

// The descriptors, also indexable by the names in DESCRIPTORS
type Descriptors = DesignTokenFontFace['descriptors'] & Record<string, string>;

/**
 * Reads the font faces that `fontFamily` tokens describe. A token describes a
 * face when its extension (`$extensions["net.phun-ky.design-token-flow"]`)
 * lists `files` by format, and optionally `font-face` descriptors:
 *
 * ```json
 * "name": {
 *   "$type": "fontFamily",
 *   "$value": "IBM Plex Sans Var",
 *   "$extensions": {
 *     "net.phun-ky.design-token-flow": {
 *       "files": { "woff2": "./fonts/IBM Plex Sans Var-Roman.woff2" },
 *       "font-face": { "weight": "100 700" }
 *     }
 *   }
 * }
 * ```
 *
 * File paths are used as they are, encoded for `url()`, so relative paths
 * resolve against the page. Unknown formats and descriptors are skipped.
 *
 * @param {FlatDesignToken[]} tokens Tokens from `flattenTokens`
 * @returns {DesignTokenFontFace[]} One face per token that lists files
 */
export const getFontFaces = (
  tokens: FlatDesignToken[]
): DesignTokenFontFace[] =>
  tokens.flatMap((token) => {
    if (token.$type !== 'fontFamily') return [];

    const extension = getExtension(token);
    const files = (extension.files ?? {}) as Record<string, unknown>;
    const source = FORMATS.flatMap(([extensionName, format]) => {
      const path = files[extensionName];

      return typeof path === 'string'
        ? [`url("${encodeURI(path)}") format("${format}")`]
        : [];
    }).join(', ');

    if (!source) return [];

    const value = token.value as string | string[];
    const family = Array.isArray(value) ? value[0] : value;
    const face = (extension['font-face'] ?? {}) as Record<string, unknown>;
    const descriptors: Descriptors = { display: 'swap' };

    DESCRIPTORS.forEach((name) => {
      if (typeof face[name] === 'string') descriptors[name] = face[name];
    });

    return [{ id: token.id, family, source, descriptors }];
  });
