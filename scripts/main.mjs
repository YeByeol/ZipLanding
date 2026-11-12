import { BUILDINGS, normalizedWeights, scoreBuilding, monthlyUnit, comparisonFor, parseState, serializeState } from './demo.mjs';
import { PALETTES } from './city.mjs';
import { mountScene3D } from './scene3d.mjs';
import { mountMotion } from './motion.mjs';
import { mountStory } from './story.mjs';

const $ = selector => document.querySelector(selector);
const keys = ['slope', 'elevation', 'age'];
const params = new URLSearchParams(location.search);
const initial = parseState(location.search);
if (!['price', 'score', 'value', 'terrain'].includes(params.get('mode'))) initial.mode = 'score';
if (!keys.some(key => params.has(key))) initial.weights = { slope: 50, elevation: 50, age: 50 };
let state = initial;
let toastTimer, announceTimer;
const format = (value, digits = 0) => Number.isFinite(value) ? value.toLocaleString('ko-KR', { maximumFractionDigits: digits }) : '자료 없음';
const placeName = building => `장소 ${building.id.toUpperCase()}`;
const getBuilding = id => BUILDINGS.find(building => building.id === id);
const selectedBuilding = () => getBuilding(state.selected);

function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').classList.add('is-visible');
  toastTimer = setTimeout(() => $('#toast').classList.remove('is-visible'), 3200);
}

function select(id) {
  if (!getBuilding(id)) return;
  state.selected = id;
  render();
}

function sceneStatus(name, status) {
  document.querySelectorAll(`[data-scene="${name}"] button`).forEach(button => { button.disabled = status !== 'webgl'; });
  const caption = $(`#${name}-scene-status`);
  if (caption) caption.textContent = status === 'webgl' ? '드래그로 회전 · 건물을 눌러 선택' : '건물과 조건을 고정 모형으로 살펴보세요.';
}

const storyElement = $('#story-city');
const storyOwner = mountScene3D(storyElement, { buildings:BUILDINGS, interactive:false, scene:'hero' });
const story = mountStory({ root:$('#platform'), element:storyElement, owner:storyOwner });
const cities = [
  { name:'experience', element:$('#experience-city'), owner:mountScene3D($('#experience-city'), { buildings:BUILDINGS, interactive:true, onSelect:select, scene:'experience', onStatus:s=>sceneStatus('experience',s) }) },
];
for (const group of document.querySelectorAll('[data-scene]')) group.addEventListener('click', event => {
  const button = event.target.closest('[data-scene-action]');
  if (!button || button.disabled) return;
  const owner = cities.find(city => city.name === group.dataset.scene)?.owner;
  if (button.dataset.sceneAction.startsWith('view-')) owner?.setPreset(button.dataset.sceneAction.slice(5));
  else if (button.dataset.sceneAction === 'reset') owner?.resetView();
  else if (button.dataset.sceneAction === 'zoom-in') owner?.zoom(.15);
  else if (button.dataset.sceneAction === 'zoom-out') owner?.zoom(-.15);
  else owner?.rotate(button.dataset.sceneAction === 'left' ? -.3 : .3);
});
const motion = mountMotion({ header:$('.site-header'), progress:$('#reading-progress'), onUpdate: value => story.updateScroll(value) });

// Native buttons mirror every painted building, including the missing-data example.
for (const building of BUILDINGS) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.select = building.id;
  button.textContent = building.id.toUpperCase();
  button.setAttribute('aria-label', `${placeName(building)} 살펴보기`);
  $('#all-buildings').append(button);
}

function announce() {
  clearTimeout(announceTimer);
  announceTimer = setTimeout(() => {
    const building = selectedBuilding();
    const { score } = scoreBuilding(building, state.weights);
    $('#live-result').textContent = `${placeName(building)}, 내 기준 ${score === null ? '자료 없음' : `${format(score)}점`}. 담은 장소 ${state.saved.length}곳.`;
  }, 250);
}

