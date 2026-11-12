import test from 'node:test';
import assert from 'node:assert/strict';

import * as model from '../scripts/scene-model.mjs';

test('camera pitch stays above the horizon and below the overhead limit', () => {
  assert.equal(typeof model.clampView, 'function');
  assert.deepEqual(model.clampView({ yaw: 20, pitch: -5 }), { yaw: 20, pitch: .38 });
  assert.equal(model.clampView({ yaw: -20, pitch: 5 }).pitch, 1.12);
  assert.ok(Number.isFinite(model.clampView({ yaw: NaN, pitch: Infinity }).yaw));
});

test('scroll progress is bounded and cannot replace manual or reduced-motion views', () => {
  assert.equal(typeof model.viewForProgress, 'function');
  const current = { yaw: 1.8, pitch: .9 };
  assert.deepEqual(model.viewForProgress(1, current, { manual: true }), current);
  assert.deepEqual(model.viewForProgress(1, current, { reducedMotion: true }), current);
  assert.deepEqual(model.viewForProgress(-10), model.viewForProgress(0));
  assert.deepEqual(model.viewForProgress(10), model.viewForProgress(1));
  assert.notDeepEqual(model.viewForProgress(0), model.viewForProgress(1));
  assert.equal(model.clampProgress(NaN), 0);
});

test('touch rotation waits for horizontal intent while vertical swipes keep scrolling', () => {
  assert.equal(typeof model.dragIntent, 'function');
  assert.equal(model.dragIntent(3, 2, 'touch'), 'pending');
  assert.equal(model.dragIntent(3, 15, 'touch'), 'scroll');
  assert.equal(model.dragIntent(15, 3, 'touch'), 'rotate');
  assert.equal(model.dragIntent(10, 10, 'touch'), 'pending');
  assert.equal(model.dragIntent(2, 12, 'mouse'), 'rotate');
  assert.equal(model.isClick(3, 3), true);
  assert.equal(model.isClick(6, 0), false);
  assert.equal(model.isClick(0, 12), false);
});

test('button zoom remains bounded and invalid input keeps a usable default', () => {
  assert.equal(typeof model.clampZoom, 'function');
  assert.equal(model.clampZoom(.1), .75);
  assert.equal(model.clampZoom(3), 1.6);
  assert.equal(model.clampZoom(1.15), 1.15);
  assert.equal(model.clampZoom(NaN), 1);
});
