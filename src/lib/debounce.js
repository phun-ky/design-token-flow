'use strict';
export const debounce = function (fn) {
  var queued;
  return function (...args) {
    if (queued) cancelAnimationFrame(queued);

    queued = requestAnimationFrame(fn.bind(fn, ...args));
  };
};

// https://stackoverflow.com/a/9614122/460422
export const angle = (cx, cy, ex, ey) => {
  var dy = ey - cy;
  var dx = ex - cx;
  var theta = Math.atan2(dy, dx); // range (-PI, PI]
  theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
  //if (theta < 0) theta = 360 + theta; // range [0, 360)
  return theta;
};