function renderSelection() {
  const building = selectedBuilding();
  const result = scoreBuilding(building, state.weights);
  const summary = $('#selected-summary');
  summary.replaceChildren();
  const name = document.createElement('p'); name.textContent = placeName(building);
  const score = document.createElement('strong');
  score.textContent = result.score === null ? '자료 없음' : `${format(result.score)}`;
  if (result.score !== null) { const unit = document.createElement('small'); unit.textContent = '점 / 내 기준'; score.append(unit); }
  const money = document.createElement('span'); money.textContent = `보증금 ${format(building.deposit)}만 · 월세 ${format(building.rent)}만 · ${format(building.area)}㎡`;
  const conditions = document.createElement('div'); conditions.className = 'selected-conditions';
  for (const text of [`경사 ${format(building.slope)}${building.slope === null ? '' : '%'}`, `고도 ${format(building.elevation)}${building.elevation === null ? '' : 'm'}`, building.year === null ? '연식 자료 없음' : `${building.year}년`]) {
    const item = document.createElement('span'); item.textContent = text; conditions.append(item);
  }
  summary.append(name, score, money, conditions);
  if (result.missing.length) { const note = document.createElement('span'); const labels = { slope: '경사', elevation: '고도', age: '연식' }; note.textContent = `자료 없음: ${result.missing.map(key => labels[key]).join(', ')}. 점수 계산에서 제외합니다.`; summary.append(note); }
  const saved = state.saved.includes(state.selected);
  $('#save-selected').disabled = saved;
  $('#save-selected').textContent = saved ? '비교에 담은 장소입니다' : state.saved.length >= 3 ? '다른 장소를 빼고 담아주세요' : '선택한 장소 담기';
  for (const button of document.querySelectorAll('[data-select]')) button.setAttribute('aria-pressed', String(button.dataset.select === state.selected));
}

function cell(text, { header = false, scope, selected = false, className = '', small } = {}) {
  const node = document.createElement(header ? 'th' : 'td');
  node.textContent = text;
  if (scope) node.scope = scope;
  if (selected) node.dataset.selected = 'true';
  if (className) node.className = className;
  if (small) { const detail = document.createElement('small'); detail.textContent = small; node.append(detail); }
  return node;
}

function renderComparison() {
  const titles = [
    ['비교할 장소를,', '나란히 놓아보세요.'],
    ['한 장소의 조건,', '이렇게 살펴보세요.'],
    ['두 곳의 차이,', '선택할 이유가 됩니다.'],
    ['세 곳의 차이,', '선택할 이유가 됩니다.'],
  ][state.saved.length];
  const heading = $('[data-compare-heading]'), subheading = $('[data-compare-subheading]');
  if (heading) heading.textContent = titles[0];
  if (subheading) subheading.textContent = titles[1];
  $('#saved-count').textContent = `담은 장소 ${state.saved.length} / 3`;
  const places = $('#saved-places');
  // Keep focus on a surviving control when the comparison is redrawn.
  const active = document.activeElement;
  const focusId = places.contains(active) ? active.dataset.remove ?? active.dataset.select : null;
  const focusAction = active?.hasAttribute('data-remove') ? 'remove' : 'select';
  places.replaceChildren();
  for (const id of state.saved) {
    const building = getBuilding(id);
    const result = scoreBuilding(building, state.weights);
    const group = document.createElement('section'); group.className = `saved-place${id === state.selected ? ' is-selected' : ''}`;
    const choose = document.createElement('button'); choose.type = 'button'; choose.dataset.select = id;
    choose.setAttribute('aria-pressed', String(id === state.selected));
    const marker = document.createElement('span'); marker.className = 'place-id'; marker.textContent = id.toUpperCase();
    const score = document.createElement('strong'); score.className = 'place-score'; score.textContent = result.score === null ? '자료 없음' : format(result.score);
    if (result.score !== null) { const unit = document.createElement('small'); unit.textContent = '점 / 내 기준'; score.append(unit); }
    const price = document.createElement('span'); price.className = 'place-price'; price.textContent = `보증금 ${format(building.deposit)}만 · 월세 ${format(building.rent)}만`;
    const facts = document.createElement('span'); facts.className = 'place-facts'; facts.textContent = `${format(building.area)}㎡ · 경사 ${building.slope === null ? '자료 없음' : `${format(building.slope)}%`} · 고도 ${building.elevation === null ? '자료 없음' : `${format(building.elevation)}m`} · ${building.year === null ? '연식 자료 없음' : `${building.year}년`}`;
    choose.setAttribute('aria-label', `${placeName(building)} 살펴보기 · ${result.score === null ? '내 기준 점수 자료 없음' : `내 기준 ${format(result.score)}점`} · ${price.textContent} · ${facts.textContent}`);
    choose.append(marker, score, price, facts);
    const remove = document.createElement('button'); remove.type = 'button'; remove.dataset.remove = id; remove.textContent = '비교에서 빼기'; remove.setAttribute('aria-label', `${placeName(building)} 비교에서 빼기`);
    group.append(choose, remove); places.append(group);
  }
  if (!state.saved.length) {
    const empty = document.createElement('p'); empty.className = 'comparison-empty'; empty.textContent = '담은 장소가 없습니다. 내 기준으로 장소를 살펴보고 비교에 담아보세요.';
    const back = document.createElement('a'); back.href = '#experience'; back.className = 'text-link'; back.textContent = '체험에서 장소 고르기';
    places.append(empty, back);
  }
  if (focusId) { const target = places.querySelector(`[data-${focusAction}="${focusId}"]`) ?? places.querySelector('button') ?? places.querySelector('.text-link') ?? $('#save-selected'); target.focus({ preventScroll: true }); }
  const head = document.createElement('tr'); head.append(cell('비교 기준', { header: true, scope: 'col' }));
  for (const id of state.saved) head.append(cell(placeName(getBuilding(id)), { header: true, scope: 'col', selected: id === state.selected }));
  $('#comparison-head').replaceChildren(head);
  const body = $('#comparison-body'); body.replaceChildren();
  if (!state.saved.length) {
    const row = document.createElement('tr'); row.append(cell('담은 장소 없음', { header: true, scope: 'row' })); const note = cell('예시 지도에서 장소를 선택한 뒤 담아주세요.'); note.colSpan = 3; row.append(note); body.append(row); return;
  }
  const rows = [
    ['내 기준 점수', building => { const score = scoreBuilding(building, state.weights).score; return { text: score === null ? '자료 없음' : `${format(score)}점`, className: 'score-cell' }; }],
    ['보증금 / 월세', building => ({ text: `${format(building.deposit)} / ${format(building.rent)}만`, small: '관리비 미포함' })],
    ['면적', building => ({ text: `${format(building.area)}㎡` })],
    ['완만한 경사', building => ({ text: building.slope === null ? '자료 없음' : `${format(building.slope)}%`, small: '낮을수록 점수 높음' })],
    ['낮은 고도', building => ({ text: building.elevation === null ? '자료 없음' : `${format(building.elevation)}m`, small: '낮을수록 점수 높음' })],
    ['건물 연식', building => ({ text: building.year === null ? '자료 없음' : `${building.year}년`, small: '새로울수록 점수 높음' })],
    ['월 환산 단가', building => ({ text: `${format(monthlyUnit(building), 2)}만/㎡`, small: '보증금 연 5% 환산 가정' })],
    ['계산에서 빠진 조건', building => { const missing = scoreBuilding(building, state.weights).missing; const labels = { slope: '경사', elevation: '고도', age: '연식' }; return { text: missing.length ? missing.map(key => labels[key]).join(', ') : '없음' }; }],
  ];
  for (const [label, read] of rows) {
    const row = document.createElement('tr'); row.append(cell(label, { header: true, scope: 'row' }));
    for (const id of state.saved) { const result = read(getBuilding(id)); row.append(cell(result.text, { ...result, selected: id === state.selected })); }
    body.append(row);
  }
}

