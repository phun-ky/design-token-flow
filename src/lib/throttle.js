/* eslint no-console:0 */
'use strict';
const throttle = function (callback) {
  let running = false;
  return function () {
    if (running) {
      return;
    }
    running = true;
    requestAnimationFrame(function () {
      callback();
      running = false;
    });
  };
};

export default throttle;
