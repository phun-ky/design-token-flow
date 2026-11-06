import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  canvasKeyAction,
  fitState,
  fitWidthState,
  MAX_SCALE,
  MIN_SCALE,
  PAN_STEP,
  PAN_STEP_LARGE,
  stepScale,
  READABLE_SCALE,
  readableStartState,
  wheelAction,
  wheelFactor,
  zoomAt
} from '../zoom';

describe('zoom', () => {
  it('keeps the point under the pointer in place', () => {
    const state = { scale: 1, x: 100, y: 50 };
    const point = { x: 400, y: 300 };
    const next = zoomAt(state, 2, point);
    // The content point under the pointer, before and after
    const before = {
      x: (point.x - state.x) / state.scale,
      y: (point.y - state.y) / state.scale
    };
    const after = {
      x: (point.x - next.x) / next.scale,
      y: (point.y - next.y) / next.scale
    };

    assert.equal(next.scale, 2);
    assert.deepEqual(after, before);
  });

  it('clamps the scale', () => {
    assert.equal(
      zoomAt({ scale: 1, x: 0, y: 0 }, 100, { x: 0, y: 0 }).scale,
      MAX_SCALE
    );
    assert.equal(
      zoomAt({ scale: 1, x: 0, y: 0 }, 0, { x: 0, y: 0 }).scale,
      MIN_SCALE
    );
  });

  it('clamps relative to the 100% scale', () => {
    const state = { scale: 0.5, x: 0, y: 0 };

    // With 100% at 0.5, the limits are 10% and 400% of that
    assert.equal(
      zoomAt(state, 100, { x: 0, y: 0 }, 0.5).scale,
      MAX_SCALE * 0.5
    );
    assert.equal(zoomAt(state, 0, { x: 0, y: 0 }, 0.5).scale, MIN_SCALE * 0.5);
    assert.equal(zoomAt(state, 1, { x: 0, y: 0 }, 0.5).scale, 1);
  });

  it('steps through the zoom levels', () => {
    assert.equal(stepScale(1, 1), 1.1);
    assert.equal(stepScale(1, -1), 0.9);
    assert.equal(stepScale(1.05, 1), 1.1);
    assert.equal(stepScale(1.05, -1), 1);
    assert.equal(stepScale(MAX_SCALE, 1), MAX_SCALE);
    assert.equal(stepScale(MIN_SCALE, -1), MIN_SCALE);
  });

  it('zooms in when scrolling up and out when scrolling down', () => {
    assert.ok(wheelFactor(-100) > 1);
    assert.ok(wheelFactor(100) < 1);
    // A wheel notch in lines (Firefox) zooms about as much as one in pixels
    assert.ok(Math.abs(wheelFactor(3, 1) - wheelFactor(100, 0)) < 0.01);
  });

  it('pans with the wheel, and zooms with Ctrl or Cmd and the wheel', () => {
    const wheel = (event: Partial<WheelEvent>) =>
      wheelAction(
        {
          deltaX: 0,
          deltaY: 0,
          deltaMode: 0,
          shiftKey: false,
          ctrlKey: false,
          metaKey: false,
          ...event
        },
        800
      );

    // Scrolling down moves the view down, so the content moves up
    assert.deepEqual(wheel({ deltaY: 100 }), { type: 'pan', x: -0, y: -100 });
    assert.deepEqual(wheel({ deltaX: 40, deltaY: -20 }), {
      type: 'pan',
      x: -40,
      y: 20
    });
    // Lines and pages in pixels
    assert.deepEqual(wheel({ deltaY: 3, deltaMode: 1 }), {
      type: 'pan',
      x: -0,
      y: -48
    });
    assert.deepEqual(wheel({ deltaY: 1, deltaMode: 2 }), {
      type: 'pan',
      x: -0,
      y: -800
    });
    // Shift sent as vertical still pans sideways
    assert.deepEqual(wheel({ deltaY: 100, shiftKey: true }), {
      type: 'pan',
      x: -100,
      y: -0
    });
    // Ctrl (also a trackpad pinch) and Cmd zoom
    assert.deepEqual(wheel({ deltaY: -100, ctrlKey: true }), {
      type: 'zoom',
      delta: -100
    });
    assert.deepEqual(wheel({ deltaY: 100, metaKey: true }), {
      type: 'zoom',
      delta: 100
    });
  });

  it('opens on the start of the flow when the fitted width is too small to read', () => {
    const start = { x: 40, y: 600, width: 200, height: 24 };

    // A phone: the fitted width would be 0.25
    assert.deepEqual(
      readableStartState(
        { width: 1560, height: 3000 },
        { width: 390, height: 700 },
        start
      ),
      { scale: READABLE_SCALE, x: 16 - 40, y: 350 - 612 }
    );
    // No further in than 400% of the fitted width (0.15 here)
    assert.equal(
      readableStartState(
        { width: 2600, height: 3000 },
        { width: 390, height: 700 },
        start
      )?.scale,
      0.6
    );
    // Wide enough to read at 100%
    assert.equal(
      readableStartState(
        { width: 1560, height: 3000 },
        { width: 1440, height: 800 },
        start
      ),
      null
    );
  });

  it('fills the width of the viewport at 100%, top aligned', () => {
    assert.deepEqual(
      fitWidthState(
        { width: 2000, height: 3000 },
        { width: 1000, height: 600 }
      ),
      { scale: 0.5, x: 0, y: 0 }
    );
  });

  it("doesn't enlarge content narrower than the viewport", () => {
    assert.deepEqual(
      fitWidthState({ width: 800, height: 300 }, { width: 1000, height: 600 }),
      { scale: 1, x: 100, y: 0 }
    );
    assert.deepEqual(
      fitWidthState({ width: 0, height: 0 }, { width: 1000, height: 600 }),
      { scale: 1, x: 0, y: 0 }
    );
  });

  it('fits and centers the content', () => {
    const state = fitState(
      { width: 2000, height: 1000 },
      { width: 1064, height: 564 },
      32
    );

    assert.equal(state.scale, 0.5);
    assert.equal(state.x, 32);
    assert.equal(state.y, 32);
  });

  it('pans with the arrow keys, further with Shift', () => {
    const key = (k: string, shiftKey = false) =>
      canvasKeyAction({
        key: k,
        shiftKey,
        ctrlKey: false,
        metaKey: false,
        altKey: false
      });

    // The view moves the arrow's way, so the content moves the other way
    assert.deepEqual(key('ArrowLeft'), { type: 'pan', x: PAN_STEP, y: 0 });
    assert.deepEqual(key('ArrowRight'), { type: 'pan', x: -PAN_STEP, y: 0 });
    assert.deepEqual(key('ArrowUp'), { type: 'pan', x: 0, y: PAN_STEP });
    assert.deepEqual(key('ArrowDown', true), {
      type: 'pan',
      x: 0,
      y: -PAN_STEP_LARGE
    });
  });

  it('zooms with +, = and -, resets with 0 and fits with F', () => {
    const type = (key: string, shiftKey = false) =>
      canvasKeyAction({
        key,
        shiftKey,
        ctrlKey: false,
        metaKey: false,
        altKey: false
      })?.type;

    assert.deepEqual(
      ['+', '=', '-', '0', 'f', 'F'].map((key) => type(key)),
      ['zoomIn', 'zoomIn', 'zoomOut', 'reset', 'fit', 'fit']
    );
    // Shift + = types + on most layouts, which still zooms in
    assert.equal(type('+', true), 'zoomIn');
    assert.equal(type('x'), undefined);
    assert.equal(type('Enter'), undefined);
    // Not own properties of the key maps
    assert.equal(type('toString'), undefined);
    assert.equal(type('constructor'), undefined);
  });

  it('leaves keys with Ctrl, Cmd or Alt to the browser', () => {
    const base = {
      key: '+',
      shiftKey: false,
      ctrlKey: false,
      metaKey: false,
      altKey: false
    };

    assert.equal(canvasKeyAction({ ...base, ctrlKey: true }), null);
    assert.equal(canvasKeyAction({ ...base, metaKey: true }), null);
    assert.equal(
      canvasKeyAction({ ...base, key: 'ArrowLeft', altKey: true }),
      null
    );
  });
});
