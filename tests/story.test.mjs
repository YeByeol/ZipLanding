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
  assert.equal(storyPhaseForSteps(positions([400, 1200, 2000, 2800]), 800).progress, 0);
  assert.equal(storyPhaseForSteps(positions([-800, 0, 800, 1600]), 800).progress, .5);
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
  let tops = [400, 1200, 2000, 2800];
  let bounds = { top: 0, bottom: 3600 };
  const phases = ['price', 'conditions', 'criteria', 'value'];
  const steps = phases.map((phase, index) => ({ ...node({ storyStep: phase }), getBoundingClientRect: () => ({ top: tops[index] }) }));
  const panels = phases.map(phase => node({ storyPanel: phase }));
  const links = phases.map(phase => node({ storyLink: phase }));
  const fields = ['place', 'id', 'rent', 'deposit', 'area', 'slope', 'elevation', 'year', 'score', 'peer-count', 'unit', 'peers', 'score'].map(field => node({ storyField: field }));
  const units = ['slope', 'elevation', 'year', 'score', 'score'].map(key => node({ storyUnit: key }));
  const swatches = Array.from({ length: 5 }, () => node());
  const caption = node(), selection = node(), legend = { ...node(), querySelectorAll: () => swatches };
  const root = { ...node(), getBoundingClientRect: () => bounds, ownerDocument: { defaultView: { innerHeight: 800 } },
    querySelectorAll: selector => ({ '[data-story-step]': steps, '[data-story-panel]': panels, '[data-story-link]': links, '[data-story-field]': fields, '[data-story-unit]': units }[selector] ?? []),
    querySelector: selector => ({ '#story-caption': caption, '#story-legend': legend, '#hero-selection': selection }[selector]),
  };
  const element = node(), sceneStates = [], progress = [];
  const controller = mountStory({ root, element, owner: { update: state => sceneStates.push(state), setProgress: value => progress.push(value) } });
  return { controller, root, element, panels, links, fields, units, swatches, caption, selection, sceneStates, progress, setTops: value => { tops = value; }, setBounds: value => { bounds = value; } };
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
  assert.deepEqual(view.progress, []);
  view.setTops([-400, 400, 1200, 2000]);
  view.controller.updateScroll({ reduced: true });
  assert.equal(view.root.dataset.storyPhase, 'conditions');
  assert.equal(view.sceneStates.at(-1).mode, 'terrain');
  assert.deepEqual(view.progress, []);
  view.controller.update({ mode: 'score', selected: 'a', saved: ['a'], weights: { slope: 50, elevation: 50, age: 50 } });
  assert.ok(view.fields.every(field => field.dataset.missing === 'false'));
  assert.ok(view.units.every(unit => !unit.hidden), 'choosing valid values restores every numeric unit');
});


test('story enhanced active range follows viewport boundaries and is removed on destroy', () => {
  const view = fixture();
  assert.equal(view.root.dataset.storyEnhanced, 'true');
  for (const [bounds, expected] of [
    [{ top: 800, bottom: 4000 }, 'false'], [{ top: 799, bottom: 4000 }, 'true'],
    [{ top: -2200, bottom: 721 }, 'true'], [{ top: -2200, bottom: 720 }, 'false'],
    [{ top: 0, bottom: 3600 }, 'true'],
  ]) {
    view.setBounds(bounds); view.controller.updateScroll({ reduced: true });
    assert.equal(view.root.dataset.storyActive, expected);
  }
  view.controller.destroy();
  assert.equal(view.root.dataset.storyEnhanced, undefined);
  assert.equal(view.root.dataset.storyActive, undefined);
});
