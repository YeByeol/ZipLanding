import { BUILDINGS, scoreBuilding, monthlyUnit, comparisonFor } from './demo.mjs';
import { PALETTES, mixColor } from './city.mjs';
import { PHASES as phases, MODES as modes, storyTimeline } from './story-timeline.mjs';
import { presentationForProgress } from './scene-model.mjs';

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
  return { phase: phases[index], progress: Math.max(0, Math.min(1, (-tops[0]) / (tops.at(-1) - tops[0]))) };
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
  const originalRoot = Object.fromEntries(['storyPhase', 'storyEnhanced'].map(key => [key, root?.dataset[key]]));
  const initialMode = element?.dataset.storyMode;
  const originalPanels = panels.map(panel => ({ panel, hidden: panel.hidden, aria: panel.getAttribute('aria-hidden'), opacity: panel.style.opacity }));
  const originalLinks = links.map(link => ({ link, aria: link.getAttribute('aria-current') }));
  const viewport = root?.ownerDocument?.defaultView;
  const lowHeight = viewport?.matchMedia?.('(max-height: 620px)');
  let enhanced = !(lowHeight?.matches ?? viewport?.innerHeight <= 620);
  let phase, state, stateKey, sceneKey, presentationKey, progress = 0, reduced = false, destroyed = false;
  let timeline = storyTimeline(0);
  const captionOpacity = caption?.style.opacity;
  if (root) root.dataset.storyEnhanced = String(enhanced);

  function updatePresentation() {
    if (!state) return;
    const building = BUILDINGS.find(item => item.id === state.selected) ?? BUILDINGS[0];
    const colors = enhanced ? timeline : storyTimeline(0);
    const frame = { ...presentationForProgress(progress, building, { reduced: reduced || !enhanced }),
      colorBlend: { from: modes[colors.from], to: modes[colors.to], mix: colors.blend } };
    const key = JSON.stringify(frame);
    if (key === presentationKey) return;
    presentationKey = key;
    owner?.setPresentation(frame);
  }

  function showPanels() {
    for (const panel of panels) {
      const index = phases.indexOf(panel.dataset.storyPanel);
      const opacity = enhanced ? timeline.opacities[index] ?? 0 : 1;
      panel.style.opacity = String(opacity);
      panel.hidden = opacity === 0;
      panel.setAttribute('aria-hidden', String(enhanced && panel.dataset.storyPanel !== phase));
    }
    const colors = enhanced ? timeline : storyTimeline(0);
    [...(legend?.querySelectorAll('i') ?? [])].forEach((swatch, index) => {
      swatch.style.backgroundColor = mixColor(PALETTES[modes[colors.from]][index], PALETTES[modes[colors.to]][index], colors.blend);
    });
    if (caption) {
      const visible = timeline.opacities.findIndex(opacity => opacity > 0);
      const textPhase = enhanced ? phases[visible < 0 ? phases.indexOf(timeline.to) : visible] : 'price';
      caption.textContent = captions[textPhase];
      caption.style.opacity = String(enhanced ? Math.max(...timeline.opacities) : 1);
    }
  }

  function updateScene() {
    if (!state) return;
    const key = stateKey;
    if (key === sceneKey) return;
    sceneKey = key;
    owner?.update({ ...state, weights: { ...state.weights }, saved: [...state.saved], mode: 'price' });
  }

  function showPhase(next) {
    if (next === phase) return;
    phase = next;
    if (root) root.dataset.storyPhase = phase;
    if (element) element.dataset.storyMode = modes[phase];
    for (const link of links) {
      const target = link.dataset.storyLink || link.getAttribute('href')?.replace('#story-', '');
      if (target === phase) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    }
  }

  function renderFields() {
    const building = BUILDINGS.find(item => item.id === state.selected) ?? BUILDINGS[0];
    const score = scoreBuilding(building, state.weights).score;
    const comparison = comparisonFor(building, state.weights);
    const values = { place: `장소 ${building.id.toUpperCase()}`, id: building.id.toUpperCase(), score: format(score),
      'peer-count': format(comparison.count), unit: format(comparison.unit, 2),
      peers: comparison.peers.length ? comparison.peers.slice(0, 3).map(peer => `장소 ${peer.id.toUpperCase()} ${format(monthlyUnit(peer), 2)}만/㎡`).join(', ') + (comparison.peers.length > 3 ? ` 외 ${comparison.peers.length - 3}곳` : '') : '비슷한 예시 없음' };
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
      showPanels();
      updateScene();
      updatePresentation();
    },
    updateScroll({ reduced: preference = false } = {}) {
      if (destroyed) return;
      const preferenceChanged = reduced !== preference;
      reduced = preference;
      const nextEnhanced = !(lowHeight?.matches ?? viewport?.innerHeight <= 620);
      if (enhanced !== nextEnhanced || preferenceChanged) {
        enhanced = nextEnhanced;
        presentationKey = undefined;
        if (root) root.dataset.storyEnhanced = String(enhanced);
      }
      const result = storyPhaseForSteps(steps.map(step => step.getBoundingClientRect()), viewport?.innerHeight);
      progress = result.progress;
      timeline = storyTimeline(progress, phase, { reduced });
      showPhase(timeline.phase);
      showPanels();
      updatePresentation();
    },
    destroy() {
      destroyed = true;
      if (root) for (const [key, value] of Object.entries(originalRoot)) { if (value === undefined) delete root.dataset[key]; else root.dataset[key] = value; }
      if (element) { if (initialMode === undefined) delete element.dataset.storyMode; else element.dataset.storyMode = initialMode; }
      if (caption) caption.style.opacity = captionOpacity ?? '';
      for (const { panel, hidden, aria, opacity } of originalPanels) { panel.hidden = hidden; panel.style.opacity = opacity ?? ''; if (aria === null) panel.removeAttribute('aria-hidden'); else panel.setAttribute('aria-hidden', aria); }
      for (const { link, aria } of originalLinks) { if (aria === null) link.removeAttribute('aria-current'); else link.setAttribute('aria-current', aria); }
    },
  };
}
