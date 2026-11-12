// Fictional teaching census. Money: 만원; area: ㎡; slope: %; elevation: m.
export const BUILDINGS = Object.freeze(Array.from({length: 24}, (_, i) => Object.freeze({
  id: String.fromCharCode(97 + i),
  label: `예시 건물 ${String.fromCharCode(65 + i)}`,
  deposit: [1000, 3000, 5000, 2000, 8000, 12000][i % 6],
  rent: 35 + (i * 13 % 60),
  area: 23 + (i * 7 % 35),
  slope: i === 20 || i === 23 ? null : 1 + (i % 10),
  elevation: i === 21 || i === 23 ? null : 20 + (10 - i % 10) * 7,
  year: i >= 22 ? null : 1995 + (i % 5) * 6,
  x: i % 6, y: Math.floor(i / 6),
  w: .56 + (i % 4) * .08, d: .58 + (i % 3) * .1,
  height: 18 + (i * 11 % 47),
})));

export const DEFAULT_WEIGHTS = Object.freeze({slope: 1, elevation: 1, age: 1});
const KEYS = Object.keys(DEFAULT_WEIGHTS);
const IDS = new Set(BUILDINGS.map(b => b.id));
const MODES = new Set(['price', 'score', 'value', 'terrain']);
const DEFAULT_SAVED = ['a', 'b', 'c'];

function cleanWeight(value, fallback = 1) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(100, value));
}

function cleanWeights(weights) {
  return Object.fromEntries(KEYS.map(key => [key, cleanWeight(weights?.[key])]));
}

export function normalizedWeights(weights = DEFAULT_WEIGHTS) {
  const clean = cleanWeights(weights);
  const sum = KEYS.reduce((total, key) => total + clean[key], 0);
  return Object.fromEntries(KEYS.map(key => [key, sum ? clean[key] / sum : 1 / 3]));
}

const FIELD = {slope: 'slope', elevation: 'elevation', age: 'year'};
const CENSUS = Object.fromEntries(KEYS.map(key => [key,
  BUILDINGS.map(b => b[FIELD[key]]).filter(Number.isFinite).sort((a, b) => a - b),
]));

function conditionScore(value, key) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const values = CENSUS[key];
  const first = values.findIndex(v => v >= value);
  let rank;
  if (first < 0) rank = values.length - 1;
  else if (values[first] === value) rank = (first + values.lastIndexOf(value)) / 2;
  else rank = first;
  const percentile = rank / (values.length - 1);
  return (key === 'age' ? percentile : 1 - percentile) * 100;
}

export function scoreBuilding(building, weights = DEFAULT_WEIGHTS) {
  const normalized = normalizedWeights(weights);
  const parts = Object.fromEntries(KEYS.map(key => [key, conditionScore(building[FIELD[key]], key)]));
  const missing = KEYS.filter(key => parts[key] === null);
  const observed = KEYS.filter(key => parts[key] !== null && normalized[key] > 0);
  const total = observed.reduce((sum, key) => sum + normalized[key], 0);
  const score = total ? observed.reduce((sum, key) => sum + parts[key] * normalized[key], 0) / total : null;
  return {score, missing, parts};
}

export function monthlyUnit(building) {
  return (building.rent + building.deposit * .05 / 12) / building.area;
}

export function rankBuildings(weights = DEFAULT_WEIGHTS) {
  return BUILDINGS.map(building => ({...building, ...scoreBuilding(building, weights)}))
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || a.id.localeCompare(b.id));
}

export function comparisonFor(building, weights = DEFAULT_WEIGHTS) {
  const {score} = scoreBuilding(building, weights);
  const peers = BUILDINGS.filter(candidate => {
    if (candidate.id === building.id || score === null) return false;
    const other = scoreBuilding(candidate, weights).score;
    return other !== null && Math.abs(other - score) <= 5;
  });
  const values = peers.map(monthlyUnit).sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  const peerMedian = values.length ? (values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2) : null;
  const unit = monthlyUnit(building);
  return {count: peers.length, percent: peers.length >= 5 && peerMedian > 0 ? (unit / peerMedian - 1) * 100 : null,
    peerMedian, peers, unit};
}

function cleanState(state = {}) {
  return {
    weights: cleanWeights(state?.weights),
    selected: IDS.has(state?.selected) ? state.selected : 'a',
    saved: Array.isArray(state?.saved) ? [...new Set(state.saved.filter(id => IDS.has(id)))].slice(0, 3) : [...DEFAULT_SAVED],
    mode: MODES.has(state?.mode) ? state.mode : 'price',
  };
}

export function parseState(search = '') {
  if (typeof search !== 'string' || search.length > 4096) return cleanState();
  const params = new URLSearchParams(search);
  const seen = new Set();
  for (const [key] of params) {
    if (seen.has(key)) return cleanState();
    seen.add(key);
  }
  const weights = Object.fromEntries(KEYS.map(key => {
    const raw = params.get(key);
    return [key, raw !== null && raw.trim() !== '' ? cleanWeight(Number(raw)) : 1];
  }));
  return cleanState({weights, selected: params.get('selected'), mode: params.get('mode'),
    saved: params.has('saved') ? params.get('saved').split(',') : DEFAULT_SAVED});
}

export function serializeState(state) {
  const clean = cleanState(state);
  const params = new URLSearchParams();
  for (const key of KEYS) params.set(key, String(clean.weights[key]));
  params.set('selected', clean.selected);
  params.set('saved', clean.saved.join(','));
  params.set('mode', clean.mode);
  return `?${params}`;
}