function renderValue() {
  const building = selectedBuilding();
  const result = comparisonFor(building, state.weights);
  const node = $('#value-result'); node.replaceChildren();
  const title = document.createElement('strong'); const detail = document.createElement('span');
  if (result.percent !== null) {
    title.textContent = `${placeName(building)}, 비슷한 예시보다 ${format(Math.abs(result.percent))}% ${result.percent < 0 ? '낮은 가격' : '높은 가격'}`;
    detail.textContent = `내 기준 ±5점인 ${result.count}곳과 비교 · ${format(result.unit, 2)}만/㎡ / 비교 중앙값 ${format(result.peerMedian, 2)}만/㎡. 실제 시장의 가격 평가가 아닙니다.`;
  } else if (result.count) {
    title.textContent = `비슷한 예시 ${result.count}곳의 가격을 함께 봅니다`;
    detail.textContent = `선택한 곳 ${format(result.unit, 2)}만/㎡ · 비교: ${result.peers.map(peer => `${placeName(peer)} ${format(monthlyUnit(peer), 2)}만/㎡`).join(', ')}. 비교 대상이 적어 퍼센트로 요약하지 않습니다.`;
  } else {
    title.textContent = '이 기준에서는 비슷한 예시가 없습니다';
    detail.textContent = `선택한 곳 ${format(result.unit, 2)}만/㎡. 점수가 없거나 ±5점 안의 비교 장소가 없어 가격 대비를 계산하지 않습니다.`;
  }
  node.append(title, detail);
}

