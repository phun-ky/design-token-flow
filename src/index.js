/* eslint no-console:0 */
'use strict';
console.clear();

import * as color from './lib/color';
import { uniqueID } from './lib/helpers';
import panzoom from 'panzoom';
import * as node from './lib/node';
import * as cardinal from './lib/cardinal';
import * as styles from './lib/styles';
import * as classnames from './lib/classnames';

const DesignToken = function (obj) {
  this._init(obj);
};

DesignToken.prototype.update = function () {
  if (this.el instanceof HTMLElement) {
    this.id = this.el.getAttribute('id');
    this['data-value'] = this.el.getAttribute('data-value');
    this['data-rgb'] = this.el.getAttribute('data-rgb');
    this['data-hex'] = this.el.getAttribute('data-hex');
    this['data-color'] = this.el.getAttribute('data-color');
    this['data-descendants'] = this.el.getAttribute('data-descendants');
    this['data-ancestors'] = this.el.getAttribute('data-ancestors');
  }
};

DesignToken.prototype._init = function (obj) {
  if (obj instanceof HTMLElement) {
    this.id = obj.getAttribute('id');
    this['data-value'] = obj.getAttribute('data-value');
    this['data-rgb'] = obj.getAttribute('data-rgb');
    this['data-hex'] = obj.getAttribute('data-hex');
    this['data-color'] = obj.getAttribute('data-color');
    this['data-descendants'] = obj.getAttribute('data-descendants');
    this['data-ancestors'] = obj.getAttribute('data-ancestors');
    this.el = obj;
  }
};

DesignToken.prototype._fix_text_color = function () {
  const _color = this._get_attribute('data-color');
  console.log(this);

  if (_color) {
    const _text_el = node.create({ type: 'span', textContent: 'Aa', classNames: 'text' });
    const _color_lightness = color.light_or_dark(_color);
    const _is_light_color = _color_lightness === 'light';

    classnames.set(this.el, _color_lightness);
    styles.add(_text_el, { color: _color });

    if (_is_light_color) {
      styles.add(this.el, { color: _color });
    }
    node.prepend(this.el, _text_el);
  }
};

DesignToken.prototype._set_attribute = function (key, value) {
  this.el.setAttribute(key, value);
  this[key] = value;
};

DesignToken.prototype._get_attribute = function (key) {
  return this[key];
};

DesignToken.prototype.process = function () {
  if (this.el.classList.contains('color')) {
    const color = this._get_attribute('data-color');
    if (color) {
      const drop = this.el.querySelector('.drop');
      if (drop) {
        drop.style.backgroundColor = color;
        this._set_attribute('data-color', color);
      }
    }
  }

  if (this.el.classList.contains('is-connected')) {
    this._find_connections();
  }

  if (this.el.classList.contains('text-color')) {
    this._fix_text_color();
  }
};

DesignToken.prototype._process_ancestors = function (ancestor) {
  const _ancestor_el = document.getElementById(ancestor);
  console.log(_ancestor_el);
  if (_ancestor_el.classList.contains('color')) {
    const _color = _ancestor_el.getAttribute('data-color');

    if (this.el.classList.contains('text-color') && _color !== null) {
      this._set_attribute('data-color', _color);
    }
    if (this.el.classList.contains('color') && _color !== null) {
      const drop = this.el.querySelector('.drop');
      if (drop) {
        drop.style.backgroundColor = _color;
        this._set_attribute('data-color', _color);
      }
    }
  }
  if (_ancestor_el.classList.contains('text-color')) {
    const _text_color = _ancestor_el.getAttribute('data-color');
    this._set_attribute('data-color', _text_color);
    //fixTextColor(token);
  }
  // const _ancestor_el_rect = _ancestor_el.getBoundingClientRect();
  //
  // if (_ancestor_el_rect.left === token.getBoundingClientRect().left) {
  //   token.style['transform-origin'] = 'top left';
  //   token.style.transform = `translate3d( ${16}px, 0,0)`;
  // }
};

