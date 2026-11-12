import test from 'node:test';
import assert from 'node:assert/strict';
import { storyPhaseForSteps, mountStory } from '../scripts/story.mjs';
import { BUILDINGS, scoreBuilding, comparisonFor } from '../scripts/demo.mjs';
import { PALETTES } from '../scripts/city.mjs';

const positions = tops => tops.map(top => ({ top }));

test('story phases follow the midline forward and backward, including boundaries', () => {
  for (const [tops, expected] of [
    [[500, 1300, 2100, 2900], 'price'], [[400, 1200, 2000, 2800], 'price'],
    [[-400, 400, 1200, 2000], 'conditions'], [[-1200, -400, 400, 1200], 'criteria'],
    [[-2000, -1200, -400, 400], 'value'], [[-1200, -400, 400, 1200], 'criteria'],
    [[-400, 400, 1200, 2000], 'conditions'], [[400, 1200, 2000, 2800], 'price'],
  ]) assert.equal(storyPhaseForSteps(positions(tops), 800).phase, expected);
  assert.equal(storyPhaseForSteps(positions([0, 800, 1600, 2400]), 800).progress, 0);
  assert.equal(storyPhaseForSteps(positions([-800, 0, 800, 1600]), 800).progress, 1 / 3);
  assert.equal(storyPhaseForSteps(positions([-2800, -2000, -1200, -400]), 800).progress, 1);
});

test('story geometry rejects incomplete, non-finite or unordered steps and invalid viewports', () => {
  for (const rects of [undefined, [], new Array(4), positions([0, 1, 2]), positions([0, 2, 1, 3]), positions([0, 0, 0, 0]), positions([0, NaN, 2, 3]), positions([0, Infinity, 2, 3])]) {
    assert.deepEqual(storyPhaseForSteps(rects, 800), { phase: 'price', progress: 0 });
  }
  for (const viewport of [undefined, 0, -1, NaN, Infinity]) assert.deepEqual(storyPhaseForSteps(positions([0, 800, 1600, 2400]), viewport), { phase: 'price', progress: 0 });
});

function node(dataset = {}) {
  const attributes = new Map();
  return { dataset, style: {}, hidden: false, textContent: '',
    setAttribute: (key, value) => attributes.set(key, String(value)),
    getAttribute: key => attributes.get(key) ?? null,
    removeAttribute: key => attributes.delete(key),
  };
}

function fixture() {
  let tops = [0, 800, 1600, 2400];
  let lowHeight = false;
  let bounds = { top: 0, bottom: 3600 };
  const phases = ['price', 'conditions', 'criteria', 'value'];
  const steps = phases.map((phase, index) => ({ ...node({ storyStep: phase }), getBoundingClientRect: () => ({ top: tops[index] }) }));
  const panels = phases.map(phase => node({ storyPanel: phase }));
  const links = phases.map(phase => node({ storyLink: phase }));
  const fields = ['place', 'id', 'rent', 'deposit', 'area', 'slope', 'elevation', 'year', 'score', 'peer-count', 'unit', 'peers', 'score'].map(field => node({ storyField: field }));
  const units = ['slope', 'elevation', 'year', 'score', 'score'].map(key => node({ storyUnit: key }));
  const swatches = Array.from({ length: 5 }, () => node());
  const caption = node(), selection = node(), legend = { ...node(), querySelectorAll: () => swatches };
  const root = { ...node(), getBoundingClientRect: () => bounds, ownerDocument: { defaultView: { innerHeight: 800, matchMedia: query => ({ get matches() { return query === '(max-height: 620px)' && lowHeight; } }) } },
    querySelectorAll: selector => ({ '[data-story-step]': steps, '[data-story-panel]': panels, '[data-story-link]': links, '[data-story-field]': fields, '[data-story-unit]': units }[selector] ?? []),
    querySelector: selector => ({ '#story-caption': caption, '#story-legend': legend, '#hero-selection': selection }[selector]),
  };
  const element = node(), sceneStates = [], progress = [];
  const controller = mountStory({ root, element, owner: { update: state => sceneStates.push(state), setPresentation: value => progress.push(value) } });
  return { controller, root, element, panels, links, fields, units, swatches, caption, selection, sceneStates, progress, setTops: value => { tops = value; }, setBounds: value => { bounds = value; }, setLowHeight: value => { lowHeight = value; } };
}

test('story controller changes only its view, shares computed fields, and suppresses idle updates', () => {
  const view = fixture();
  const state = Object.freeze({ mode: 'value', selected: 'b', saved: Object.freeze([]), weights: Object.freeze({ slope: 50, elevation: 50, age: 50 }) });
  const original = JSON.stringify(state);
  view.controller.update(state);
  view.controller.updateScroll({ reduced: false });
  assert.equal(view.sceneStates.at(-1).mode, 'price');
  assert.equal(view.sceneStates.at(-1).selected, 'b');
  assert.deepEqual(view.sceneStates.at(-1).saved, []);
  const building = BUILDINGS.find(item => item.id === 'b');
  assert.equal(view.fields.find(item => item.dataset.storyField === 'rent').textContent, String(building.rent));
  assert.equal(view.fields.find(item => item.dataset.storyField === 'year').textContent, String(building.year));
  const score = Math.round(scoreBuilding(building, state.weights).score).toString();
  assert.deepEqual(view.fields.filter(item => item.dataset.storyField === 'score').map(item => item.textContent), [score, score]);
  assert.equal(view.fields.find(item => item.dataset.storyField === 'peer-count').textContent, String(comparisonFor(building, state.weights).count));
  const calls = view.sceneStates.length, cameras = view.progress.length;
  view.controller.update(state); view.controller.updateScroll({ reduced: false });
  assert.equal(view.sceneStates.length, calls);
  assert.equal(view.progress.length, cameras);
  for (const [tops, phase, mode] of [
    [[-400, 400, 1200, 2000], 'conditions', 'terrain'], [[-1200, -400, 400, 1200], 'criteria', 'score'],
    [[-2000, -1200, -400, 400], 'value', 'price'], [[-400, 400, 1200, 2000], 'conditions', 'terrain'],
  ]) {
    view.setTops(tops); view.controller.updateScroll({ reduced: false });
    assert.equal(view.root.dataset.storyPhase, phase);
    assert.equal(view.element.dataset.storyMode, mode);
    assert.equal(view.sceneStates.at(-1).mode, mode);
    assert.equal(view.panels.filter(panel => !panel.hidden)[0].dataset.storyPanel, phase);
    assert.equal(view.links.find(link => link.getAttribute('aria-current') === 'step').dataset.storyLink, phase);
    assert.deepEqual(view.swatches.map(item => item.style.backgroundColor), PALETTES[mode]);
  }
  assert.equal(JSON.stringify(state), original, 'scroll cannot mutate shared mode, weights, selection or saved places');
  assert.match(view.selection.textContent, /장소 B/);
  view.controller.destroy();
  const finalCalls = view.sceneStates.length;
  view.controller.update(state); view.controller.updateScroll({ reduced: false });
  assert.equal(view.sceneStates.length, finalCalls);
});

