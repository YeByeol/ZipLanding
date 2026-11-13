import test from 'node:test';
import assert from 'node:assert/strict';
import { tourFrame } from '../scripts/product-tour.mjs';

test('tour seek/reverse always retains a fully painted frame', () => {
  const positions = [-2, 0, .6, .8, 1, 1.9, 2.8, 3, 8, NaN];
  for (const position of [...positions, ...positions.toReversed()]) {
    const frame = tourFrame(position, 4);
    assert.ok(frame.index >= 0 && frame.index < 4);
    assert.equal(frame.blend ?? 0, 0, 'A stopped scroll position must not retain two blended text layers');
    assert.equal(frame.baseOpacity, 1);
    assert.deepEqual(frame, tourFrame(position, 4));
  }
  assert.equal(tourFrame(3, 4).index, 3);
  assert.equal(tourFrame(.8, 4).index, 1);
});

test('reduced motion has a complete stationary image and no interpolated travel', () => {
  for (const position of [0, .7, 1.3, 2.9, 3]) {
    const frame = tourFrame(position, 4, true);
    assert.equal(frame.scale, 1);
    assert.equal(frame.blend ?? 0, 0);
    assert.equal(frame.index, tourFrame(position, 4).index);
  }
});