DesignToken.prototype._find_connections = function () {
  const _ancestors = this._get_attribute('data-ancestors');
  console.log('_ancestors', _ancestors, this.el);
  if (_ancestors) {
    _ancestors.split(',').forEach(this._process_ancestors.bind(this));
  }
};

const config = {
  line: document.getElementById('path'),
  delay: 0 // enter zero for live resizing
};

const DTF = function () {
  this._tokens = [];
  this._token_els = document.querySelectorAll('.design-token');
  this._init();
};

DTF.prototype._process_tokens = function () {
  this._tokens.forEach(token => {
    // console.log(token);
    token.process();
  });
};

DTF.prototype._clear = function () {
  document.querySelectorAll('path:not(.original)').forEach(el => el.remove());
};

DTF.prototype._setup_tokens = function () {
  if (this._token_els) {
    this._token_els.forEach(token => {
      console.log('adssadsa');
      this._tokens.push(new DesignToken(token));
    });
  }
};

DTF.prototype._init = function () {
  this._setup_tokens();
  console.log(this._tokens);
  this._containerRect = document.querySelector('.container').getBoundingClientRect();
  this._draw_lines();
  this._process_tokens();
  //give resizing time to happen
  var raf;
  window.addEventListener(
    'resize',
    function () {
      // If there's a timer, cancel it
      if (raf) {
        window.cancelAnimationFrame(raf);
      }
      raf = window.requestAnimationFrame(
        function () {
          this._clear();
          this._draw_lines();
        }.bind(this)
      );
    }.bind(this)
  );
};

DTF.prototype._update_all_design_tokens = function () {
  this._tokens.forEach(token => token.update());
};

DTF.prototype._set_connection = function (start_el, stop_el) {
  start_el.classList.add('is-connected');
  stop_el.classList.add('is-connected');

  let _start_descendants = start_el.getAttribute('data-descendants');
  // let _start_ancestors = start_el.getAttribute('data-ancestors');

  // let _stop_descendants = stop_el.getAttribute('data-descendants');
  let _stop_ancestors = stop_el.getAttribute('data-ancestors');

  if (!_start_descendants) {
    start_el.setAttribute('data-descendants', stop_el.id);
  } else {
    const _to_array = _start_descendants.split(',');
    if (!_to_array.includes(stop_el.id)) {
      const _new_descendants = [..._start_descendants.split(','), ...[stop_el.id]].join(',');
      start_el.setAttribute('data-descendants', _new_descendants);
    }
  }

  if (!_stop_ancestors) {
    stop_el.setAttribute('data-ancestors', start_el.id);
  } else {
    const _to_array = _stop_ancestors.split(',');
    if (!_to_array.includes(start_el.id)) {
      const _new_ancestors = [..._stop_ancestors.split(','), ...[start_el.id]].join(',');
      stop_el.setAttribute('data-ancestors', _new_ancestors);
    }
  }
  this._update_all_design_tokens();
};

DTF.prototype._draw_lines = function () {
  this._line(
    config.line,
    document.getElementById('color-fozzieBear'),
    document.getElementById('color-lightBrown-text')
  );
  this._line(config.line, document.getElementById('color-doctor'), document.getElementById('color-lightestBeige-text'));
  this._line(config.line, document.getElementById('color-blackSlug'), document.getElementById('color-brown-text'));
  this._line(
    config.line,
    document.getElementById('color-megamanHelmet'),
    document.getElementById('color-cta-background-color')
  );

  this._line(
    config.line,
    document.getElementById('color-primary-text-color'),
    document.getElementById('primary-button')
  );

  this._line(config.line, document.getElementById('font-family-sans'), document.getElementById('primary-button'));

  this._line(config.line, document.getElementById('font-size-18'), document.getElementById('primary-button'));

  this._line(
    config.line,
    document.getElementById('color-cta-background-color'),
    document.getElementById('color-primary-background-color')
  );
  this._line(
    config.line,
    document.getElementById('color-lightestBeige-text'),
    document.getElementById('color-primary-text-color')
  );
  this._line(
    config.line,
    document.getElementById('color-primary-background-color'),
    document.getElementById('primary-button')
  );

  this._line(config.line, document.getElementById('nine'), document.getElementById('fourteen'));
};

