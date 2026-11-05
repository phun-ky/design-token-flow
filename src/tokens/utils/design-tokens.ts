import {
  DTCGBorderValue,
  DTCGColorValue,
  DTCGCubicBezierValue,
  DTCGDimensionValue,
  DTCGDocument,
  DTCGDurationValue,
  DTCGFontFamilyValue,
  DTCGFontWeightValue,
  DTCGGradientStop,
  DTCGShadowObject,
  DTCGStrokeStyleValue,
  DTCGToken,
  DTCGTransitionValue,
  DTCGType,
  DTCGTypographyValue,
  FlatDesignToken
} from '../types/tokens';

import {
  FONT_WEIGHT_KEYWORDS,
  TokenReference,
  validateProperties,
  validateTokenValue
} from './validate-token';

/** Vendor key for this tool's data in `$extensions` (reverse domain notation, per spec) */
export const DTF_EXTENSION_KEY = 'net.phun-ky.design-token-flow';

const ALIAS_PATTERN = /^\{([^{}]+)\}$/;
const FORBIDDEN_NAME_PATTERN = /[{}.]/;

type AnyObject = Record<string, unknown>;

const isObject = (value: unknown): value is AnyObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isToken = (value: unknown): value is DTCGToken =>
  isObject(value) && '$value' in value;
const isReference = (value: unknown): value is { $ref: string } =>
  isObject(value) &&
  typeof value.$ref === 'string' &&
  Object.keys(value).length === 1;
const childNames = (group: AnyObject): string[] =>
  Object.keys(group).filter((key) => !key.startsWith('$') || key === '$root');

/**
 * Returns the token name an alias points to, e.g. `{color.base.blue}` => `color.base.blue`.
 */
export const parseAlias = (value: unknown): string | undefined =>
  typeof value === 'string' ? value.match(ALIAS_PATTERN)?.[1] : undefined;

/**
 * Splits a JSON Pointer (RFC 6901) into unescaped segments, e.g. `#/my~1group/token` => `['my/group', 'token']`.
 */
const parsePointer = (pointer: string): string[] => {
  if (!pointer.startsWith('#/'))
    throw Error(`Invalid JSON Pointer "${pointer}", must start with "#/"`);

  return pointer
    .slice(2)
    .split('/')
    .map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'));
};
const getAt = (root: unknown, segments: string[]): unknown =>
  segments.reduce<unknown>(
    (node, segment) => (node as AnyObject | undefined)?.[segment],
    root
  );
/**
 * Applies `$extends` recursively: the referenced group's children are inherited, local children win.
 */
const extendGroup = (
  doc: DTCGDocument,
  group: AnyObject,
  stack: string[]
): AnyObject => {
  const $extends = group.$extends;

  if ($extends === undefined) return group;

  const alias = parseAlias($extends);
  const segments = alias
    ? alias.split('.')
    : isReference($extends)
      ? parsePointer($extends.$ref)
      : undefined;

  if (!segments)
    throw Error(`Invalid $extends value ${JSON.stringify($extends)}`);

  const key = segments.join('.');

  if (stack.includes(key))
    throw Error(`Circular $extends: ${[...stack, key].join(' → ')}`);

  const base = getAt(doc, segments);

  if (!isObject(base) || isToken(base))
    throw Error(`$extends must reference a group, "${key}" is not one`);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { $extends: _ignored, ...local } = group;

  return mergeGroups(extendGroup(doc, base, [...stack, key]), local);
};
const mergeGroups = (base: AnyObject, local: AnyObject): AnyObject => {
  const merged: AnyObject = { ...base };

  Object.entries(local).forEach(([key, value]) => {
    const inherited = merged[key];

    merged[key] =
      isObject(inherited) &&
      isObject(value) &&
      !isToken(inherited) &&
      !isToken(value) &&
      !key.startsWith('$')
        ? mergeGroups(inherited, value)
        : value;
  });

  return merged;
};

interface RawEntry {
  path: string[];
  token: DTCGToken;
  groupType?: DTCGType;
  groupDeprecated?: boolean | string;
}

