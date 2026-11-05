import { DTFColorValueHexType, DTFColorValueRgbType } from '../types/colors';

// Anreas Wik https://codepen.io/andreaswik
export const light_or_dark = (
  color: DTFColorValueHexType | DTFColorValueRgbType
) => {
  let r: number;
  let g: number;
  let b: number;

  // Check the format of the color, HEX or RGB?
  if (color.match(/^rgb/)) {
    // If HEX --> store the red, green, blue values in separate variables
    const colorToUse = color.match(
      /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/
    );

    if (!colorToUse) {
      throw Error('Not a valid rgb color');
    }

    r = parseInt(colorToUse[1], 10);
    g = parseInt(colorToUse[2], 10);
    b = parseInt(colorToUse[3], 10);
  } else {
    // If RGB --> Convert it to HEX: http://gist.github.com/983661
    const colorToUse = +(
      '0x' + color.slice(1).replace(color.length < 5 ? /./g : '', '$&$&')
    );

    r = colorToUse >> 16;
    g = (colorToUse >> 8) & 255;
    b = colorToUse & 255;
  }

  // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
  const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));

  // Using the HSP value, determine whether the color is light or dark
  if (hsp > 127.5) {
    return 'light';
  } else {
    return 'dark';
  }
};