DTF.prototype._get_positions_for_path = function (direction) {
  let _pos1;
  let _pos2;
  switch (direction) {
    case 'north': {
      _pos1 = 'bottom';
      _pos2 = 'top';
      break;
    }
    case 'north-east': {
      _pos1 = 'left';
      _pos2 = 'right';
      break;
    }
    case 'east': {
      _pos1 = 'left';
      _pos2 = 'right';
      break;
    }
    case 'south-east': {
      _pos1 = 'left';
      _pos2 = 'right';
      break;
    }
    case 'south': {
      _pos1 = 'top';
      _pos2 = 'bottom';
      break;
    }
    case 'south-west':
    case 'west':
    case 'north-west':
    default: {
      _pos1 = 'right';
      _pos2 = 'left';
      break;
    }
  }

  return {
    pos1: _pos1,
    pos2: _pos2
  };
};

DTF.prototype._get_path = function (start_el, stop_el) {
  const _direction = cardinal.direction_of_element({ stop: stop_el, start: start_el });

  const { pos1, pos2 } = this._get_positions_for_path(_direction);

  const { x1, y1, x2, y2 } = cardinal.get_coords_pair_from_objects(start_el, stop_el, pos1, pos2);

  const _p0 = { x: x1, y: y1 }; // The first point of line
  const _c0 = { x: x1 + (x2 - x1) / 2, y: y1 }; // Controller for p0
  const _c1 = { x: x1 + (x2 - x1) / 2, y: y2 }; // Controller for p1
  const _p1 = { x: x2, y: y2 }; // The last point of line

  return (
    'M ' + _p0.x + ' ' + _p0.y + 'C ' + _c0.x + ' ' + _c0.y + ', ' + _c1.x + ' ' + _c1.y + ', ' + _p1.x + ' ' + _p1.y
  );
};

DTF.prototype._line = function (path, start_el, stop_el) {
  if (!start_el || !stop_el) return;
  //console.log({path, start_el, stop_el})
  //  const _control_el = document.getElementById('control');
  const _id = uniqueID();
  const _path_el_id = `ph_draw_path-path-${_id}`;
  const _new_path = path.cloneNode(false);
  //  const _new_control_1 = _control_el.cloneNode(false);
  //  const _new_control_2 = _control_el.cloneNode(false);
  _new_path.setAttribute('id', _path_el_id);
  //  _new_control_1.setAttribute('data-for', _path_el_id);
  //  _new_control_2.setAttribute('data-for', _path_el_id);
  //  _new_control_1.classList.remove('original');
  //  _new_control_2.classList.remove('original');
  _new_path.setAttribute('data-start-el', start_el.id);
  _new_path.setAttribute('data-stop-el', stop_el.id);
  _new_path.classList.remove('original');
  this._set_connection(start_el, stop_el);

  path.parentNode.insertBefore(_new_path, path.nextSibling);

  // _control_el.parentNode.insertBefore(_new_control_1, _control_el.nextSibling);
  // _control_el.parentNode.insertBefore(_new_control_2, _control_el.nextSibling);

  const _d = this._get_path(start_el, stop_el);

  _new_path.setAttribute('d', _d); //svg attributes

  //_new_control_1.setAttribute('d','M'+_p0.x+','+(_p0.y)+'L'+_c0.x+','+(_c0.y));
  //_new_control_2.setAttribute('d','M'+_p1.x+','+(_p1.y)+'L'+_c1.x+','+(_c1.y));
};

const draw = new DTF();

setTimeout(function () {
  draw._clear();
  draw._draw_lines();
}, 0);

let raf;

const position_and_draw = () => {
  draw._clear();
  draw._draw_lines();
  setTranslate(currentX, currentY, dragItem);

  raf = null;
};
var dragItem;
var container = document.querySelector('.container');

