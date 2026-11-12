import { BUILDINGS, scoreBuilding, monthlyUnit, comparisonFor } from './demo.mjs';
import { PHASES, MODES, storyTimeline } from './story-timeline.mjs';
import { presentationForProgress } from './scene-model.mjs';

const IDS = ['a','b','c'];
const FINAL = Object.freeze({slope:80,elevation:10,age:10});
const format = (value, digits=0) => Number.isFinite(value) ? value.toLocaleString('ko-KR',{maximumFractionDigits:digits}) : '자료 없음';
const a = BUILDINGS[0];
const x = BUILDINGS.find(building=>building.id==='x');
const fieldValue = (building,key) => key==='year'&&Number.isFinite(building[key])?String(building[key]):format(building[key]);

export function filmSnapshot(progress, previousPhase, {reduced=false,complete=false}={}) {
  const timeline=storyTimeline(progress,previousPhase,{reduced});
  const beats=complete?Object.fromEntries(PHASES.map(phase=>[phase,[1,1,1]])):timeline.beats;
  const amount=reduced||complete?1:beats.criteria[1];
  const weights=Object.fromEntries(Object.entries(FINAL).map(([key,value])=>[key,100/3+(value-100/3)*amount]));
  const cards=IDS.map(id=>{
    const building=BUILDINGS.find(item=>item.id===id);
    return {...building,score:scoreBuilding(building,weights).score,unit:monthlyUnit(building)};
  });
  const comparison=comparisonFor(a,FINAL);
  const pricePlaces=[a,...comparison.peers];
  const priceMaximum=Math.max(...pricePlaces.map(monthlyUnit));
  const priceBars=pricePlaces.map(building=>({id:building.id,unit:monthlyUnit(building),ratio:monthlyUnit(building)/priceMaximum}));
  const index=PHASES.indexOf(timeline.from)+(PHASES.indexOf(timeline.to)-PHASES.indexOf(timeline.from))*timeline.blend;
  const selected=index>=5.5&&index<6.5?'x':'a';
  const highlightIds=index>=4.5&&index<5.5?['a',...comparison.peers.map(peer=>peer.id)]:index>=3.5&&index<4.5?[...IDS]:[selected];
  const fields={};
  for(const key of ['rent','deposit','area','slope','elevation','year']) fields[key]=fieldValue(a,key);
  fields.unit=monthlyUnit(a).toFixed(2);
  fields['peer-count']=String(comparison.count);
  fields['peer-summary']=comparison.peers.map(peer=>`장소 ${peer.id.toUpperCase()} ${monthlyUnit(peer).toFixed(2)}만/㎡`).join(' · ');
  for(const row of priceBars)fields['unit-'+row.id]=row.unit.toFixed(2);
  for(const card of cards) {
    fields[`score-${card.id}`]=format(card.score);
    for(const key of ['rent','deposit','area','slope','elevation','year']) fields[`${key}-${card.id}`]=fieldValue(card,key);
    fields[`unit-${card.id}`]=card.unit.toFixed(2);
  }
  for(const key of Object.keys(FINAL)) fields[`weight-${key}`]=format(weights[key],1);
  for(const key of ['slope','elevation','year']) fields[`x-${key}`]=fieldValue(x,key);
  fields['x-score']=format(scoreBuilding(x,weights).score);
  const colors=complete?storyTimeline(0):timeline;
  const frame={...presentationForProgress(progress,a,{reduced:reduced||complete}),
    colorBlend:{from:MODES[colors.from],to:MODES[colors.to],mix:colors.blend,continuous:true},
    weights,selected:complete?'a':selected,highlightIds:complete?['a']:highlightIds,saved:[...IDS]};
  return {timeline,beats,weights,selected,highlightIds,cards,comparison,priceBars,fields,frame};
}