const collect = (
  doc: DTCGDocument,
  group: AnyObject,
  path: string[],
  groupType: DTCGType | undefined,
  groupDeprecated: boolean | string | undefined,
  entries: RawEntry[]
): void => {
  const resolved = extendGroup(doc, group, [path.join('.')]);

  validateProperties('group', path.join('.'), resolved);

  const type = (resolved.$type as DTCGType | undefined) ?? groupType;
  const deprecated =
    (resolved.$deprecated as boolean | string | undefined) ?? groupDeprecated;

  childNames(resolved).forEach((name) => {
    const child = resolved[name];
    const childPath = [...path, name];

    if (name !== '$root' && FORBIDDEN_NAME_PATTERN.test(name)) {
      throw Error(
        `Invalid name "${childPath.join('.')}": names must not contain "{", "}" or "."`
      );
    }

    if (!isObject(child)) return;

    if (isToken(child)) {
      if (childNames(child).length) {
        throw Error(
          `"${childPath.join('.')}" has a $value and children, which is invalid`
        );
      }

      validateProperties('token', childPath.join('.'), child);

      entries.push({
        path: childPath,
        token: child,
        groupType: type,
        groupDeprecated: deprecated
      });
    } else {
      collect(doc, child, childPath, type, deprecated, entries);
    }
  });
};
const toId = (path: string[]): string =>
  path.filter((segment) => segment !== '$root').join('-');

/**
 * Flattens a DTCG token document into a list of tokens with resolved types and values.
 *
 * Supports group `$type` inheritance, `$root` tokens, `$extends`, `$deprecated` inheritance,
 * curly brace aliases (`{group.token}`) and JSON Pointer references (`{ "$ref": "#/group/token/$value" }`),
 * also inside composite values. Circular references, invalid names and untyped tokens throw,
 * and so does a value that doesn't match its `$type` (a `TypeError` or `RangeError` naming
 * the token and field, see `validateTokenValue`).
 *
 * @param {DTCGDocument} doc - The token document, e.g. the parsed contents of a `*.tokens.json` file
 * @returns {FlatDesignToken[]} The tokens, in document order
 * @example
 * ```ts
 * const tokens = flattenTokens({
 *   color: {
 *     $type: 'color',
 *     blue: { $value: { colorSpace: 'srgb', components: [0, 0.33, 0.94] } },
 *     accent: { $value: '{color.blue}' }
 *   }
 * });
 * tokens[1].value; // { colorSpace: 'srgb', components: [0, 0.33, 0.94] }
 * tokens[1].ancestors; // ['color-blue']
 * ```
 */
export const flattenTokens = (doc: DTCGDocument): FlatDesignToken[] => {
  const entries: RawEntry[] = [];

  collect(doc, doc, [], undefined, undefined, entries);

  const byName = new Map(entries.map((entry) => [entry.path.join('.'), entry]));
  const resolved = new Map<string, FlatDesignToken>();
  const resolveToken = (name: string, stack: string[]): FlatDesignToken => {
    const cached = resolved.get(name);

    if (cached) return cached;

    if (stack.includes(name))
      throw Error(`Circular reference: ${[...stack, name].join(' → ')}`);

    const entry = byName.get(name);

    if (!entry)
      throw Error(
        `Unresolvable reference "{${name}}"${stack.length ? ` in "${stack.at(-1)}"` : ''}`
      );

    const nextStack = [...stack, name];
    const ancestors = new Set<string>();

    let referencedType: DTCGType | undefined;

    // References to whole tokens, by the field they are in, to check their $type
    const references: TokenReference[] = [];
    const resolveValue = (value: unknown, field = '$value'): unknown => {
      const isWholeValue = field === '$value';
      const alias = parseAlias(value);

      if (alias) {
        const target = resolveToken(alias, nextStack);

        ancestors.add(target.id);
        references.push({ field, name: target.name, $type: target.$type });

        if (isWholeValue) referencedType = target.$type;

        return target.value;
      }

      if (isReference(value)) {
        const segments = parsePointer(value.$ref);
        const valueIndex = segments.indexOf('$value');
        const tokenSegments =
          valueIndex === -1 ? segments : segments.slice(0, valueIndex);
        const target = resolveToken(tokenSegments.join('.'), nextStack);

        ancestors.add(target.id);

        // A pointer to the token or its whole $value references the token; a
        // pointer into its value (such as one color component) is checked by shape
        if (valueIndex === -1 || segments.length === valueIndex + 1) {
          references.push({ field, name: target.name, $type: target.$type });

          if (isWholeValue) referencedType = target.$type;
        }

        return valueIndex === -1
          ? target.value
          : getAt(target.value, segments.slice(valueIndex + 1));
      }

      if (Array.isArray(value))
        return value.map((item, index) =>
          resolveValue(item, `${field}[${index}]`)
        );

      if (isObject(value)) {
        return Object.fromEntries(
          Object.entries(value).map(([key, item]) => [
            key,
            resolveValue(item, `${field}.${key}`)
          ])
        );
      }

      return value;
    };
    const { token, path, groupType, groupDeprecated } = entry;
    const value = resolveValue(token.$value);
    const $type = token.$type ?? referencedType ?? groupType;

    if (!$type)
      throw Error(
        `"${name}" has no $type: set it on the token or a parent group`
      );

    // The resolved value, aliases included, must match its $type
    validateTokenValue(name, $type, value, references);

    const $deprecated = token.$deprecated ?? groupDeprecated;
    const flat: FlatDesignToken = {
      id: toId(path),
      name,
      path,
      $type,
      $value: token.$value,
      value: value as FlatDesignToken['value'],
      aliasOf: parseAlias(token.$value),
      ancestors: [...ancestors],
      descendants: [],
      ...(token.$description !== undefined && {
        $description: token.$description
      }),
      ...($deprecated !== undefined &&
        $deprecated !== false && { $deprecated }),
      ...(token.$extensions !== undefined && { $extensions: token.$extensions })
    };

    resolved.set(name, flat);

    return flat;
  };
  const tokens = entries.map((entry) => resolveToken(entry.path.join('.'), []));
  const byId = new Map(tokens.map((token) => [token.id, token]));

  tokens.forEach((token) =>
    token.ancestors.forEach((id) => byId.get(id)?.descendants.push(token.id))
  );

  return tokens;
};

