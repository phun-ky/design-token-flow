/* eslint no-console:0 */
'use strict';

export const set = (el, attrs) => {
  if (!el) return;
  if (!attrs || (attrs && attrs.length === 0)) return;
  Object.keys(attrs).forEach(key => el.setAttribute(key, attrs[key]));
};
export const remove = (el, attrs) => {
  if (!el) return;
  if (!attrs || (attrs && attrs.length === 0)) return;
  Object.keys(attrs).forEach(key => el.removeAttribute(key));
};
export const toggle = (el, attrs) => {
  if (!el) return;
  if (!attrs || (attrs && attrs.length === 0)) return;
  Object.keys(attrs).forEach(key => {
    if (el.getAttribute(key) === attrs[key]) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, attrs[key]);
    }
  });
};
