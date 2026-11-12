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

test('named views fit the city or focus the requested building without mutating its data', () => {
  const building = { x: 5, y: 3, height: 64 };
  assert.equal(typeof model.cameraPreset, 'function');
  const overview = model.cameraPreset('overview');
  const plan = model.cameraPreset('plan');
  assert.deepEqual(overview.view, model.DEFAULT_VIEW);
  assert.ok(plan.view.pitch > overview.view.pitch);
  const focus = model.cameraPreset('focus', building);
  assert.ok(focus.zoom > overview.zoom && focus.zoom <= 1.6);
  assert.deepEqual({ x: focus.target.x, z: focus.target.z }, model.buildingPosition(building));
  assert.ok(focus.target.y > .28);
  assert.deepEqual(building, { x: 5, y: 3, height: 64 });
  assert.equal(model.cameraPreset('unknown'), null);
  assert.equal(model.cameraPreset('focus'), null);
});


test('eight film camera poses hold and transition smoothly with separate A and X targets', () => {
  const poses=[[1.05,.72,.68],[1.2,.68,.70],[2.6,.62,.80],[1.05,.72,.76],[1,.62,.72],[1.05,.56,.92],[1.9,.62,.80],[1.05,.72,.68]];
  const frames=poses.map((_,i)=>model.presentationForProgress(i/7));
  poses.forEach(([zoom,yaw,pitch],i)=>{assert.equal(frames[i].zoom,zoom);assert.equal(frames[i].yaw,yaw);assert.equal(frames[i].pitch,pitch);});
  assert.ok(Math.abs(frames[2].target.x+2.975)<1e-12);assert.ok(Math.abs(frames[6].target.x-2.975)<1e-12);
  assert.notDeepEqual(frames[2].target,frames[6].target,'A and X each retain their own camera target');
  for(let i=0;i<7;i++){
    const boundary=(i+.5)/7, before=model.presentationForProgress(boundary-1e-7),after=model.presentationForProgress(boundary+1e-7);
    assert.ok(Math.abs(before.zoom-after.zoom)<.0001);
    const held=model.presentationForProgress(i/7+.005);assert.deepEqual(held,frames[i]);
  }
  assert.deepEqual(model.presentationForProgress(1),frames[0]);
});

test('cinematic camera rejects invalid progress and data and reduced motion stays wide', () => {
  assert.equal(typeof model.presentationForProgress, 'function');
  const wide = { yaw: .72, pitch: .68, zoom: 1.05, target: { x: 0, y: .28, z: 0 } };
  for (const progress of [-1, NaN, Infinity, undefined]) assert.deepEqual(model.presentationForProgress(progress), wide);
  for (const progress of [0, .3, .7, 1]) assert.deepEqual(model.presentationForProgress(progress, { x: 5, y: 3, height: 64 }, { reduced: true }), wide);
  for (const building of [undefined, null, {}, { x: NaN, y: Infinity, height: -10 }]) {
    const frame = model.presentationForProgress(.3, building);
    assert.ok([frame.yaw, frame.pitch, frame.zoom, ...Object.values(frame.target)].every(Number.isFinite));
  }
  assert.equal(model.presentationForProgress(10).pitch, .68);
});

test('presentation trust boundary bounds cinematic zoom and city target without changing interactive zoom', () => {
  assert.equal(typeof model.clampPresentation, 'function');
  const input = Object.freeze({ yaw: NaN, pitch: 8, zoom: 100, target: Object.freeze({ x: 999, y: -8, z: -999 }) });
  assert.deepEqual(model.clampPresentation(input), { yaw: .72, pitch: 1.12, zoom: 4.8, target: { x: 4.4, y: 0, z: -3.25 } });
  const invalid = model.clampPresentation({ zoom: NaN, target: { x: Infinity, y: NaN } });
  assert.deepEqual(invalid.target, { x: 0, y: .28, z: 0 });
  assert.equal(invalid.zoom, 1);
  assert.equal(model.clampPresentation({ zoom: .1 }).zoom, .7);
  assert.equal(model.clampZoom(4.2), 1.6);
});