test('reduced motion keeps current phase information and missing fields, with a stationary camera', () => {
  const view = fixture();
  view.controller.update({ mode: 'score', selected: 'x', saved: ['x'], weights: { slope: 50, elevation: 50, age: 50 } });
  view.setTops([-1200, -400, 400, 1200]);
  view.controller.updateScroll({ reduced: true });
  assert.equal(view.root.dataset.storyPhase, 'criteria');
  assert.equal(view.sceneStates.at(-1).mode, 'score');
  assert.equal(view.fields.find(item => item.dataset.storyField === 'score').textContent, '자료 없음');
  assert.equal(view.fields.find(item => item.dataset.storyField === 'slope').textContent, '자료 없음');
  assert.match(view.caption.textContent, /보라/);
  assert.ok(view.fields.filter(field => ['slope', 'elevation', 'year', 'score'].includes(field.dataset.storyField)).every(field => field.dataset.missing === 'true'));
  assert.ok(view.units.every(unit => unit.hidden), 'missing values hide all repeated numeric units');
  assert.equal(view.progress.at(-1).zoom, 1);
  view.setTops([-400, 400, 1200, 2000]);
  view.controller.updateScroll({ reduced: true });
  assert.equal(view.root.dataset.storyPhase, 'conditions');
  assert.equal(view.sceneStates.at(-1).mode, 'terrain');
  assert.equal(view.progress.length, 1, 'reduced motion does not repeat stationary frames');
  view.controller.update({ mode: 'score', selected: 'a', saved: ['a'], weights: { slope: 50, elevation: 50, age: 50 } });
  assert.ok(view.fields.every(field => field.dataset.missing === 'false'));
  assert.ok(view.units.every(unit => !unit.hidden), 'choosing valid values restores every numeric unit');
});



test('low viewport height exposes every panel, keeps values current and stops camera work', () => {
  const view = fixture();
  view.setLowHeight(true);
  view.controller.updateScroll();
  assert.equal(view.root.dataset.storyEnhanced, 'false');
  assert.ok(view.panels.every(panel => !panel.hidden && panel.getAttribute('aria-hidden') === 'false'));
  assert.equal(view.progress.length, 0);
  view.controller.update({ selected: 'x', saved: [], weights: { slope: 50, elevation: 50, age: 50 } });
  assert.equal(view.fields.find(field => field.dataset.storyField === 'score').textContent, '자료 없음');
  assert.equal(view.progress.length, 0);
  view.setLowHeight(false);
  view.controller.updateScroll();
  assert.equal(view.root.dataset.storyEnhanced, 'true');
  assert.equal(view.panels.filter(panel => !panel.hidden).length, 1);
  assert.equal(view.progress.length, 1);
  assert.equal(view.root.dataset.storyActive, undefined);
  view.controller.destroy();
  assert.equal(view.root.dataset.storyEnhanced, undefined);
  assert.ok(view.panels.every(panel => !panel.hidden));
});

test('camera begins wide at first waypoint and retargets selected buildings at current scroll', () => {
  const view = fixture();
  view.controller.update({ selected: 'a', saved: [], weights: { slope: 50, elevation: 50, age: 50 } });
  view.controller.updateScroll();
  assert.equal(view.progress.at(-1).zoom, 1);
  view.setTops([-720, 80, 880, 1680]);
  view.controller.updateScroll();
  assert.equal(view.progress.at(-1).zoom, 4.2);
  assert.ok(Math.abs(view.progress.at(-1).target.x + 2.975) < 1e-12);
  view.controller.update({ selected: 'b', saved: [], weights: { slope: 50, elevation: 50, age: 50 } });
  assert.ok(Math.abs(view.progress.at(-1).target.x + 1.845) < 1e-12);
  view.setTops([0, 800, 1600, 2400]); view.controller.updateScroll();
  assert.equal(view.progress.at(-1).zoom, 1);
});

test('twenty peers stay a three-place preview and retain an explicit remaining count', () => {
  const view = fixture();
  view.controller.update({ selected: 'b', saved: [], weights: { slope: 50, elevation: 50, age: 0 } });
  const text = view.fields.find(field => field.dataset.storyField === 'peers').textContent;
  assert.equal(view.fields.find(field => field.dataset.storyField === 'peer-count').textContent, '20');
  assert.equal((text.match(/장소 /g) ?? []).length, 3);
  assert.match(text, /외 17곳/);
  assert.ok(text.length < 100);
});
