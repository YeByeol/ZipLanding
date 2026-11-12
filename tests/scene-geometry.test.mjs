import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import * as scene from '../scripts/scene3d.mjs';
import { productionDiorama } from './helpers/production-diorama.mjs';

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

test('architectural details stay attached when a selected building lifts', () => {
  const diorama = productionDiorama();
  try {
    const building = diorama.objects[0];
    const details = building.group.children.filter(mesh => mesh.isInstancedMesh && mesh.geometry.type === 'BoxGeometry');
    assert.ok(details.length > 0, 'the real building has instanced architectural details');
    const before = details.map(mesh => new THREE.Box3().setFromObject(mesh));
    building.group.position.y = .08;
    diorama.world.updateMatrixWorld(true);
    details.forEach((mesh, index) => {
      const after = new THREE.Box3().setFromObject(mesh);
      assert.ok(Math.abs(after.min.y - before[index].min.y - .08) < 1e-8);
      assert.ok(Math.abs(after.max.y - before[index].max.y - .08) < 1e-8);
      assert.equal(after.min.x, before[index].min.x);
      assert.equal(after.max.z, before[index].max.z);
    });
  } finally { diorama.dispose(); }
});
