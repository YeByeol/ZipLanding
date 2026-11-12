import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import * as scene from '../scripts/scene3d.mjs';

test('shared bevel geometry keeps unit bounds and finite normals for scaled buildings', () => {
  assert.equal(typeof scene.createBevelledBox, 'function');
  const geometry = scene.createBevelledBox(THREE);
  geometry.computeBoundingBox();
  for (const axis of ['x', 'y', 'z']) {
    assert.ok(Math.abs(geometry.boundingBox.min[axis] + .5) < .00001);
    assert.ok(Math.abs(geometry.boundingBox.max[axis] - .5) < .00001);
  }
  assert.ok(geometry.attributes.position.count > 36);
  assert.ok([...geometry.attributes.normal.array].every(Number.isFinite));
  assert.ok([...geometry.attributes.normal.array].some(value => Math.abs(value) > .1 && Math.abs(value) < .9));
  geometry.dispose();
});
