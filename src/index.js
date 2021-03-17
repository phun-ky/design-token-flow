/* eslint no-console:0 */
'use strict';

import * as color from './lib/color';
import { uniqueID } from './lib/helpers';

const fixDT = () => {
  document.querySelectorAll('.design-token').forEach(token => {
    if (token.classList.contains('color')) {
      const color = token.getAttribute('data-value') || token.getAttribute('data-color');
      if (color) {
        console.log(color);
        const drop = token.querySelector('.drop');
        if (drop) {
          drop.style.backgroundColor = color;
          token.setAttribute('data-color', color);
        }
      }
    }

    if (token.classList.contains('is-connected')) {
      findConnections(token);
    }

    if (token.classList.contains('text-color')) {
      fixTextColor(token);
    }
  });
};

const fixTextColor = token => {
  const _color = token.getAttribute('data-color');
  if (_color) {
    const _text_el = document.createElement('span');
    _text_el.textContent = 'Aa';
    _text_el.classList.add('text');
    _text_el.style.color = _color;
    token.classList.add(color.light_or_dark(_color));

    token.insertBefore(_text_el, token.firstChild);
  }
  // eElement.insertBefore(newFirstElement, eElement.firstChild);
};

const findConnections = token => {
  const ancestors = token.getAttribute('data-ancestors');
  if (ancestors) {
    ancestors.split(',').forEach(ancestor => {
      const _ancestor_el = document.getElementById(ancestor);

      if (_ancestor_el.classList.contains('color')) {
        const _color = _ancestor_el.getAttribute('data-color') || _ancestor_el.getAttribute('data-value'); // could be 'data-value' or 'data-rgb' also

        if (token.classList.contains('text-color') && _color !== null) {
          token.setAttribute('data-color', _color);
        }
        if (token.classList.contains('color') && _color !== null) {
          const drop = token.querySelector('.drop');
          if (drop) {
            drop.style.backgroundColor = _color;
            token.setAttribute('data-color', _color);
          }
        }
      }
      if (_ancestor_el.classList.contains('text-color')) {
        const _text_color = _ancestor_el.getAttribute('data-color');
        token.setAttribute('data-color', _text_color);
        //fixTextColor(token);
      }
      const _ancestor_el_rect = _ancestor_el.getBoundingClientRect();

      if (_ancestor_el_rect.left === token.getBoundingClientRect().left) {
        token.style['transform-origin'] = 'top left';
        token.style.transform = `translate3d( ${16}px, 0,0)`;
      }
    });
  }
};

const config = {
  line: document.getElementById('path'),
  delay: 0 // enter zero for live resizing
};

const Draw = function () {
  this._init();
};

Draw.prototype._clear = function () {
  document.querySelectorAll('path:not(.original)').forEach(el => el.remove());
};

Draw.prototype._init = function () {
  this._draw_lines();
  fixDT();
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

Draw.prototype._set_connection = function (start_el, stop_el) {
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
};

Draw.prototype._draw_lines = function () {
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

Draw.prototype._line = function (path, start_el, stop_el) {
  if (!start_el || !stop_el) return;
  //console.log({path, start_el, stop_el})
  const _id = uniqueID();
  const _path_el_id = `ph_draw_path-path-${_id}`;
  const _new_path = path.cloneNode(false);
  _new_path.setAttribute('id', _path_el_id);
  _new_path.setAttribute('data-start-el', start_el.id);
  _new_path.setAttribute('data-stop-el', stop_el.id);
  _new_path.classList.remove('original');
  this._set_connection(start_el, stop_el);

  path.parentNode.insertBefore(_new_path, path.nextSibling);
  const _start_el_rect = start_el.getBoundingClientRect();
  const _stop_el_rect = stop_el.getBoundingClientRect();

  const _x1 = _start_el_rect.left + _start_el_rect.width;
  const _y1 = _start_el_rect.top + _start_el_rect.height / 2;
  const _x2 = _stop_el_rect.left;
  const _y2 = _stop_el_rect.top + _stop_el_rect.height / 2;

  const _p0 = { x: _x1, y: _y1 }; // The first point on curve
  const _c0 = { x: _x1 + (_x2 - _x1) / 2, y: _y1 }; // Controller for p0
  const _c1 = { x: _x1 + (_x2 - _x1) / 2, y: _y2 }; // Controller for p1
  const _p1 = { x: _x2, y: _y2 }; // The last point on curve
  //console.dir({c1x: _c1.x, c1y: _c1.y})

  const _d =
    'M ' + _p0.x + ' ' + _p0.y + 'C ' + _c0.x + ' ' + _c0.y + ', ' + _c1.x + ' ' + _c1.y + ', ' + _p1.x + ' ' + _p1.y;
  _new_path.setAttribute('d', _d); //svg attributes
};

const draw = new Draw();

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
