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
