import test from 'node:test';
import assert from 'node:assert/strict';
import { mountScene3D } from '../scripts/scene3d.mjs';

// Keep the real owner and SVG builder; browser surfaces defer GPU initialization.
function element() {
  return { dataset: {}, style: {}, append() {}, remove() {}, setAttribute() {}, addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [] };
}

test('presentation belongs only to the noninteractive owner and respects its manual view', () => {
  const saved = Object.fromEntries(['window', 'document', 'IntersectionObserver'].map(key => [key, globalThis[key]]));
  globalThis.IntersectionObserver = class { observe() {} disconnect() {} };
  globalThis.window = { IntersectionObserver: globalThis.IntersectionObserver, matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }) };
  globalThis.document = { createElement: element, addEventListener() {}, removeEventListener() {} };
  const svg = element();
  const container = () => ({ ...element(), querySelector: () => svg });
  const heroNode = container(), experienceNode = container();
  let hero, experience;
  try {
    hero = mountScene3D(heroNode);
    experience = mountScene3D(experienceNode, { interactive: true });
    assert.equal(typeof hero.setPresentation, 'function');
    hero.setPresentation({ yaw: .5, pitch: .86, zoom: 4.2, target: { x: -3, y: .5, z: -2 } });
    assert.equal(heroNode.dataset.viewPreset, 'story');
    assert.equal(heroNode.dataset.viewZoom, '1', 'reduced motion keeps the wide camera');
    assert.equal(heroNode.dataset.targetX, '0.0000');
    assert.equal(heroNode.dataset.manualView, 'false');
    experience.setPreset('plan');
    const manual = { ...experienceNode.dataset };
    experience.setPresentation({ zoom: 4.2 });
    assert.deepEqual(experienceNode.dataset, manual, 'story frames never replace experience controls');
    hero.rotate(.3);
    const heroManual = { ...heroNode.dataset };
    hero.setPresentation({ yaw: .2, zoom: 3 });
    assert.deepEqual(heroNode.dataset, heroManual, 'manual camera ownership survives presentation calls');
  } finally {
    hero?.destroy(); experience?.destroy();
    for (const [key, value] of Object.entries(saved)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; }
  }
});

test('story frames publish exact camera coordinates before GPU initialization without a tracking loop', () => {
  const saved = Object.fromEntries(['window', 'document', 'IntersectionObserver'].map(key => [key, globalThis[key]]));
  globalThis.IntersectionObserver = class { observe() {} disconnect() {} };
  globalThis.window = { IntersectionObserver: globalThis.IntersectionObserver, matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) };
  globalThis.document = { createElement: element, addEventListener() {}, removeEventListener() {} };
  const svg = element(), container = { ...element(), querySelector: () => svg };
  let owner;
  try {
    owner = mountScene3D(container);
    owner.setPresentation({ yaw: .62, pitch: .80, zoom: 3.2, target: { x: -3, y: .5, z: -2 }, colorBlend: { from: 'price', to: 'terrain', mix: .5 } });
    assert.equal(container.dataset.viewZoom, '3.2');
    assert.equal(container.dataset.viewYaw, '0.6200');
    assert.equal(container.dataset.targetX, '-3.0000');
    owner.setPresentation({ yaw: .56, pitch: .92, zoom: 1.05, target: { x: 0, y: .28, z: 0 }, colorBlend: { from: 'price', to: 'price', mix: 0 } });
    assert.equal(container.dataset.viewZoom, '1.05', 'fast seeks apply the requested frame directly');
  } finally {
    owner?.destroy();
    for (const [key, value] of Object.entries(saved)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; }
  }
});
