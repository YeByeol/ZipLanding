import { PHASES, storyTimeline } from './story-timeline.mjs';

const clamp = value => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
const mix = (a, b, t) => a + (b - a) * t;
const SUBJECTS = {discover:['a'],price:['a'],conditions:['a'],criteria:['a'],comparison:['a','b','c'],value:['a','k','v'],evidence:['x'],closing:['a']};
const CAMERA = [
  [.66,.64,2.2,.65,.45,.72],
  [.48,.68,2.15,.30,.45,.72],
  [.72,.72,1.3,.60,.26,.52],
  [.94,.68,1.8,.32,.40,.52],
  [.12,.65,1.4,.588,.30,.56],
  [.2,.72,1.35,.32,.50,.40],
  [.58,.66,2.2,.63,.45,.72],
  [.66,.64,2.2,.65,.45,.72],
];
const MOBILE=[[.43,1.25],[.40,1.1],[.41,1.15],[.34,.95],[.31,1.1],[.31,1.25],[.32,.8],[.43,1.25]];
const COMPACT=[[.405,1.05],[.38,.95],[.40,1.05],[.34,.78],[.31,1.0],[.285,1.05],[.30,.60],[.36,.85]];
const TABLET=[null,[.24,.70],null,[.24,.68],null,[.25,.82],[.70,.80],null];

export function clampFormation(value) {
  const from = PHASES.includes(value?.from) ? value.from : 'discover';
  return {from,to:PHASES.includes(value?.to)?value.to:from,mix:clamp(value?.mix)};
}

function pose(id, phase) {
  const ids=SUBJECTS[phase], index=ids.indexOf(id), triptych=ids.length===3;
  if(index<0){
    // Incoming studies travel in front of outgoing ones, never through their walls.
    if(phase==='comparison'&&['k','v'].includes(id))return{x:id==='k'?0:2.1,y:-.3,z:3,scale:0};
    if(phase==='value'&&['b','c'].includes(id))return{x:id==='b'?0:1.3,y:-.3,z:-3,scale:0};
    if(phase==='evidence'&&['a','k','v'].includes(id))return{x:{a:-5,k:-3.5,v:-2}[id],y:-.3,z:0,scale:0};
    return{x:{a:-3,b:2.6,c:4.6,k:0,v:2.1,x:2.5}[id]??0,y:-.3,z:0,scale:0};
  }
  return {
    x:triptych?(index-1)*(phase==='value'?1.3:2.1):0,y:0,z:0,scale:triptych?(phase==='value'?.66:.78):1.35,
  };
}

export function formationPose(id, value) {
  const formation=clampFormation(value),a=pose(id,formation.from),b=pose(id,formation.to);
  return Object.fromEntries(['x','y','z','scale'].map(key=>[key,mix(a[key],b[key],formation.mix)]));
}

export function formationLayers(value) {
  const formation=clampFormation(value),layer=phase=>phase==='conditions'||phase==='criteria'?1:0;
  return mix(layer(formation.from),layer(formation.to),formation.mix);
}

export function atelierPresentation(progress,{reduced=false}={}) {
  const timeline=storyTimeline(progress,undefined,{reduced});
  const a=CAMERA[PHASES.indexOf(timeline.from)],b=CAMERA[PHASES.indexOf(timeline.to)];
  const values=a.map((value,i)=>mix(value,b[i],timeline.blend));
  const [yaw,pitch,zoom,x,y,targetY]=values;
  const mobileFrom=MOBILE[PHASES.indexOf(timeline.from)],mobileTo=MOBILE[PHASES.indexOf(timeline.to)];
  const mobileY=mix(mobileFrom[0],mobileTo[0],timeline.blend),mobileScale=mix(mobileFrom[1],mobileTo[1],timeline.blend);
  const compactFrom=COMPACT[PHASES.indexOf(timeline.from)],compactTo=COMPACT[PHASES.indexOf(timeline.to)];
  const tabletFrom=TABLET[PHASES.indexOf(timeline.from)]??[a[3],1],tabletTo=TABLET[PHASES.indexOf(timeline.to)]??[b[3],1];
  return {yaw,pitch,zoom,target:{x:0,y:targetY,z:0},
    composition:{desktop:{x,y},mobile:{x:.5,y:mobileY},mobileScale,
      compactDesktop:{x:mix(tabletFrom[0],tabletTo[0],timeline.blend),y,scale:mix(tabletFrom[1],tabletTo[1],timeline.blend)},
      compactMobile:{x:.5,y:mix(compactFrom[0],compactTo[0],timeline.blend),scale:mix(compactFrom[1],compactTo[1],timeline.blend)}},
    formation:{from:timeline.from,to:timeline.to,mix:timeline.blend}};
}
