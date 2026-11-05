/**
 * Types for the Design Tokens Community Group (DTCG) Format Module 2025.10.
 *
 * @see https://www.designtokens.org/tr/2025.10/format/
 * @see https://www.designtokens.org/tr/2025.10/color/
 */

/** The `$type` values defined by the spec */
export type DTCGType =
  | 'color'
  | 'dimension'
  | 'fontFamily'
  | 'fontWeight'
  | 'duration'
  | 'cubicBezier'
  | 'number'
  | 'strokeStyle'
  | 'border'
  | 'transition'
  | 'shadow'
  | 'gradient'
  | 'typography';

/** An alias to another token, e.g. `{color.base.blue.100}` */
export type DTCGAlias = `{${string}}`;

/** A JSON Pointer reference, e.g. `{ "$ref": "#/color/base/blue/100/$value" }` */
export type DTCGReference = { $ref: string };

/** Value, alias or JSON Pointer reference */
export type DTCGOrRef<T> = T | DTCGAlias | DTCGReference;

export type DTCGColorSpace =
  | 'srgb'
  | 'srgb-linear'
  | 'hsl'
  | 'hwb'
  | 'lab'
  | 'lch'
  | 'oklab'
  | 'oklch'
  | 'display-p3'
  | 'a98-rgb'
  | 'prophoto-rgb'
  | 'rec2020'
  | 'xyz-d65'
  | 'xyz-d50';

export interface DTCGColorValue {
  colorSpace: DTCGColorSpace;
  /** Channel values, sRGB-like spaces use 0-1. `none` marks a missing component */
  components: (number | 'none')[];
  /** 0-1, defaults to 1 */
  alpha?: number;
  /** 6 digit CSS hex fallback */
  hex?: string;
}

export interface DTCGDimensionValue {
  value: number;
  unit: 'px' | 'rem';
}

export interface DTCGDurationValue {
  value: number;
  unit: 'ms' | 's';
}

export type DTCGFontFamilyValue = string | string[];

export type DTCGFontWeightKeyword =
  | 'thin'
  | 'hairline'
  | 'extra-light'
  | 'ultra-light'
  | 'light'
  | 'normal'
  | 'regular'
  | 'book'
  | 'medium'
  | 'semi-bold'
  | 'demi-bold'
  | 'bold'
  | 'extra-bold'
  | 'ultra-bold'
  | 'black'
  | 'heavy'
  | 'extra-black'
  | 'ultra-black';

export type DTCGFontWeightValue = number | DTCGFontWeightKeyword;

export type DTCGCubicBezierValue = [number, number, number, number];

export type DTCGStrokeStyleValue =
  | 'solid'
  | 'dashed'
  | 'dotted'
  | 'double'
  | 'groove'
  | 'ridge'
  | 'outset'
  | 'inset'
  | {
      dashArray: DTCGOrRef<DTCGDimensionValue>[];
      lineCap: 'round' | 'butt' | 'square';
    };

export interface DTCGBorderValue {
  color: DTCGOrRef<DTCGColorValue>;
  width: DTCGOrRef<DTCGDimensionValue>;
  style: DTCGOrRef<DTCGStrokeStyleValue>;
}

export interface DTCGTransitionValue {
  duration: DTCGOrRef<DTCGDurationValue>;
  delay: DTCGOrRef<DTCGDurationValue>;
  timingFunction: DTCGOrRef<DTCGCubicBezierValue>;
}

export interface DTCGShadowObject {
  color: DTCGOrRef<DTCGColorValue>;
  offsetX: DTCGOrRef<DTCGDimensionValue>;
  offsetY: DTCGOrRef<DTCGDimensionValue>;
  blur: DTCGOrRef<DTCGDimensionValue>;
  spread: DTCGOrRef<DTCGDimensionValue>;
  inset?: boolean;
}

export type DTCGShadowValue = DTCGShadowObject | DTCGOrRef<DTCGShadowObject>[];

export interface DTCGGradientStop {
  color: DTCGOrRef<DTCGColorValue>;
  /** 0-1 */
  position: DTCGOrRef<number>;
}

export type DTCGGradientValue = DTCGOrRef<DTCGGradientStop>[];

export interface DTCGTypographyValue {
  fontFamily: DTCGOrRef<DTCGFontFamilyValue>;
  fontSize: DTCGOrRef<DTCGDimensionValue>;
  fontWeight: DTCGOrRef<DTCGFontWeightValue>;
  letterSpacing: DTCGOrRef<DTCGDimensionValue>;
  /** Multiplier of fontSize */
  lineHeight: DTCGOrRef<number>;
}

/** Maps every `$type` to the shape of its resolved `$value` */
export interface DTCGValueMap {
  color: DTCGColorValue;
  dimension: DTCGDimensionValue;
  fontFamily: DTCGFontFamilyValue;
  fontWeight: DTCGFontWeightValue;
  duration: DTCGDurationValue;
  cubicBezier: DTCGCubicBezierValue;
  number: number;
  strokeStyle: DTCGStrokeStyleValue;
  border: DTCGBorderValue;
  transition: DTCGTransitionValue;
  shadow: DTCGShadowValue;
  gradient: DTCGGradientValue;
  typography: DTCGTypographyValue;
}

export type DTCGValue = DTCGValueMap[DTCGType];

export type DTCGExtensions = Record<string, unknown>;

/** Properties shared by tokens and groups */
interface DTCGCommon {
  $type?: DTCGType;
  $description?: string;
  $deprecated?: boolean | string;
  $extensions?: DTCGExtensions;
}

export interface DTCGToken extends DTCGCommon {
  $value: DTCGValue | DTCGAlias | DTCGReference;
}

export interface DTCGGroup extends DTCGCommon {
  $extends?: DTCGAlias | DTCGReference;
  $root?: DTCGToken;
  [name: string]: DTCGToken | DTCGGroup | DTCGCommon[keyof DTCGCommon] | DTCGAlias | DTCGReference | undefined;
}

/** A complete design token file (`*.tokens.json`) */
export type DTCGDocument = DTCGGroup;

/**
 * A token flattened out of a {@link DTCGDocument} with its type and value resolved.
 */
export interface FlatDesignToken<T extends DTCGType = DTCGType> {
  /** Path joined with `-`, usable as a DOM id, e.g. `color-base-blue-100` */
  id: string;
  /** Path joined with `.`, as used in aliases, e.g. `color.base.blue.100` */
  name: string;
  /** Group and token names leading to the token, `$root` included */
  path: string[];
  /** Explicit, inherited (closest group) or alias resolved type */
  $type: T;
  /** The value as written in the file, may be an alias */
  $value: DTCGToken['$value'];
  /** The fully resolved value, all aliases and references followed */
  value: DTCGValueMap[T];
  /** Name of the token `$value` aliases directly, if any */
  aliasOf?: string;
  /** Ids of the tokens this token references (whole value or sub-values) */
  ancestors: string[];
  /** Ids of the tokens referencing this token */
  descendants: string[];
  $description?: string;
  /** Own or inherited from a group */
  $deprecated?: boolean | string;
  $extensions?: DTCGExtensions;
}
