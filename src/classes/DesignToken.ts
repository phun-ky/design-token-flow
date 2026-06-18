import * as classnames from '../utils/classnames';
import * as color from '../utils/light-or-dark';
import * as node from '../utils/node';
import * as styles from '../utils/styles';

type DTFColorValueHexType = `#${string}`;
type DTFColorValueRgbType = `rgb(${number}, ${number}, ${number})`;
type DTFSizeValuePxType = `${number}px`;
type DTFSizeValueRemType = `${number}rem`;
type DTFSizeValueEmType = `${number}em`;
type DTFColorValueType = DTFColorValueHexType | DTFColorValueRgbType;
type DTFSizeValueType =
  | DTFSizeValueRemType
  | DTFSizeValueEmType
  | DTFSizeValuePxType;

interface Token {
  category: string | null;
  type: string | null;
  item: string | null;
  subItem: string | null;
  state: string | null;
  em: DTFSizeValueEmType | null;
  value: string | null;
  id: string | null;
  ancestorId: string | null;
  color: DTFColorValueType | null;
  rgb: DTFColorValueRgbType | null;
  hex: DTFColorValueHexType | null;
  px: DTFSizeValuePxType | null;
  rem: DTFSizeValueRemType | null;
  size: DTFSizeValueType | null;
}
interface DesignTokenInterface extends Token {
  variable: boolean;
  ancestorId: string | null;
}

class DesignToken implements DesignTokenInterface {
  el: HTMLElement | null = null;
  id: string | null = null;
  value: string | null = null;
  rgb: DTFColorValueRgbType | null = null;
  hex: DTFColorValueHexType | null = null;
  color: DTFColorValueType | null = null;
  descendants: string | null = null;
  ancestors: string | null = null;
  category: string | null = null;
  type: string | null = null;
  item: string | null = null;
  subItem: string | null = null;
  state: string | null = null;
  size: DTFSizeValueType | null = null;
  px: DTFSizeValuePxType | null = null;
  rem: DTFSizeValueRemType | null = null;
  em: DTFSizeValueEmType | null = null;
  variable = false;

  constructor(token: Token) {
    this.#init(token);
  }
  ancestorId: string | null;

  update(): void {
    if (this.el instanceof HTMLElement) {
      this.id = this.el.getAttribute('id');
      this.value = this.el.getAttribute('data-value');
      this.rgb = this.el.getAttribute(
        'data-rgb'
      ) as DTFColorValueRgbType | null;
      this.hex = this.el.getAttribute(
        'data-hex'
      ) as DTFColorValueHexType | null;
      this.color = this.el.getAttribute(
        'data-color'
      ) as DTFColorValueType | null;
      this.px = this.el.getAttribute('data-px') as DTFSizeValuePxType | null;
      this.size = this.el.getAttribute('data-size') as DTFSizeValueType | null;
      this.rem = this.el.getAttribute('data-rem') as DTFSizeValueRemType | null;
      this.em = this.el.getAttribute('data-em') as DTFSizeValueEmType | null;
      this.descendants = this.el.getAttribute('data-descendants');
      this.ancestors = this.el.getAttribute('data-ancestors');
    }
  }

  #createElement(): HTMLElement {
    const classNames = classnames.cx('design-token', {
      color: this.category === 'color' && this.type !== 'text',
      large: this.type === 'base' || this.category === 'font-family',
      font: this.category === 'font-family',
      size: this.category === 'size',
      'font-weight': this.category === 'font' && this.type === 'weight',
      'text-color': this.category === 'color' && this.type === 'text'
    });
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
        const _code_el = node.create({
          type: 'code',
          textContent: (this.hex || this.color) as string
        });

        _el.appendChild(_code_el);
      }
    }

    if (this.category === 'font-family') {
      const _code_el = node.create({
        type: 'code',
        textContent: this.value as string
      });

      _el.appendChild(_code_el);
    }

    if (this.category === 'font' && this.type === 'weight') {
      const _styles = {};

      if (this['font-family']) _styles['font-family'] = this['font-family'];

      if (this.variable) {
        _styles['font-weight'] = 'normal';
        _styles['font-variation-settings'] = `"wght" ${this.value}`;
      } else {
        _styles['font-weight'] = this.value;
      }

      const _weight_el = node.create({
        type: 'span',
        textContent: 'Rr',
        classNames: 'text'
      });

      styles.add(_weight_el, _styles);
      node.prepend(_el, _weight_el);
    }

    if (this.category === 'color' && this.type === 'text') {
      if (this.color) {
        const _text_el = node.create({
          type: 'span',
          textContent: 'Aa',
          classNames: 'text'
        });
        const _color_lightness = color.light_or_dark(this.color);
        const _is_light_color = _color_lightness === 'light';

        classnames.set(_el, _color_lightness);
        styles.add(_text_el, { color: this.color });

        if (_is_light_color) styles.add(_el, { color: this.color });

        node.prepend(_el, _text_el);
      }
    }

    return _el;
  }

  #init(token: Token): void {
    Object.keys(token).forEach((key) => {
      if (key === 'ancestorId') return;

      this[key] = token[key];
    });

    const __formatRgb = (color: DTFColorValueType) => {
      if (color.indexOf('rgb') === 0) {
        return color.replace(/,\s/g, ',');
      }

      return color;
    };
    const {category, value, rgb, hex, px, rem, em, ancestorId} = token;

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
      this.size = (value || px || rem) as DTFSizeValueType;

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

    this.el = this.#createElement();
  }

  private set(key: string, value: string): void {
    this[key] = value;

    if (this.el) {
      this.el.setAttribute(`data-${key}`, value);
    }
  }

  private get(key: string): string | null {
    return this[key];
  }

  process(): void {
    // Implement the processing logic
  }
}

export default DesignToken;
