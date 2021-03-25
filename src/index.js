/* eslint no-console:0 */
'use strict';

import panzoom from 'panzoom';
import { uniqueID } from './lib/helpers';
import * as cardinal from './lib/cardinal';
import * as node from './lib/node';

import DesignToken from './design-token';

import tokens from './tokens.json';

// console.log(tokens);

const DTF = function (raw_tokens) {
  this._raw_tokens = raw_tokens;
  this._tokens = [];
  this._init();
};

DTF.prototype._process_tokens = function () {
  this._tokens.forEach(token => {
    // console.log(token);
    token.process();
  });
};

DTF.prototype._clear_lines = function () {
  document.querySelectorAll('path:not(.original)').forEach(el => el.remove());
};

DTF.prototype._setup_tokens = function () {
  if (this._raw_tokens) {
    const _tokens_array = [];
    const _grouped_tokens = {};
    Object.keys(this._raw_tokens).forEach(token => {
      _tokens_array.push(this._raw_tokens[token]);

      // const _design_token = new DesignToken(this._raw_tokens[token]);
      // document.querySelector('.container .base').appendChild(_design_token.el);
      // this._tokens.push(_design_token);
    });

    _tokens_array.forEach(token => {
      const { category, type, item } = token;
      const _group_name = item == 'button' ? `${category}-${type}-${item}` : `${category}-${type}`;
      if (!_grouped_tokens[_group_name]) {
        _grouped_tokens[_group_name] = [];
      }
      _grouped_tokens[_group_name].push(token);
    });

    console.log(_grouped_tokens);

    let _custom_grouping_ordering = [
      ['color-base'],
      ['color-accent', 'color-background', 'color-text', 'color-infographic', 'color-interaction', 'color-status'],
      ['color-cta'],
      ['color-background-button'],
      ['size-font', 'size-line-height', 'font-weight'],
      ['font-family', 'size-spacing']
    ];

    const _customized_grouping = [];

    _custom_grouping_ordering.forEach((custom_group, i) => {
      custom_group.forEach(group => {
        if (!_customized_grouping[i]) {
          _customized_grouping[i] = [];
        }
        // console.log(group);
        _grouped_tokens[group].forEach(token => _customized_grouping[i].push(token));
      });
    });

    _customized_grouping.forEach(group => {
      const _base = node.create({ type: 'div', classNames: `base ${group}` });
      group.forEach(token => {
        const _design_token = new DesignToken(token);
        _base.appendChild(_design_token.el);
        this._tokens.push(_design_token);
      });
      this._container_el.appendChild(_base);
    });
  }
};

DTF.prototype._init = function () {
  this._container_el = document.querySelector('.container');
  // this._container_rect = document.querySelector('.container').getBoundingClientRect();
  this._setup_tokens();
  this._connect_tokens();
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
          this._clear_lines();
          this._connect_tokens();
        }.bind(this)
      );
    }.bind(this)
  );
};

DTF.prototype._connect_tokens = function () {
  const _original_path_el = document.getElementById('path');

  this._tokens.forEach(token => {
    if (token.ancestors && token.ancestors.length !== 0) {
      token.ancestors.split(',').forEach(ancestor => {
        const _start_token = this._tokens.find(token => token.id === ancestor);
        const _stop_token = token;
        this._line(_original_path_el, _start_token, _stop_token);
        this._check_relation(_start_token, _stop_token);
      });
    }
  });
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

DTF.prototype._line = function (path, start_token, stop_token) {
  if (!start_token || !stop_token) return;

  const _start_el = start_token.el;
  const _stop_el = stop_token.el;
  const _id = uniqueID();
  const _path_el_id = `ph_draw_path-path-${_id}`;
  const _new_path = path.cloneNode(false);
  _new_path.setAttribute('id', _path_el_id);

  _new_path.setAttribute('data-start-el', _start_el.id);
  _new_path.setAttribute('data-stop-el', _stop_el.id);
  _new_path.classList.remove('original');
  _start_el.classList.add('is-connected');
  _stop_el.classList.add('is-connected');
  path.parentNode.insertBefore(_new_path, path.nextSibling);

  const _d = this._get_path(_start_el, _stop_el);

  _new_path.setAttribute('d', _d); //svg attributes

  //  const _new_control_1 = _control_el.cloneNode(false);
  //  const _control_el = document.getElementById('control');
  //  const _new_control_2 = _control_el.cloneNode(false);
  //  _new_control_1.setAttribute('data-for', _path_el_id);
  //  _new_control_2.setAttribute('data-for', _path_el_id);
  //  _new_control_1.classList.remove('original');
  //  _new_control_2.classList.remove('original');
  // _control_el.parentNode.insertBefore(_new_control_1, _control_el.nextSibling);
  // _control_el.parentNode.insertBefore(_new_control_2, _control_el.nextSibling);

  //_new_control_1.setAttribute('d','M'+_p0.x+','+(_p0.y)+'L'+_c0.x+','+(_c0.y));
  //_new_control_2.setAttribute('d','M'+_p1.x+','+(_p1.y)+'L'+_c1.x+','+(_c1.y));
};

DTF.prototype._check_relation = function (start_token, stop_token) {
  if (!start_token || !stop_token) return;
  let _start_descendants = start_token._get('descendants');
  let _stop_ancestors = stop_token._get('ancestors');

  if (
    !_start_descendants ||
    (_start_descendants && _start_descendants.length === 0) ||
    (_start_descendants && _start_descendants === '')
  ) {
    start_token._set('descendants', stop_token.id);
  } else {
    const _to_array = _start_descendants.split(',');
    if (!_to_array.includes(stop_token.id)) {
      const _new_descendants = [..._start_descendants.split(','), ...[stop_token.id]].join(',');
      start_token._set('descendants', _new_descendants);
    }
  }

  if (
    !_stop_ancestors ||
    (_stop_ancestors && _stop_ancestors.length === 0) ||
    (_stop_ancestors && _stop_ancestors === '')
  ) {
    stop_token._set('ancestors', start_token.id);
  } else {
    const _to_array = _stop_ancestors.split(',');
    if (!_to_array.includes(start_token.id)) {
      const _new_ancestors = [..._stop_ancestors.split(','), ...[start_token.id]].join(',');
      stop_token._set('ancestors', _new_ancestors);
    }
  }
};

const draw = new DTF(tokens);

requestAnimationFrame(function () {
  draw._clear_lines();
  draw._connect_tokens();
});

let raf;

const position_and_draw = () => {
  draw._clear_lines();
  draw._connect_tokens();
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

function userReleased() {
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
      pan.zoom(0, 0, scale);
    } else {
      pan.zoomAbs(offsetX, offsetY, scale);
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
    pan.zoomAbs(0, 0, 1);
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
    pan.zoomAbs(0, 0, 1);
  } else {
    zoom();
  }

  setText(currentZoomLevel * 100);
};

function resetZoom() {
  pan.moveTo(0, 0);
  pan.zoomAbs(0, 0, 1);
}
const center_button_el = document.querySelector('.center');
center_button_el.addEventListener('click', resetZoom);

const zoomOut_button_el = document.querySelector('.zoomOut');
zoomOut_button_el.addEventListener('click', zoomOut);

const zoomIn_button_el = document.querySelector('.zoomIn');
zoomIn_button_el.addEventListener('click', zoomIn);
