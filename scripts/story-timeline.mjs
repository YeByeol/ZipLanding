export const PHASES = Object.freeze(['discover','price','conditions','criteria','comparison','value','evidence','closing']);
export const MODES = Object.freeze({ discover:'price',price:'price',conditions:'terrain',criteria:'score',comparison:'score',value:'price',evidence:'score',closing:'price' });
const BOUNDARIES = Array.from({length:7},(_,i)=>(i+.5)/7);
export const TRANSITION_WINDOW = .045;
const WINDOW = TRANSITION_WINDOW;
const DEADBAND = .006;
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return clamp(t * t * t * (t * (t * 6 - 15) + 10)); };

export function storyTimeline(progress, previousPhase, { reduced = false } = {}) {
  const p = Number.isFinite(progress) ? clamp(progress) : 0;
  let logical = PHASES.indexOf(previousPhase);
  if (logical < 0) logical = BOUNDARIES.filter(boundary => p >= boundary).length;
  else {
    while (logical < PHASES.length-1 && p > BOUNDARIES[logical] + DEADBAND) logical++;
    while (logical > 0 && p < BOUNDARIES[logical - 1] - DEADBAND) logical--;
  }
  const phase = PHASES[logical];
  const opacities = Array(PHASES.length).fill(0);
  // Reading layers arrive during the camera handoff and settle before data begins.
  const entrances=Object.fromEntries(PHASES.map((name,i)=>{
    if(reduced||i===0)return[name,[1,1,1]];
    const start=BOUNDARIES[i-1]+WINDOW*.1;
    const local=clamp((p-start)/(WINDOW*.9));
    return[name,[smooth(local/.62),smooth((local-.08)/.72),smooth((local-.18)/.82)]];
  }));
  const beats = Object.fromEntries(PHASES.map((name,i)=>{
    const start=i===0?0:BOUNDARIES[i-1]+WINDOW;
    const end=i===PHASES.length-1?1:BOUNDARIES[i]-WINDOW;
    const local=clamp((p-start)/(end-start));
    return [name,reduced?[1,1,1]:[smooth(local/.32),smooth((local-.08)/.32),smooth((local-.16)/.32)]];
  }));
  if (reduced) { opacities[logical] = 1; return { phase, from: phase, to: phase, blend: 0, opacities, beats, entrances }; }
  const index = BOUNDARIES.findIndex(boundary => p > boundary - WINDOW && p < boundary + WINDOW);
  if (index < 0) {
    const held = BOUNDARIES.filter(boundary => p >= boundary).length;
    opacities[held] = 1;
    return { phase, from: PHASES[held], to: PHASES[held], blend: 0, opacities, beats, entrances };
  }
  const t = (p - (BOUNDARIES[index] - WINDOW)) / (2 * WINDOW);
  opacities[index] = t < .45 ? 1 - smooth(t / .45) : 0;
  opacities[index + 1] = t > .55 ? smooth((t - .55) / .45) : 0;
  return { phase, from: PHASES[index], to: PHASES[index + 1], blend: smooth(t), opacities, beats, entrances };
}
