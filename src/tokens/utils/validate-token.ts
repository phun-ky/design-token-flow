import type { DTCGColorSpace, DTCGFontWeightKeyword } from '../types/tokens';

/**
 * Checks resolved token values against their `$type`, as DTCG 2025.10 defines
 * them. A value that doesn't match throws, naming the token and the field:
 * a `TypeError` for the wrong shape, a `RangeError` for a value outside the
 * allowed range or set.
 *
 * Besides catching mistakes, this keeps token files from adding their own CSS:
 * fields such as `hex`, `value` and `unit` end up in `style` attributes, so
 * only the shapes the spec allows get through.
 *
 * @see https://www.designtokens.org/tr/2025.10/format/
 * @see https://www.designtokens.org/tr/2025.10/color/
 */

/** Font weight keywords and their numeric weights */
export const FONT_WEIGHT_KEYWORDS: Record<DTCGFontWeightKeyword, number> = {
  thin: 100,
  hairline: 100,
  'extra-light': 200,
  'ultra-light': 200,
  light: 300,
  normal: 400,
  regular: 400,
  book: 400,
  medium: 500,
  'semi-bold': 600,
  'demi-bold': 600,
  bold: 700,
  'extra-bold': 800,
  'ultra-bold': 800,
  black: 900,
  heavy: 900,
  'extra-black': 950,
  'ultra-black': 950
};

type Range = [min: number, max: number, maxExcluded?: boolean];

const UNIT: Range = [0, 1];
const HUE: Range = [0, 360, true];
const PERCENT: Range = [0, 100];
const ANY: Range = [-Infinity, Infinity];
const POSITIVE: Range = [0, Infinity];
/** Component ranges per color space, from the color module's table */
const COLOR_SPACES: Record<DTCGColorSpace, Range[]> = {
  srgb: [UNIT, UNIT, UNIT],
  'srgb-linear': [UNIT, UNIT, UNIT],
  hsl: [HUE, PERCENT, PERCENT],
  hwb: [HUE, PERCENT, PERCENT],
  lab: [PERCENT, ANY, ANY],
  lch: [PERCENT, POSITIVE, HUE],
  oklab: [UNIT, ANY, ANY],
  oklch: [UNIT, POSITIVE, HUE],
  'display-p3': [UNIT, UNIT, UNIT],
  'a98-rgb': [UNIT, UNIT, UNIT],
  'prophoto-rgb': [UNIT, UNIT, UNIT],
  rec2020: [UNIT, UNIT, UNIT],
  'xyz-d65': [UNIT, UNIT, UNIT],
  'xyz-d50': [UNIT, UNIT, UNIT]
};
const STROKE_STYLES = [
  'solid',
  'dashed',
  'dotted',
  'double',
  'groove',
  'ridge',
  'outset',
  'inset'
];
const LINE_CAPS = ['round', 'butt', 'square'];
const HEX_COLOR = /^#[0-9a-f]{6}$/i;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/;

type Fail = (
  ErrorType: typeof TypeError | typeof RangeError,
  field: string,
  expected: string,
  value: unknown
) => never;
type Check = (value: unknown, field: string, fail: Fail) => void;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const show = (value: unknown): string => {
  const text =
    value === undefined ? 'nothing' : (JSON.stringify(value) ?? String(value));

  return text.length > 60 ? `${text.slice(0, 57)}...` : text;
};
const formatRange = ([min, max, maxExcluded]: Range): string =>
  `${min} to ${max}${maxExcluded ? ' (not included)' : ''}`;
const inRange = (value: number, [min, max, maxExcluded]: Range): boolean =>
  value >= min && (maxExcluded ? value < max : value <= max);
const object = (value: unknown, field: string, fail: Fail, what: string) => {
  if (!isObject(value)) fail(TypeError, field, what, value);

  return value as Record<string, unknown>;
};
const number = (
  value: unknown,
  field: string,
  fail: Fail,
  range: Range = ANY
): void => {
  if (!isNumber(value)) fail(TypeError, field, 'a number', value);

  if (!inRange(value as number, range))
    fail(RangeError, field, `from ${formatRange(range)}`, value);
};
const oneOf = (
  value: unknown,
  field: string,
  fail: Fail,
  allowed: readonly string[]
): void => {
  if (typeof value !== 'string')
    fail(TypeError, field, `one of ${allowed.join(', ')}`, value);

  if (!allowed.includes(value as string))
    fail(RangeError, field, `one of ${allowed.join(', ')}`, value);
};
const color: Check = (value, field, fail) => {
  const { colorSpace, components, alpha, hex } = object(
    value,
    field,
    fail,
    'a color object'
  );
  const spaces = Object.keys(COLOR_SPACES);

  oneOf(colorSpace, `${field}.colorSpace`, fail, spaces);

  if (!Array.isArray(components) || components.length !== 3)
    fail(TypeError, `${field}.components`, 'an array of 3', components);

  const ranges = COLOR_SPACES[colorSpace as DTCGColorSpace];

  (components as unknown[]).forEach((component, index) => {
    if (component !== 'none')
      number(component, `${field}.components[${index}]`, fail, ranges[index]);
  });

  if (alpha !== undefined) number(alpha, `${field}.alpha`, fail, UNIT);

  if (hex !== undefined) {
    if (typeof hex !== 'string')
      fail(TypeError, `${field}.hex`, 'a string', hex);

    if (!HEX_COLOR.test(hex as string))
      fail(RangeError, `${field}.hex`, 'a 6 digit hex color like #0054f0', hex);
  }
};

