import { BUILDINGS, scoreBuilding, monthlyUnit, comparisonFor } from './demo.mjs';
import { PALETTES } from './city.mjs';

const phases = ['price', 'conditions', 'criteria', 'value'];
const modes = { price: 'price', conditions: 'terrain', criteria: 'score', value: 'price' };
const captions = {
  price: '가격표부터 읽습니다. 청록색이 진할수록 면적당 월 환산 가격이 높습니다.',
  conditions: '가격 뒤의 조건을 읽습니다. 모래색이 진할수록 경사가 큽니다. 빗금은 자료 없음입니다.',
  criteria: '나의 기준으로 읽습니다. 보라색이 진할수록 내 기준 점수가 높습니다. 가격은 점수에 넣지 않습니다.',
  value: '비슷한 조건 옆에 가격을 놓습니다. 청록색은 월 환산 가격이며 보라색 점수와 다른 정보입니다.',
};
const format = (value, digits = 0) => Number.isFinite(value) ? value.toLocaleString('ko-KR', { maximumFractionDigits: digits }) : '자료 없음';

export function storyPhaseForSteps(rects, viewport) {
  const fallback = { phase: 'price', progress: 0 };
  if (!Number.isFinite(viewport) || viewport <= 0 || !Array.isArray(rects) || rects.length !== phases.length) return fallback;
  const tops = Array.from(rects, rect => rect?.top);
  if (!tops.every(Number.isFinite) || tops.some((top, index) => index && top < tops[index - 1]) || tops.at(-1) <= tops[0]) return fallback;
  const midline = viewport / 2;
  let index = 0;
  for (let step = 1; step < tops.length; step++) if (tops[step] <= midline) index = step;
  return { phase: phases[index], progress: Math.max(0, Math.min(1, (midline - tops[0]) / (tops.at(-1) - tops[0]))) };
}

export function mountStory({ root, element, owner }) {
  const all = selector => [...(root?.querySelectorAll(selector) ?? [])];
  const steps = all('[data-story-step]');
  const panels = all('[data-story-panel]');
  const links = all('[data-story-link]');
  const fields = all('[data-story-field]');
  const units = all('[data-story-unit]');
  const caption = root?.querySelector('#story-caption');
  const legend = root?.querySelector('#story-legend');
  const selection = root?.querySelector('#hero-selection');
  const originalRoot = Object.fromEntries(['storyPhase', 'storyEnhanced', 'storyActive'].map(key => [key, root?.dataset[key]]));
  const initialMode = element?.dataset.storyMode;
  const originalPanels = panels.map(panel => ({ panel, hidden: panel.hidden, aria: panel.getAttribute('aria-hidden') }));
  const originalLinks = links.map(link => ({ link, aria: link.getAttribute('aria-current') }));
  let phase, state, stateKey, sceneKey, lastProgress, destroyed = false;
  if (root) root.dataset.storyEnhanced = 'true';

  function updateScene() {
    if (!state) return;
    const mode = modes[phase ?? 'price'];
    const key = `${mode}:${stateKey}`;
    if (key === sceneKey) return;
    sceneKey = key;
    owner?.update({ ...state, weights: { ...state.weights }, saved: [...state.saved], mode });
  }

  function showPhase(next) {
    if (next === phase) return;
    phase = next;
    if (root) root.dataset.storyPhase = phase;
    if (element) element.dataset.storyMode = modes[phase];
    for (const panel of panels) {
      panel.hidden = panel.dataset.storyPanel !== phase;
      panel.setAttribute('aria-hidden', String(panel.hidden));
    }
    for (const link of links) {
      const target = link.dataset.storyLink || link.getAttribute('href')?.replace('#story-', '');
      if (target === phase) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    }
    if (caption) caption.textContent = captions[phase];
    [...(legend?.querySelectorAll('i') ?? [])].forEach((swatch, index) => { swatch.style.backgroundColor = PALETTES[modes[phase]][index]; });
    updateScene();
  }

  function renderFields() {
    const building = BUILDINGS.find(item => item.id === state.selected) ?? BUILDINGS[0];
    const score = scoreBuilding(building, state.weights).score;
    const comparison = comparisonFor(building, state.weights);
    const values = { place: `장소 ${building.id.toUpperCase()}`, id: building.id.toUpperCase(), score: format(score),
      'peer-count': format(comparison.count), unit: format(comparison.unit, 2),
      peers: comparison.peers.length ? comparison.peers.map(peer => `장소 ${peer.id.toUpperCase()} ${format(monthlyUnit(peer), 2)}만/㎡`).join(', ') : '비슷한 예시 없음' };
    for (const key of ['rent', 'deposit', 'area', 'slope', 'elevation']) values[key] = format(building[key]);
    values.year = Number.isFinite(building.year) ? String(building.year) : '자료 없음';
    for (const field of fields) if (Object.hasOwn(values, field.dataset.storyField)) {
      const value = values[field.dataset.storyField];
      field.textContent = value;
      field.dataset.missing = String(value === '자료 없음');
    }
    for (const unit of units) unit.hidden = values[unit.dataset.storyUnit] === '자료 없음';
    if (selection) selection.textContent = `${values.place} · 보증금 ${values.deposit}만 · 월세 ${values.rent}만 · ${score === null ? '점수 자료 없음' : `내 기준 ${values.score}점`}`;
  }

  return {
    update(next) {
      if (destroyed || !next) return;
      const key = JSON.stringify({ selected: next.selected, weights: next.weights, saved: next.saved });
      if (key === stateKey) return;
      stateKey = key;
      state = { selected: next.selected, weights: { ...next.weights }, saved: [...(next.saved ?? [])] };
      renderFields();
      showPhase(phase ?? 'price');
      updateScene();
    },
    updateScroll({ reduced = false } = {}) {
      if (destroyed) return;
      const viewport = root?.ownerDocument?.defaultView?.innerHeight;
      const rect = root?.getBoundingClientRect?.();
      const active = String(Number.isFinite(viewport) && viewport > 0 && rect?.bottom > viewport * .9 && rect?.top < viewport);
      if (root && root.dataset.storyActive !== active) root.dataset.storyActive = active;
      const result = storyPhaseForSteps(steps.map(step => step.getBoundingClientRect()), viewport);
      showPhase(result.phase);
      if (!reduced && (lastProgress === undefined || Math.abs(lastProgress - result.progress) >= .002)) {
        lastProgress = result.progress;
        owner?.setProgress(result.progress);
      }
    },
    destroy() {
      destroyed = true;
      if (root) for (const [key, value] of Object.entries(originalRoot)) { if (value === undefined) delete root.dataset[key]; else root.dataset[key] = value; }
      if (element) { if (initialMode === undefined) delete element.dataset.storyMode; else element.dataset.storyMode = initialMode; }
      for (const { panel, hidden, aria } of originalPanels) { panel.hidden = hidden; if (aria === null) panel.removeAttribute('aria-hidden'); else panel.setAttribute('aria-hidden', aria); }
      for (const { link, aria } of originalLinks) { if (aria === null) link.removeAttribute('aria-current'); else link.setAttribute('aria-current', aria); }
    },
  };
}
