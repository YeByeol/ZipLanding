export const PHASES = Object.freeze(['price', 'conditions', 'criteria', 'value']);
export const MODES = Object.freeze({ price: 'price', conditions: 'terrain', criteria: 'score', value: 'price' });
const BOUNDARIES = [1 / 6, .5, 5 / 6];
const WINDOW = .06;
const DEADBAND = .012;
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return clamp(t * t * t * (t * (t * 6 - 15) + 10)); };

export function storyTimeline(progress, previousPhase, { reduced = false } = {}) {
  const p = Number.isFinite(progress) ? clamp(progress) : 0;
  let logical = PHASES.indexOf(previousPhase);
  if (logical < 0) logical = BOUNDARIES.filter(boundary => p >= boundary).length;
  else {
    while (logical < 3 && p > BOUNDARIES[logical] + DEADBAND) logical++;
    while (logical > 0 && p < BOUNDARIES[logical - 1] - DEADBAND) logical--;
  }
  const phase = PHASES[logical];
  const opacities = [0, 0, 0, 0];
  if (reduced) { opacities[logical] = 1; return { phase, from: phase, to: phase, blend: 0, opacities }; }
  const index = BOUNDARIES.findIndex(boundary => p > boundary - WINDOW && p < boundary + WINDOW);
  if (index < 0) {
    const held = BOUNDARIES.filter(boundary => p >= boundary).length;
    opacities[held] = 1;
    return { phase, from: PHASES[held], to: PHASES[held], blend: 0, opacities };
  }
  const t = (p - (BOUNDARIES[index] - WINDOW)) / (2 * WINDOW);
  opacities[index] = t < .45 ? 1 - smooth(t / .45) : 0;
  opacities[index + 1] = t > .55 ? smooth((t - .55) / .45) : 0;
  return { phase, from: PHASES[index], to: PHASES[index + 1], blend: smooth(t), opacities };
}
