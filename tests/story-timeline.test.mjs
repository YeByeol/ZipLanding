import test from 'node:test';
import assert from 'node:assert/strict';
import * as city from '../scripts/city.mjs';
const timelineModule = await import('../scripts/story-timeline.mjs').catch(() => ({}));

test('one timeline holds each reading pose and uses smooth, history-free transitions', () => {
  assert.equal(typeof timelineModule.storyTimeline, 'function');
  const { storyTimeline, PHASES } = timelineModule;
  for (const [index, p] of [0, 1/7, 2/7, 3/7, 4/7, 5/7, 6/7, 1].entries()) {
    const frame = storyTimeline(p);
    assert.equal(frame.from, PHASES[index]); assert.equal(frame.to, PHASES[index]);
    assert.deepEqual(frame.opacities, PHASES.map((_, i) => +(i === index)));
  }
  for (const boundary of Array.from({length:7},(_,i)=>(i+.5)/7)) {
    for (const p of [boundary - timelineModule.TRANSITION_WINDOW, boundary, boundary + timelineModule.TRANSITION_WINDOW]) {
      const forward = storyTimeline(p, 'discover'), reverse = storyTimeline(p, 'closing');
      const physical = ({ phase, ...rest }) => rest;
      assert.deepEqual(physical(forward), physical(reverse));
    }
    const center = storyTimeline(boundary);
    assert.ok(Math.abs(center.blend - .5) < 1e-12);
    assert.deepEqual(center.opacities, Array(8).fill(0), 'quiet middle keeps the city visible without overlapping titles');
    const epsilon = 1e-6;
    for (const edge of [boundary - timelineModule.TRANSITION_WINDOW, boundary + timelineModule.TRANSITION_WINDOW]) {
      const speed = Math.abs(storyTimeline(edge + epsilon).blend - storyTimeline(edge - epsilon).blend) / (2 * epsilon);
      // Adjacent holds use blend 0; compare the interpolated phase coordinate instead.
      const coordinate = p => { const f = storyTimeline(p); return PHASES.indexOf(f.from) + (PHASES.indexOf(f.to) - PHASES.indexOf(f.from)) * f.blend; };
      assert.ok(Math.abs(coordinate(edge + epsilon) - coordinate(edge - epsilon)) / (2 * epsilon) < .001);
      assert.ok(Number.isFinite(speed));
      const h = 1e-6;
      const acceleration = Math.abs(coordinate(edge + h) - 2 * coordinate(edge) + coordinate(edge - h)) / h ** 2;
      assert.ok(acceleration < .1, 'transition acceleration reaches zero beside each hold');
    }
  }
});

test('logical phase alone has hysteresis, supports seeks, and reduced motion has one readable panel', () => {
  assert.equal(typeof timelineModule.storyTimeline, 'function');
  const { storyTimeline } = timelineModule;
  let phase = 'discover'; const boundary=.5/7;
  for (const p of [boundary+.001,boundary-.001,boundary+.002]) {phase=storyTimeline(p,phase).phase;assert.equal(phase,'discover');}
  phase=storyTimeline(boundary+.007,phase).phase;assert.equal(phase,'price');
  assert.equal(storyTimeline(boundary-.001,phase).phase,'price');
  assert.equal(storyTimeline(1,phase).phase,'closing');
  assert.equal(storyTimeline(0,'closing').phase,'discover');
  const reduced=storyTimeline(3/7,'criteria',{reduced:true});
  assert.equal(reduced.from,'criteria'); assert.equal(reduced.to,'criteria');
  assert.deepEqual(reduced.opacities,[0,0,0,1,0,0,0,0]);
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
  for (const boundary of Array.from({length:7},(_,i)=>(i+.5)/7)) for (let power = 3; power < 16; power++) {
    const p = boundary - timelineModule.TRANSITION_WINDOW + .45 * (1 - 10 ** -power) * (2 * timelineModule.TRANSITION_WINDOW);
    const frame = storyTimeline(p);
    assert.ok(frame.opacities.every(value => value >= 0 && value <= 1));
    assert.ok(frame.blend >= 0 && frame.blend <= 1);
  }
});

test('large camera transitions use the wider shared progress window before each reading hold',()=>{
 const frame=timelineModule.storyTimeline(.5/7+.04);
 assert.equal(frame.from,'discover');assert.equal(frame.to,'price');assert.ok(frame.blend<1&&frame.blend>0);
});
