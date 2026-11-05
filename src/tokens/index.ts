/**
 * Design token pills: parse DTCG 2025.10 token files and render tokens as HTML.
 *
 * This folder is self-contained and will be extracted into its own npm package.
 * The app imports it only through this file, and nothing in here imports app code.
 * Styles: `./styles/design-token.css`.
 */
export {
  DTF_EXTENSION_KEY,
  colorToCss,
  colorToHex,
  cubicBezierToCss,
  dimensionToCss,
  flattenTokens,
  fontFamilyToCss,
  fontWeightToNumber,
  getExtension,
  parseAlias,
  strokeStyleToCss,
  toCssValue
} from './utils/design-tokens';

export { getFontFaces } from './utils/font-faces';

export type { DesignTokenFontFace } from './utils/font-faces';

export {
  createDesignTokenElement,
  getDesignTokenKind,
  renderDesignToken
} from './utils/render-design-token';

export type {
  DesignTokenKind,
  RenderableDesignToken,
  RenderDesignTokenOptions
} from './utils/render-design-token';

export type * from './types/tokens';