/**
 * Reads this tool's vendor data from a token's `$extensions`.
 */
export const getExtension = (
  token: Pick<FlatDesignToken, '$extensions'>
): AnyObject =>
  (token.$extensions?.[DTF_EXTENSION_KEY] as AnyObject | undefined) ?? {};

// ---------------------------------------------------------------------------
// CSS conversion
// ---------------------------------------------------------------------------

const round = (value: number, decimals = 4): number => {
  const factor = 10 ** decimals;

  return Math.round(value * factor) / factor;
};
const RGB_LIKE_SPACES = new Set([
  'srgb-linear',
  'display-p3',
  'a98-rgb',
  'prophoto-rgb',
  'rec2020',
  'xyz-d65',
  'xyz-d50'
]);

/**
 * Returns the 6 digit hex of an sRGB color: the `hex` fallback if given, else computed from the components.
 */
export const colorToHex = (color: DTCGColorValue): string | undefined => {
  if (color.hex) return color.hex.toLowerCase();

  if (color.colorSpace !== 'srgb' || color.components.includes('none'))
    return undefined;

  return `#${(color.components as number[])
    .map((channel) =>
      Math.round(Math.min(Math.max(channel, 0), 1) * 255)
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`;
};

/**
 * Converts a DTCG color to a CSS color, e.g. `#0054f0`, `rgb(0 84 240 / 0.5)`, `oklch(0.6 0.2 260)`.
 */
export const colorToCss = (color: DTCGColorValue): string => {
  const { colorSpace, components, alpha } = color;
  const hasAlpha = alpha !== undefined && alpha !== 1;
  const alphaPart = hasAlpha ? ` / ${round(alpha)}` : '';
  const channels = (format: (channel: number, index: number) => string) =>
    components
      .map((channel, index) =>
        channel === 'none' ? 'none' : format(channel, index)
      )
      .join(' ');

  switch (colorSpace) {
    case 'srgb': {
      const hex = colorToHex(color);

      if (hex && !hasAlpha) return hex;

      return `rgb(${channels((channel) => String(round(channel * 255, 2)))}${alphaPart})`;
    }
    case 'hsl':
    case 'hwb':
      return `${colorSpace}(${channels((channel, index) => (index === 0 ? `${round(channel)}` : `${round(channel)}%`))}${alphaPart})`;
    case 'lab':
    case 'lch':
    case 'oklab':
    case 'oklch':
      return `${colorSpace}(${channels((channel) => String(round(channel)))}${alphaPart})`;
    default:
      if (!RGB_LIKE_SPACES.has(colorSpace))
        throw Error(`Unsupported colorSpace "${colorSpace}"`);

      return `color(${colorSpace} ${channels((channel) => String(round(channel)))}${alphaPart})`;
  }
};

export const dimensionToCss = ({
  value,
  unit
}: DTCGDimensionValue | DTCGDurationValue): string => `${value}${unit}`;

