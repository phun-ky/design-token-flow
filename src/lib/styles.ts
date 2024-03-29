/* eslint no-console:0 */
'use strict';

export const add = (el, styles) => {
  if (!el) return;
  if (
    !styles ||
    (styles && styles.length === 0 && styles.constructor === String) ||
    (styles && styles.length === 0 && styles.constructor === Array) ||
    (styles && Object.keys(styles).length === 0 && styles.constructor === Object)
  )
    return;
  if (typeof styles === 'string') {
    el.style = styles;;
  } else if (Array.isArray(styles)) {
    styles.forEach((style) => (el.style[style.key] = style.value));
  } else {
    Object.keys(styles).forEach(key => (el.style[key] = styles[key]));
  }
};
