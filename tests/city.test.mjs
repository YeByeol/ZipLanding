import test from 'node:test';
import assert from 'node:assert/strict';
import { citySVG } from '../scripts/city.mjs';
import { BUILDINGS } from '../scripts/demo.mjs';

const roof = svg => svg.match(/class="building-roof"[^>]*fill="([^"]+)"/)?.[1];

test('terrain encodes slope, independent of elevation, and preserves missing slope', () => {
  const building = { ...BUILDINGS[0], slope: 1, elevation: 20 };
  const render = overrides => citySVG({ mode: 'terrain', buildings: [{ ...building, ...overrides }] });
  assert.equal(roof(render({ elevation: 200 })), roof(render({})), 'elevation must not change slope color');
  assert.notEqual(roof(render({ slope: 10 })), roof(render({})), 'slope must change color');
  assert.equal(roof(render({ slope: null })), '#d9d6cf', 'missing slope is unknown');
});

test('saved markers retain building identity after tray reordering', () => {
  const svg = citySVG({ selected: 'd', saved: ['d', 'a'] });
  const group = svg.match(/data-building-id="d"[\s\S]*?(?=<g data-building-id=|$)/)?.[0];
  assert.match(group, /<text[^>]*>D<\/text>/);
  assert.doesNotMatch(group, /class="building-marker" style="display:none"/);
});

test('SVG colors and missing hatches update in place from the shared transition', async () => {
  const { mountCity, colorFrameForTransition } = await import('../scripts/city.mjs');
  const parts = new Map();
  const part = selector => {
    if (!parts.has(selector)) parts.set(selector, { attributes: {}, style: {}, textContent: '', setAttribute(key, value) { this.attributes[key] = value; }, querySelector: part });
    return parts.get(selector);
  };
  const building = BUILDINGS.find(item => item.id === 'x');
  const node = { dataset: { buildingId: 'x' }, querySelector: part, classList: { toggle() {} } };
  const svg = { dataset: {}, querySelectorAll: () => [node], remove() {} };
  let replacements = 0;
  const container = { set innerHTML(value) { replacements++; }, querySelector: () => svg };
  const owner = mountCity(container, { buildings: [building] });
  const weights = { slope: 50, elevation: 50, age: 50 };
  const blend = { from: 'price', to: 'terrain', mix: .5 };
  owner.update({ weights, colorBlend: blend });
  const expected = colorFrameForTransition(building, [building], blend, weights);
  const roof = part('.building-roof');
  assert.equal(roof.attributes.fill, expected.color);
  assert.equal(part('.building-missing').style.opacity, '0.5');
  assert.equal(part('.building-missing').style.display, '');
  owner.update({ mode: 'score' });
  assert.equal(roof.attributes.fill, expected.color, 'logical mode cannot overwrite the physical blend');
  owner.update({ colorBlend: { from: 'price', to: 'terrain', mix: 0 } });
  assert.equal(part('.building-missing').style.display, 'none');
  assert.equal(replacements, 1, 'updates retain the original SVG nodes');
  assert.equal(part('.building-roof'), roof);
});
