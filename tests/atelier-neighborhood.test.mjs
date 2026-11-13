import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import { buildNeighborhood, neighborhoodSVG } from '../scripts/atelier-neighborhood.mjs';

test('neighborhood fits its map tile and preserves the central residence lot', () => {
  const resources = new Set();
  const context = buildNeighborhood({THREE, remember: value => resources.add(value)});
  const bounds = new THREE.Box3().setFromObject(context.group);
  assert.ok(bounds.min.x >= -2.61 && bounds.max.x <= 2.61);
  assert.ok(bounds.min.z >= -1.91 && bounds.max.z <= 1.91);
  assert.ok(bounds.max.y < 1, 'background architecture stays lower than the main residence');
  let calls = 0, instances = 0;
  const matrix = new THREE.Matrix4();
  const central = new THREE.Box3(new THREE.Vector3(-.86,.06,-.73), new THREE.Vector3(.86,2,.73));
  context.group.traverse(mesh => {
    if (!mesh.isMesh) return;
    calls++;
    assert.ok(resources.has(mesh.geometry) && resources.has(mesh.material));
    mesh.geometry.computeBoundingBox();
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, matrix);
      const partBounds = mesh.geometry.boundingBox.clone().applyMatrix4(matrix);
      assert.ok(!partBounds.intersectsBox(central), `central lot collision in ${mesh.name}, instance ${i}`);
      instances++;
    }
  });
  assert.ok(calls <= 16, 'context detail stays batched into a small material palette');
  assert.equal(context.stats.drawCalls, calls);
  assert.equal(context.stats.instances, instances);
  assert.equal(context.stats.buildings, 6);
});

test('global context fade is reversible and releases depth writing during blending', () => {
  const context = buildNeighborhood({THREE, remember: () => {}});
  for (const amount of [1,.5,0,.25,1]) {
    context.setVisibility(amount);
    assert.equal(context.group.visible, amount > 0);
    context.group.traverse(mesh => {
      if (!mesh.isMesh) return;
      assert.equal(mesh.material.opacity, amount);
      assert.equal(mesh.material.depthWrite, amount === 1);
      assert.equal(mesh.material.transparent, amount !== 1);
      assert.equal(mesh.castShadow, amount === 1 && mesh.userData.contextShadow, 'dissolving context cannot leave solid ghost shadows');
    });
  }
  context.setVisibility(NaN);
  assert.equal(context.group.visible, false);
  context.setVisibility(3);
  assert.equal(context.group.visible, true);
  assert.equal(context.group.children[0].material.opacity, 1);
});

test('all context geometry, materials and instance buffers have explicit disposal ownership', () => {
  const resources = new Set();
  const context = buildNeighborhood({THREE, remember: value => resources.add(value)});
  let disposed = 0;
  for (const mesh of context.group.children) {
    assert.ok(resources.has(mesh), 'the instanced buffers are registered with the scene owner');
    assert.ok(resources.has(mesh.geometry));
    assert.ok(resources.has(mesh.material));
  }
  for (const resource of resources) {
    resource.addEventListener('dispose', () => disposed++);
    resource.dispose();
  }
  assert.equal(disposed, resources.size);
});

test('SVG context uses the same six lots without WebGL or remote assets', () => {
  const svg = neighborhoodSVG({
    point: (x,y,z) => [80*(x-z),40*(x+z)-100*y],
    box: (...args) => `<path data-box="${args.slice(0,6).join(',')}" fill="${args[6]}"/>`,
  });
  assert.equal((svg.match(/data-context-building=/g) ?? []).length, 6);
  assert.match(svg, /atelier-neighborhood-ground/);
  assert.match(svg, /<ellipse/);
  assert.doesNotMatch(svg, /NaN|Infinity|https?:|<script|<text|<pattern|<image/);
});
