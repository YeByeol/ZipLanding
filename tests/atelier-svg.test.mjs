import test from 'node:test';
import assert from 'node:assert/strict';
import { atelierSVG } from '../scripts/atelier-svg.mjs';
import { BUILDINGS } from '../scripts/demo.mjs';
import { colorFrameForTransition } from '../scripts/city.mjs';

const visible = svg => [...svg.matchAll(/data-building-id="([a-z])"[^>]*data-visible="true"/g)].map(match => match[1]);
test('atelier fallback keeps six stable subjects but exposes each chapter formation', () => {
  for (const [phase, ids] of Object.entries({discover:['a'],conditions:['a'],comparison:['a','b','c'],value:['a','k','v'],evidence:['x']})) {
    const svg = atelierSVG({phase});
    assert.deepEqual(visible(svg), ids);
    assert.equal((svg.match(/data-building-id=/g) ?? []).length, 6);
    assert.equal((svg.match(/class="building-marker"/g) ?? []).length, 6);
    assert.doesNotMatch(svg, /NaN|Infinity|\sid=|url\(#|<(?:defs|pattern|clipPath)\b/);
  }
});
test('atelier facade color and missing-data hatch use the actual shared data semantics', () => {
  const weights = {slope:80,elevation:10,age:10};
  const expected = colorFrameForTransition(BUILDINGS[0],BUILDINGS,{from:'score'},weights).color;
  assert.ok([...atelierSVG({phase:'criteria',mode:'score',weights}).matchAll(/<polygon[^>]+>/g)].some(([tag])=>tag.includes('class="atelier-data-face"')&&tag.includes(`fill="${expected}"`)));
  const unknown = atelierSVG({phase:'evidence',mode:'score',weights});
  assert.match(unknown, /data-building-id="x"[\s\S]*?class="building-missing" opacity="1"/);
});
test('intermediate formation keeps incoming and outgoing identities without a replacement scene', () => {
  const svg = atelierSVG({formation:{from:'value',to:'evidence',mix:.5}});
  assert.deepEqual(visible(svg), ['a','k','v','x']);
  assert.doesNotMatch(svg,/NaN|Infinity/);
});
test('malformed formation clamps to an intact first scene', () => {
  assert.deepEqual(visible(atelierSVG({formation:{from:'bad',to:null,mix:NaN}})), ['a']);
});

test('unrecognized presentation strings cannot inject SVG markup', () => {
  assert.doesNotMatch(atelierSVG({phase:'bad',mode:'"><script>alert(1)</script>'}), /<script|alert\(1\)/);
});
