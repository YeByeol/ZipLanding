import test from 'node:test';
import assert from 'node:assert/strict';
import * as city from '../scripts/city.mjs';
const timelineModule = await import('../scripts/story-timeline.mjs').catch(() => ({}));

test('one timeline holds each reading pose and uses smooth, history-free transitions', () => {
  assert.equal(typeof timelineModule.storyTimeline, 'function');
  const { storyTimeline, PHASES } = timelineModule;
  for (const [index, p] of [0, .3, .65, 1].entries()) {
    const frame = storyTimeline(p);
    assert.equal(frame.from, PHASES[index]); assert.equal(frame.to, PHASES[index]);
    assert.deepEqual(frame.opacities, PHASES.map((_, i) => +(i === index)));
  }
  for (const boundary of [1 / 6, .5, 5 / 6]) {
    for (const p of [boundary - .06, boundary, boundary + .06]) {
      const forward = storyTimeline(p, 'price'), reverse = storyTimeline(p, 'value');
      const physical = ({ phase, ...rest }) => rest;
      assert.deepEqual(physical(forward), physical(reverse));
    }
    const center = storyTimeline(boundary);
    assert.ok(Math.abs(center.blend - .5) < 1e-12);
    assert.deepEqual(center.opacities, [0, 0, 0, 0], 'quiet middle keeps the city visible without overlapping titles');
    const epsilon = 1e-6;
    for (const edge of [boundary - .06, boundary + .06]) {
      const speed = Math.abs(storyTimeline(edge + epsilon).blend - storyTimeline(edge - epsilon).blend) / (2 * epsilon);
      // Adjacent holds use blend 0; compare the interpolated phase coordinate instead.
      const coordinate = p => { const f = storyTimeline(p); return PHASES.indexOf(f.from) + (PHASES.indexOf(f.to) - PHASES.indexOf(f.from)) * f.blend; };
      assert.ok(Math.abs(coordinate(edge + epsilon) - coordinate(edge - epsilon)) / (2 * epsilon) < .001);
      assert.ok(Number.isFinite(speed));
      const h = 1e-5;
      const acceleration = Math.abs(coordinate(edge + h) - 2 * coordinate(edge) + coordinate(edge - h)) / h ** 2;
      assert.ok(acceleration < .1, 'transition acceleration reaches zero beside each hold');
    }
  }
});

test('logical phase alone has hysteresis, supports seeks, and reduced motion has one readable panel', () => {
  assert.equal(typeof timelineModule.storyTimeline, 'function');
  const { storyTimeline } = timelineModule;
  let phase = 'price';
  for (const p of [1/6 + .001, 1/6 - .001, 1/6 + .002]) { phase = storyTimeline(p, phase).phase; assert.equal(phase, 'price'); }
  phase = storyTimeline(1/6 + .013, phase).phase; assert.equal(phase, 'conditions');
  assert.equal(storyTimeline(1/6 - .001, phase).phase, 'conditions');
  assert.equal(storyTimeline(1, phase).phase, 'value');
  assert.equal(storyTimeline(0, 'value').phase, 'price');
  const reduced = storyTimeline(.5, 'criteria', { reduced: true });
  assert.equal(reduced.from, 'criteria'); assert.equal(reduced.to, 'criteria');
  assert.deepEqual(reduced.opacities, [0, 0, 1, 0]);
});

test('shared RGB transition blends endpoints and missingness independently of blended gray', () => {
  assert.equal(typeof city.colorFrameForTransition, 'function');
  assert.equal(typeof city.mixColor, 'function');
  const building = { id: 'x', slope: null, elevation: null, year: null, rent: 10, deposit: 0, area: 20 };
  const frame = city.colorFrameForTransition(building, [building], { from: 'price', to: 'terrain', mix: .5 });
  assert.equal(frame.missing, .5);
  assert.equal(frame.color, city.mixColor(city.colorFor(building, [building], 'price'), '#d9d6cf', .5));
  assert.equal(city.mixColor('#000000', '#ffffff', .5), '#808080');
});

test('floating point fade endpoints remain bounded so zero-opacity panels can be hidden', () => {
  const { storyTimeline } = timelineModule;
  for (const boundary of [1/6, .5, 5/6]) for (let power = 3; power < 16; power++) {
    const p = boundary - .06 + .45 * (1 - 10 ** -power) * .12;
    const frame = storyTimeline(p);
    assert.ok(frame.opacities.every(value => value >= 0 && value <= 1));
    assert.ok(frame.blend >= 0 && frame.blend <= 1);
  }
});