function measure(units: string[]): Check {
  return (value, field, fail) => {
    const measured = object(
      value,
      field,
      fail,
      `an object with value and unit (${units.join(' or ')})`
    );

    number(measured.value, `${field}.value`, fail);
    oneOf(measured.unit, `${field}.unit`, fail, units);
  };
}

const dimension = measure(['px', 'rem']);
const duration = measure(['ms', 's']);
const fontFamily: Check = (value, field, fail) => {
  const names = Array.isArray(value) ? value : [value];

  if (!names.length)
    fail(TypeError, field, 'a font name or a list of them', value);

  names.forEach((name, index) => {
    const nameField = Array.isArray(value) ? `${field}[${index}]` : field;

    if (typeof name !== 'string' || !name.trim())
      fail(TypeError, nameField, 'a font name', name);

    if (CONTROL_CHARACTER.test(name as string))
      fail(
        RangeError,
        nameField,
        'a font name without control characters',
        name
      );
  });
};
const fontWeight: Check = (value, field, fail) => {
  if (typeof value === 'string')
    return oneOf(value, field, fail, Object.keys(FONT_WEIGHT_KEYWORDS));

  if (!isNumber(value))
    fail(TypeError, field, 'a number or a weight keyword', value);

  number(value, field, fail, [1, 1000]);
};
const cubicBezier: Check = (value, field, fail) => {
  if (!Array.isArray(value) || value.length !== 4)
    fail(TypeError, field, 'an array of 4 numbers', value);

  (value as unknown[]).forEach((point, index) =>
    number(point, `${field}[${index}]`, fail, index % 2 ? ANY : UNIT)
  );
};
const strokeStyle: Check = (value, field, fail) => {
  if (typeof value === 'string')
    return oneOf(value, field, fail, STROKE_STYLES);

  const { dashArray, lineCap } = object(
    value,
    field,
    fail,
    'a stroke style keyword or an object with dashArray and lineCap'
  );

  if (!Array.isArray(dashArray) || !dashArray.length)
    fail(TypeError, `${field}.dashArray`, 'a list of dimensions', dashArray);

  (dashArray as unknown[]).forEach((dash, index) =>
    dimension(dash, `${field}.dashArray[${index}]`, fail)
  );
  oneOf(lineCap, `${field}.lineCap`, fail, LINE_CAPS);
};

function listOf(check: Check, what: string, allowSingle = false): Check {
  return (value, field, fail) => {
    if (allowSingle && isObject(value)) return check(value, field, fail);

    if (!Array.isArray(value) || !value.length)
      fail(TypeError, field, what, value);

    (value as unknown[]).forEach((item, index) =>
      check(item, `${field}[${index}]`, fail)
    );
  };
}
function composite(
  what: string,
  fields: Record<string, Check>,
  optional: string[] = []
): Check {
  return (value, field, fail) => {
    const parts = object(value, field, fail, what);

    Object.entries(fields).forEach(([name, check]) => {
      if (!(optional.includes(name) && parts[name] === undefined))
        check(parts[name], `${field}.${name}`, fail);
    });
  };
}

const shadowObject = composite(
  'a shadow object',
  {
    color,
    offsetX: dimension,
    offsetY: dimension,
    blur: dimension,
    spread: dimension,
    inset: (value, field, fail) => {
      if (typeof value !== 'boolean')
        fail(TypeError, field, 'true or false', value);
    }
  },
  ['inset']
);
const CHECKS: Record<string, Check> = {
  color,
  dimension,
  duration,
  fontFamily,
  fontWeight,
  cubicBezier,
  number: (value, field, fail) => number(value, field, fail),
  strokeStyle,
  border: composite('a border object', {
    color,
    width: dimension,
    style: strokeStyle
  }),
  transition: composite('a transition object', {
    duration,
    delay: duration,
    timingFunction: cubicBezier
  }),
  shadow: listOf(shadowObject, 'a shadow object or a list of them', true),
  // Positions outside 0 to 1 are clamped, as the spec says, so any number goes
  gradient: listOf(
    composite('a gradient stop', {
      color,
      position: (value, field, fail) => number(value, field, fail)
    }),
    'a list of gradient stops'
  ),
  typography: composite('a typography object', {
    fontFamily,
    fontSize: dimension,
    fontWeight,
    letterSpacing: dimension,
    lineHeight: (value, field, fail) => number(value, field, fail)
  })
};

/**
 * Throws when a resolved value doesn't match its `$type`.
 *
 * @param {string} name The token's name, such as `color.cta`, for the message
 * @param {string} $type The token's resolved `$type`
 * @param {unknown} value The token's resolved value (aliases replaced)
 * @throws {TypeError} When the type is not a string, or a field has the wrong shape
 * @throws {RangeError} When the type is unknown, or a field is out of range
 * @example
 * ```ts
 * validateTokenValue('color.cta', 'color', { colorSpace: 'srgb', components: [0, 0.33, 0.94], hex: '#000; x' });
 * // RangeError: Invalid token "color.cta" (color): $value.hex must be a 6 digit hex color like #0054f0, got "#000; x"
 * ```
 */
export const validateTokenValue = (
  name: string,
  $type: unknown,
  value: unknown
): void => {
  const fail: Fail = (ErrorType, field, expected, got) => {
    throw new ErrorType(
      `Invalid token "${name}" (${String($type)}): ${field} must be ${expected}, got ${show(got)}`
    );
  };

  if (typeof $type !== 'string') fail(TypeError, '$type', 'a string', $type);

  const check = Object.hasOwn(CHECKS, $type as string)
    ? CHECKS[$type as string]
    : undefined;

  if (!check)
    fail(
      RangeError,
      '$type',
      `one of ${Object.keys(CHECKS).join(', ')}`,
      $type
    );

  (check as Check)(value, '$value', fail);
};
