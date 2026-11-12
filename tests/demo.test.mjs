import test from 'node:test';
import assert from 'node:assert/strict';

import { BUILDINGS, DEFAULT_WEIGHTS, normalizedWeights, scoreBuilding, monthlyUnit,
  rankBuildings, comparisonFor, parseState, serializeState } from '../scripts/demo.mjs';
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≠ ${expected}`);

test('demo exposes the pure calculation API', () => {
  assert.equal(typeof scoreBuilding, 'function');
});

test('24 fictional buildings have stable selectable geometry and monetary units', () => {
  assert.equal(BUILDINGS.length, 24);
  assert.equal(new Set(BUILDINGS.map(b => b.id)).size, 24);
  for (const b of BUILDINGS) {
    assert.ok(b.label && b.x >= 0 && b.x <= 5 && b.y >= 0 && b.y <= 3);
    assert.ok(b.area > 0 && b.deposit >= 0 && b.rent >= 0 && b.w > 0 && b.d > 0);
  }
  near(monthlyUnit({rent: 50, deposit: 12000, area: 25}), 4);
});

test('weights normalize, clamp invalid input, and use equal weights for all zero', () => {
  assert.deepEqual(DEFAULT_WEIGHTS, {slope: 1, elevation: 1, age: 1});
  assert.deepEqual(normalizedWeights({slope: 20, elevation: 60, age: 20}), {slope: .2, elevation: .6, age: .2});
  assert.deepEqual(normalizedWeights({slope: 0, elevation: 0, age: 0}), {slope: 1/3, elevation: 1/3, age: 1/3});
  assert.deepEqual(normalizedWeights({slope: -30, elevation: 200, age: Infinity}), {slope: 0, elevation: 100/101, age: 1/101});
});

test('condition ranks use fixed census midpoint ties, with flat, low, new scoring higher', () => {
  for (const [key, field, ascending] of [['slope','slope',true], ['elevation','elevation',true], ['age','year',false]]) {
    const values = BUILDINGS.map(b => b[field]).filter(v => v !== null).sort((a,b) => ascending ? a-b : b-a);
    for (const b of BUILDINGS.filter(b => b[field] !== null)) {
      const first = values.indexOf(b[field]), last = values.lastIndexOf(b[field]);
      near(scoreBuilding(b, {[key]: 1, ...Object.fromEntries(['slope','elevation','age'].filter(k=>k!==key).map(k=>[k,0]))}).score,
        (1 - (first + last) / 2 / (values.length - 1)) * 100);
    }
  }
});

test('changing preferences changes rankings while prices never affect score', () => {
  const slope = rankBuildings({slope: 1, elevation: 0, age: 0});
  const age = rankBuildings({slope: 0, elevation: 0, age: 1});
  assert.notEqual(slope[0].id, age[0].id);
  const a = BUILDINGS[0];
  assert.deepEqual(scoreBuilding(a), scoreBuilding({...a, rent: 999999, deposit: 0, area: .1}));
  assert.deepEqual(rankBuildings({slope:0,elevation:0,age:0}), rankBuildings(DEFAULT_WEIGHTS));
  const scores = rankBuildings().map(b=>b.score);
  assert.equal(scores.at(-1), null);
  assert.ok(scores.filter(v=>v!==null).every((v,i,a)=>!i || v<=a[i-1]));
});

test('missing inputs stay missing and renormalize only observed positive weights', () => {
  const a = {...BUILDINGS[0], slope: null};
  const result = scoreBuilding(a, {slope: 50, elevation: 1, age: 3});
  assert.deepEqual(result.missing, ['slope']);
  assert.equal(result.parts.slope, null);
  near(result.score, (result.parts.elevation + 3 * result.parts.age) / 4);
  assert.equal(scoreBuilding(a, {slope:1,elevation:0,age:0}).score, null);
  assert.equal(scoreBuilding({...a, elevation:null, year:null}).score, null);
  assert.ok(Number.isFinite(scoreBuilding({...a,slope:0}).parts.slope));
});

test('comparison uses ±5 peers excluding self and suppresses percentage below five', () => {
  let hasLargeGroup = false, hasSmallGroup = false;
  for (const building of BUILDINGS) {
    const result = comparisonFor(building);
    const ownScore = scoreBuilding(building).score;
    const expectedIds = BUILDINGS.filter(b => b.id !== building.id && ownScore !== null && scoreBuilding(b).score !== null && Math.abs(scoreBuilding(b).score - ownScore) <= 5).map(b=>b.id).sort();
    assert.deepEqual(result.peers.map(b=>b.id).sort(), expectedIds);
    assert.equal(result.count, result.peers.length);
    near(result.unit, monthlyUnit(building));
    if (result.count >= 5) {
      hasLargeGroup = true;
      const units = result.peers.map(monthlyUnit).sort((a,b)=>a-b);
      const mid = Math.floor(units.length / 2);
      const median = units.length % 2 ? units[mid] : (units[mid-1] + units[mid])/2;
      near(result.peerMedian, median);
      near(result.percent, (result.unit / median - 1) * 100);
    } else {
      hasSmallGroup = true;
      assert.equal(result.percent, null);
    }
  }
  assert.ok(hasLargeGroup && hasSmallGroup);
});

test('URL defaults and share state roundtrip are canonical', () => {
  const defaults = {weights:{slope:1,elevation:1,age:1},selected:'a',saved:['a','b','c'],mode:'price'};
  assert.deepEqual(parseState(''), defaults);
  const state = {weights:{slope:0,elevation:73.5,age:100},selected:'x',saved:['x','c'],mode:'value'};
  const query = serializeState(state);
  assert.ok(query.startsWith('?'));
  assert.deepEqual(parseState(query), state);
  assert.equal(serializeState(parseState(query)), query);
  assert.deepEqual(parseState(serializeState({...state,saved:[]})).saved, []);
});

test('URL trust boundary rejects duplicates, oversized and corrupt inputs safely', () => {
  const defaults = parseState('');
  assert.deepEqual(parseState('?slope=2&slope=9'), defaults);
  assert.deepEqual(parseState('?'+'a'.repeat(5000)), defaults);
  const state = parseState('?slope=-20&elevation=999&age=NaN&selected=%3Cscript%3E&saved=a,a,z,b,c,d&mode=javascript:alert(1)');
  assert.deepEqual(state.weights, {slope:0,elevation:100,age:1});
  assert.equal(state.selected,'a');
  assert.deepEqual(state.saved,['a','b','c']);
  assert.equal(state.mode,'price');
  assert.deepEqual(parseState('?slope=&elevation=Infinity&age=%FF').weights, defaults.weights);
  assert.deepEqual(parseState(null), defaults);
  assert.deepEqual(parseState('?selected=%E0%A4%A'), defaults);
});
