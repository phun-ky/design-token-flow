/* eslint no-console:0 */
'use strict';

import * as color from './lib/color';
import * as node from './lib/node';
import * as styles from './lib/styles';
import * as classnames from './lib/classnames';

const DesignToken = function (this:typeof DesignToken, token) {
  this._init(token);
};
//
// DesignToken.prototype.update = function () {
//     this.id = this.el.getAttribute('id');
//     this['data-value'] = this.el.getAttribute('data-value');
//     this['data-rgb'] = this.el.getAttribute('data-rgb');
//     this['data-hex'] = this.el.getAttribute('data-hex');
//     this['data-color'] = this.el.getAttribute('data-color');
//     this['data-descendants'] = this.el.getAttribute('data-descendants');
//     this['data-ancestors'] = this.el.getAttribute('data-ancestors');
// };
DesignToken.prototype._create_el = function () {
  const classNames = classnames.cx('design-token', {
    color: this.category === 'color' && this.type !== 'text',
    large: this.type === 'base' || this.category === 'font-family',
    font: this.category === 'font-family',
    size: this.category === 'size',
    'font-weight': this.category === 'font' && this.type === 'weight',
    'text-color': this.category === 'color' && this.type === 'text'
  });
  /*

  <span
    id="color-blackSlug"
    class="point design-token color large"
    data-rgb="rgb(51,30,17)"
    data-hex="#331e11"
    data-color="#331e11"
    data-value="rgb(51,30,17)"
    ><span class="drop"></span>$color-blackSlug<code>331e11</code></span
  >

  */
  const _el = node.create({
    type: 'span',
    classNames,
    attrs: {
      id: this.id,
      'data-category': this.category,
      'data-type': this.type,
      'data-item': this.item,
      'data-subItem': this.subItem,
      'data-state': this.state,
      'data-hex': this.hex,
      'data-color': this.color,
      'data-value': this.value,
      'data-size': this.size,
      'data-px': this.px,
      'data-rem': this.rem,
      'data-ancestors': this.ancestors,
      'data-descendants': this.descendants
    }
  });

  const _id = document.createTextNode(`$${this.id}`);

  node.prepend(_el, _id);

  if (this.category === 'color') {
    const _drop_el = node.create({ type: 'span', classNames: 'drop' });
    node.prepend(_el, _drop_el);
    styles.add(_drop_el, { 'background-color': this.color });
    if (this.type === 'base') {
      const _code_el = node.create({ type: 'code', textContent: this.hex || this.color });
      _el.appendChild(_code_el);
    }
  }

  if (this.category === 'font-family') {
    const _code_el = node.create({ type: 'code', textContent: this.value });
    _el.appendChild(_code_el);
  }

  if (this.category === 'font' && this.type === 'weight') {
    let _styles = {};

    if (this['font-family']) {
      _styles['font-family'] = this['font-family'];
    }

    if (this.variable) {
      _styles['font-weight'] = 'normal';
      _styles['font-variation-settings'] = `"wght" ${this.value}`;
    } else {
      _styles['font-weight'] = this.value;
    }
    const _weight_el = node.create({ type: 'span', textContent: 'Rr', classNames: 'text' });
    styles.add(_weight_el, _styles);
    node.prepend(_el, _weight_el);
  }

  if (this.category === 'color' && this.type === 'text') {
    if (this.color) {
      const _text_el = node.create({ type: 'span', textContent: 'Aa', classNames: 'text' });
      const _color_lightness = color.light_or_dark(this.color);
      const _is_light_color = _color_lightness === 'light';

      classnames.set(_el, _color_lightness);
      styles.add(_text_el, { color: this.color });

      if (_is_light_color) {
        styles.add(_el, { color: this.color });
      }
      node.prepend(_el, _text_el);
    }
  }

  return _el;
};

DesignToken.prototype._init = function (token) {
  let { category, type, item, subItem, state, em, value, id, ancestorId, color, rgb, hex, px, rem } = token;
  const __formatRgb = color => {
    if (color.indexOf('rgb') === 0) {
      return color.replace(/,\s/g, ',');
    }
    return color;
  };
  Object.keys(token).forEach(key => {
    if (key === 'ancestorId') return;
    this[key] = token[key];
  });
  if (category && category === 'color') {
    this.color = __formatRgb(color || value || rgb || hex);
    if (rgb) {
      this.rgb = __formatRgb(rgb);
    }
    if (hex) {
      this.hex = hex;
    }
  }
  if (category && category === 'size') {
    this.size = value || px || rem;
    if (px) {
      this.px = px;
    }
    if (rem) {
      this.rem = rem;
    }
    if (em) {
      this.em = em;
    }
  }
  if (ancestorId && ancestorId !== '') {
    this.ancestors = ancestorId;
  }

  this.el = this._create_el();
};

DesignToken.prototype._set = function (key, value) {
  this[key] = value;
  if (this.el) {
    this.el.setAttribute(`data-${key}`, value);
  }
};

DesignToken.prototype._get = function (key) {
  return this[key];
};

DesignToken.prototype.process = function () {
  // if (this.el.classList.contains('color')) {
  //   const color = this._get('color');
  //   if (color) {
  //     const drop = this.el.querySelector('.drop');
  //     if (drop) {
  //       drop.style.backgroundColor = color;
  //       this._set('color', color);
  //     }
  //   }
  // }
  // if (this.el.classList.contains('is-connected')) {
  //   this._find_connections();
  // }
};

export default DesignToken;
