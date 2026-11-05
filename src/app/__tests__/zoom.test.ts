import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { fitState, MAX_SCALE, MIN_SCALE, stepScale, wheelFactor, zoomAt } from '../zoom';

describe('zoom', () => {
  it('keeps the point under the pointer in place', () => {
    const state = { scale: 1, x: 100, y: 50 };
    const point = { x: 400, y: 300 };
    const next = zoomAt(state, 2, point);
    // The content point under the pointer, before and after
    const before = { x: (point.x - state.x) / state.scale, y: (point.y - state.y) / state.scale };
    const after = { x: (point.x - next.x) / next.scale, y: (point.y - next.y) / next.scale };

    assert.equal(next.scale, 2);
    assert.deepEqual(after, before);
  });

  it('clamps the scale', () => {
    assert.equal(zoomAt({ scale: 1, x: 0, y: 0 }, 100, { x: 0, y: 0 }).scale, MAX_SCALE);
    assert.equal(zoomAt({ scale: 1, x: 0, y: 0 }, 0, { x: 0, y: 0 }).scale, MIN_SCALE);
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

  it('fits and centers the content', () => {
    const state = fitState({ width: 2000, height: 1000 }, { width: 1064, height: 564 }, 32);

    assert.equal(state.scale, 0.5);
    assert.equal(state.x, 32);
    assert.equal(state.y, 32);
  });
});