const GENERIC_FONT_FAMILIES = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-serif',
  'ui-sans-serif',
  'ui-monospace',
  'ui-rounded',
  'emoji',
  'math',
  'fangsong'
]);
// Control characters in a font name; a newline would end the CSS string
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/g;
const escapeFontName = (name: string): string =>
  name
    .replace(/(["\\])/g, '\\$1')
    .replace(
      CONTROL_CHARACTERS,
      (character) => `\\${character.charCodeAt(0).toString(16)} `
    );

/**
 * Converts font names to a CSS `font-family` list, quoting every name that is
 * not a generic family. Quotes, backslashes and control characters are
 * escaped, so a name can't break out of its string, also when it comes from
 * `$extensions` rather than a validated `$value`.
 */
export const fontFamilyToCss = (family: DTCGFontFamilyValue): string =>
  (Array.isArray(family) ? family : [family])
    .map((name) =>
      GENERIC_FONT_FAMILIES.has(name) ? name : `"${escapeFontName(name)}"`
    )
    .join(', ');

export const fontWeightToNumber = (weight: DTCGFontWeightValue): number =>
  typeof weight === 'number' ? weight : FONT_WEIGHT_KEYWORDS[weight];

export const cubicBezierToCss = (curve: DTCGCubicBezierValue): string =>
  `cubic-bezier(${curve.join(', ')})`;

export const strokeStyleToCss = (style: DTCGStrokeStyleValue): string =>
  // CSS has no custom dash arrays for borders, `dashed` is the closest match
  typeof style === 'string' ? style : 'dashed';

const shadowToCss = (shadow: DTCGShadowObject): string =>
  [
    shadow.inset ? 'inset' : '',
    dimensionToCss(shadow.offsetX as DTCGDimensionValue),
    dimensionToCss(shadow.offsetY as DTCGDimensionValue),
    dimensionToCss(shadow.blur as DTCGDimensionValue),
    dimensionToCss(shadow.spread as DTCGDimensionValue),
    colorToCss(shadow.color as DTCGColorValue)
  ]
    .filter(Boolean)
    .join(' ');

/**
 * Converts a resolved token value to a CSS value.
 *
 * @param {Pick<FlatDesignToken, '$type' | 'value'>} token - A flattened token
 * @returns {string} The CSS value, e.g. `#0054f0`, `0.875rem`, `"IBM Plex Sans", Arial, sans-serif`
 */
export const toCssValue = ({
  $type,
  value
}: Pick<FlatDesignToken, '$type' | 'value'>): string => {
  switch ($type) {
    case 'color':
      return colorToCss(value as DTCGColorValue);
    case 'dimension':
    case 'duration':
      return dimensionToCss(value as DTCGDimensionValue);
    case 'fontFamily':
      return fontFamilyToCss(value as DTCGFontFamilyValue);
    case 'fontWeight':
      return String(fontWeightToNumber(value as DTCGFontWeightValue));
    case 'number':
      return String(value);
    case 'cubicBezier':
      return cubicBezierToCss(value as DTCGCubicBezierValue);
    case 'strokeStyle':
      return strokeStyleToCss(value as DTCGStrokeStyleValue);
    case 'border': {
      const { width, style, color } = value as DTCGBorderValue;

      return `${dimensionToCss(width as DTCGDimensionValue)} ${strokeStyleToCss(style as DTCGStrokeStyleValue)} ${colorToCss(color as DTCGColorValue)}`;
    }
    case 'transition': {
      const { duration, delay, timingFunction } = value as DTCGTransitionValue;

      return `${dimensionToCss(duration as DTCGDurationValue)} ${cubicBezierToCss(timingFunction as DTCGCubicBezierValue)} ${dimensionToCss(delay as DTCGDurationValue)}`;
    }
    case 'shadow':
      return (Array.isArray(value) ? value : [value])
        .map((shadow) => shadowToCss(shadow as DTCGShadowObject))
        .join(', ');
    case 'gradient':
      return `linear-gradient(90deg, ${(value as DTCGGradientStop[])
        .map(
          ({ color, position }) =>
            `${colorToCss(color as DTCGColorValue)} ${round(Math.min(Math.max(position as number, 0), 1) * 100, 2)}%`
        )
        .join(', ')})`;
    case 'typography': {
      const { fontFamily, fontSize, fontWeight, lineHeight } =
        value as DTCGTypographyValue;

      return `${fontWeightToNumber(fontWeight as DTCGFontWeightValue)} ${dimensionToCss(fontSize as DTCGDimensionValue)}/${lineHeight} ${fontFamilyToCss(fontFamily as DTCGFontFamilyValue)}`;
    }
    default:
      throw Error(`Unsupported $type "${$type}"`);
  }
};