var currentX;
var currentY;
var initialX;
var initialY;
var xOffset = 0;
var yOffset = 0;

container.addEventListener('pointerdown', userPressed, { passive: true });

function userPressed(e) {
  dragItem = e.target;
  if (dragItem.classList.contains('is-moveable')) {
    container.addEventListener('pointerup', userReleased, { passive: true });
    container.addEventListener('pointercancel', userReleased, { passive: true });
    container.addEventListener('pointermove', userMoved, { passive: true });
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
  }
}

function userReleased(e) {
  container.removeEventListener('pointerup', userReleased, { passive: true });
  container.removeEventListener('pointercancel', userReleased, { passive: true });
  container.removeEventListener('pointermove', userMoved, { passive: true });
  initialX = currentX;
  initialY = currentY;

  if (raf) {
    cancelAnimationFrame(raf);
    raf = null;
  }
  dragItem.classList.remove('is-moving');
}

function userMoved(e) {
  dragItem.classList.add('is-moving');
  if (!raf) {
    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;

    xOffset = currentX;
    yOffset = currentY;
    raf = requestAnimationFrame(position_and_draw);
  }
}

function setTranslate(xPos, yPos, el) {
  el.style.transform = 'translate3d(' + xPos + 'px, ' + yPos + 'px, 0)';
}

const pan = panzoom(document.getElementById('scene'), {
  bounds: true,
  boundsPadding: 0.1,
  maxZoom: 3,
  minZoom: 0.1,
  transformOrigin: { x: 0.5, y: 0.5 },
  beforeWheel: function (e) {
    // allow wheel-zoom only if altKey is down. Otherwise - ignore
    var shouldIgnore = !e.shiftKey;
    return shouldIgnore;
  },
  beforeMouseDown: function (e) {
    // allow mouse-down panning only if altKey is down. Otherwise - ignore
    var shouldIgnore = !e.altKey;
    return shouldIgnore;
  }
});

const zoomLevels = [0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
let currentZoomLevel = zoomLevels[4];
const text = document.querySelector('.zoomValue');

const setText = input => {
  text.textContent = `${input}%`;
};

const zoom = () => {
  const isSmooth = false;
  const scale = currentZoomLevel;
  if (scale) {
    const transform = pan.getTransform();
    const deltaX = transform.x;
    const deltaY = transform.y;
    const offsetX = scale + deltaX;
    const offsetY = scale + deltaY;

    if (isSmooth) {
      pan.smoothZoom(0, 0, scale);
    } else {
      pan.smoothZoomAbs(offsetX, offsetY, scale);
    }
  }
};

const zoomIn = () => {
  const idx = zoomLevels.indexOf(currentZoomLevel);

  // If next element exists
  if (typeof zoomLevels[idx + 1] !== 'undefined') {
    currentZoomLevel = zoomLevels[idx + 1];
  }

  if (currentZoomLevel === 1) {
    pan.moveTo(0, 0);
    pan.smoothZoomAbs(0, 0, 1);
  } else {
    zoom();
  }
  setText(currentZoomLevel * 100);
};

const zoomOut = () => {
  const idx = zoomLevels.indexOf(currentZoomLevel);

  //if previous element exists
  if (typeof zoomLevels[idx - 1] !== 'undefined') {
    currentZoomLevel = zoomLevels[idx - 1];
  }

  if (currentZoomLevel === 1) {
    pan.moveTo(0, 0);
    pan.smoothZoomAbs(0, 0, 1);
  } else {
    zoom();
  }

  setText(currentZoomLevel * 100);
};

function resetZoom() {
  pan.moveTo(0, 0);
  pan.smoothZoomAbs(0, 0, 1);
}
const center_button_el = document.querySelector('.center');
center_button_el.addEventListener('click', resetZoom);

const zoomOut_button_el = document.querySelector('.zoomOut');
zoomOut_button_el.addEventListener('click', zoomOut);

const zoomIn_button_el = document.querySelector('.zoomIn');
zoomIn_button_el.addEventListener('click', zoomIn);
