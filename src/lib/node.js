/* eslint no-console:0 */
'use strict';

import * as classnames from './classnames';

export const create = ({ type = 'div', classNames = 'ph', id, textContent, attrs }) => {
  const el = document.createElement(type);
  classnames.set(el, classNames);
  if (id) {
    el.setAttribute('id', id);
  }
  if (textContent) {
    el.textContent = textContent;
  }
  if (attrs) {
    Object.keys(attrs).forEach(key => {
      if (attrs[key]) {
        el.setAttribute(key, attrs[key]);
      }
    });
  }
  return el;
};

export const clear = el => {
  const cNode = el.cloneNode(false);
  el.parentNode.replaceChild(cNode, el);
  return cNode;
};

export const prepend = (el, child) => {
  return el.insertBefore(child, el.firstChild);
};
