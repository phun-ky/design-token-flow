/**
 * Represents a color value in hexadecimal format.
 */
export type DTFColorValueHexType = `#${string}`;

/**
 * Represents a color value in HSL format.
 */
export type DTFColorValueHslType = `hsl(${number}, ${string}, ${string})`;

/**
 * Represents a color value in HSLA format.
 */
export type DTFColorValueHslaType =
  `hsl(${number}, ${string}, ${string}, ${number})`;

/**
 * Represents a color value in RGB format.
 */
export type DTFColorValueRgbType = `rgb(${number}, ${number}, ${number})`;

/**
 * Represents a color value in RGBA format.
 */
export type DTFColorValueRgbaType =
  `rgb(${number}, ${number}, ${number}, ${number})`;

/**
 * Represents an RGB color object.
 */
export type DTFRGBObjectType = { r: number; g: number; b: number };

/**
 * Represents an HSL color object.
 */
export type DTFHSLObjectType = { h: number; s: number; l: number };

/**
 * Represents an HSV color object.
 */
export type DTFHSVObjectType = { h: number; s: number; v: number };

/**
 * Represents an LCH color object.
 */
export type DTFLCHObjectType = { l: number; c: number; h: number };

/**
 * Represents an HSI color object.
 */
export type DTFHSIObjectType = { h: number; s: number; i: number };

/**
 * Represents an XYZ color object.
 */
export type DTFXYZObjectType = { x: number; y: number; z: number };

/**
 * Represents an HWB color object.
 */
export type DTFHWBObjectType = { h: number; w: number; b: number };

/**
 * Represents a LAB color object.
 */
export type DTFLABObjectType = { l: number; a: number; b: number };

/**
 * Represents a CMYK color object.
 */
export type DTFCMYKObjectType = {
  c: number;
  m: number;
  y: number;
  k: number;
};