const modeDescriptions = {
  price: '청록색이 진할수록 면적당 월 환산 가격이 높습니다.',
  score: '보라색이 진할수록 지금의 내 기준 점수가 높습니다. 빗금은 자료 없음입니다.',
  terrain: '모래색이 진할수록 예시 경사가 큽니다. 빗금은 자료 없음입니다.',
  value: '비슷한 점수의 예시 가격과 비교합니다. 표본이 적으면 색을 칠하지 않습니다.',
};
const colors = PALETTES;

function render({ syncInputs = false } = {}) {
  const ratios = normalizedWeights(state.weights);
  for (const key of keys) {
    $(`#ratio-${key}`).textContent = `${Math.round(ratios[key] * 100)}%`;
    if (syncInputs) $(`#weight-${key}`).value = state.weights[key];
    $(`#weight-${key}`).setAttribute('aria-valuetext', `중요도 ${state.weights[key]}, 실제 반영 ${Math.round(ratios[key] * 100)}퍼센트`);
  }
  const allZero = keys.every(key => state.weights[key] === 0);
  $('#weights-note').textContent = allZero ? '모두 0이어서 같은 중요도로 계산합니다. 가격은 제외합니다.' : '가격은 점수에 넣지 않습니다.';
  const same = keys.every(key => state.weights[key] === state.weights.slope);
  $('#map-state-label').textContent = same ? '모두 같은 중요도' : '내가 정한 중요도';
  story.update(state);
  for (const city of cities) city.owner.update(state);
  for (const button of document.querySelectorAll('[data-mode]')) button.setAttribute('aria-pressed', String(button.dataset.mode === state.mode));
  $('#mode-description').textContent = modeDescriptions[state.mode];
  [...$('#platform-legend').querySelectorAll('i')].forEach((item, index) => item.style.backgroundColor = colors[state.mode][index]);
  renderSelection(); renderComparison(); renderValue(); announce();
  $('#share-fallback').hidden = true;
}

for (const key of keys) $(`#weight-${key}`).addEventListener('input', event => { state.weights[key] = Number(event.target.value); state.mode = 'score'; render(); });
document.addEventListener('click', event => {
  const choose = event.target.closest('[data-select]');
  if (choose) select(choose.dataset.select);
  const mode = event.target.closest('[data-mode]');
  if (mode) { state.mode = mode.dataset.mode; render(); }
  const remove = event.target.closest('[data-remove]');
  if (remove) { state.saved = state.saved.filter(id => id !== remove.dataset.remove); render(); toast('비교에서 뺐습니다. 다른 장소를 담아보세요.'); }
});
$('#save-selected').addEventListener('click', () => {
  if (state.saved.includes(state.selected)) return;
  if (state.saved.length >= 3) { toast('세 곳까지 비교할 수 있습니다. 담은 장소 하나를 먼저 빼주세요.'); $('#comparison').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); return; }
  state.saved.push(state.selected); render(); toast(`${placeName(selectedBuilding())}를 비교에 담았습니다.`);
});
$('#reset-weights').addEventListener('click', () => { state.weights = { slope:50, elevation:50, age:50 }; render({syncInputs:true}); toast('모든 조건을 같은 중요도로 맞췄습니다.'); });
$('#reset-demo').addEventListener('click', () => { state = { weights:{slope:50,elevation:50,age:50}, selected:'a', saved:['a','b','c'], mode:'score' }; history.replaceState(null,'',location.pathname+location.hash); render({syncInputs:true}); toast('처음의 예시로 돌아왔습니다.'); });
$('#share-state').addEventListener('click', async () => {
  const url = new URL(location.href); url.search = serializeState(state); url.hash = 'experience';
  try {
    if (!navigator.clipboard?.writeText) throw Error('clipboard unavailable');
    await navigator.clipboard.writeText(url.href); toast('내 기준과 담은 장소가 담긴 링크를 복사했습니다.');
  } catch {
    $('#share-fallback').hidden = false; $('#share-url').value = url.href; $('#share-url').focus(); $('#share-url').select(); toast('아래 주소를 직접 복사해주세요.');
  }
});
$('#close-share').addEventListener('click', () => { $('#share-fallback').hidden = true; $('#share-state').focus(); });
window.addEventListener('pagehide', event => { clearTimeout(toastTimer); clearTimeout(announceTimer); if (!event.persisted) { motion.destroy(); story.destroy(); storyOwner.destroy(); cities.forEach(city => city.owner.destroy()); } });
document.querySelectorAll('[data-needs-js]').forEach(control => { control.disabled = false; });
render({syncInputs:true});
document.body.classList.add('has-demo');
document.documentElement.dataset.ready = 'true';
