import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { citySVG } from './city.mjs';

// A saved place retains its own identity when its position in the tray changes.
const savedD = citySVG({ saved: ['d'], selected: 'd' });
const markerD = savedD.match(/<g data-building-id="d"[\s\S]*?(?=<g data-building-id=|$)/)?.[0];
assert.match(markerD ?? '', /<text[^>]*>D<\/text>/);
assert.doesNotMatch(markerD ?? '', /class="building-marker" style="display:none"/);
// Inline maps contain no shared SVG ids or cross-map resource references.
assert.doesNotMatch([savedD, citySVG({ mode: 'score' }), citySVG({ mode: 'terrain' })].join(''), /\sid=|url\(#|<(?:defs|pattern|clipPath)\b/);

for (const [name, options] of Object.entries({
  price: { mode: 'price' },
  score: { mode: 'score', weights: { slope: 80, elevation: 30, age: 20 } },
  terrain: { mode: 'terrain', scene: 'detail', selected: 'r', saved: [] },
  compare: { mode: 'price', scene: 'compare' },
})) {
  await writeFile(new URL(`../assets/city-${name}.svg`, import.meta.url), citySVG(options));
}
