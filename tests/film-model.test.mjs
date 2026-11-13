import {TRANSITION_WINDOW} from '../scripts/story-timeline.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILDINGS, scoreBuilding, monthlyUnit } from '../scripts/demo.mjs';
const model = await import('../scripts/film-model.mjs').catch(() => ({}));

test('film demonstrates equal to80/10/10 using actual scores and immutable prices', () => {
  assert.equal(typeof model.filmSnapshot, 'function');
  const start = model.filmSnapshot(0), final = model.filmSnapshot(3/7);
  assert.deepEqual(start.cards.map(card => Math.round(card.score)), [37,45,52]);
  assert.deepEqual(final.weights, {slope:80,elevation:10,age:10});
  assert.deepEqual(final.cards.map(card => Math.round(card.score)), [80,74,65]);
  assert.deepEqual(final.cards.map(card => card.id), ['a','b','c']);
  for (let i=0;i<3;i++) {
    assert.equal(final.cards[i].rent, BUILDINGS[i].rent);
    assert.equal(final.cards[i].score, scoreBuilding(BUILDINGS[i],final.weights).score);
    assert.equal(start.cards[i].unit, final.cards[i].unit);
  }
  const midway = model.filmSnapshot((2.5/7+TRANSITION_WINDOW)+(1/7-2*TRANSITION_WINDOW)*.2);
  assert.ok(midway.weights.slope>100/3 && midway.weights.slope<80);
  assert.equal(midway.cards[0].score,scoreBuilding(BUILDINGS[0],midway.weights).score);
  assert.equal(final.fields.unit,'1.70');
  assert.equal(final.fields.year,'1995');
  assert.equal(final.fields['year-c'],'2007');
  assert.equal(monthlyUnit(BUILDINGS[0]).toFixed(2), final.fields.unit);
});

test('film value story uses two real peers and preserves X missingness', () => {
  assert.equal(typeof model.filmSnapshot,'function');
  const value=model.filmSnapshot(5/7), evidence=model.filmSnapshot(6/7);
  assert.equal(value.comparison.count,2); assert.equal(value.comparison.percent,null);
  assert.deepEqual(value.comparison.peers.map(b=>b.id),['k','v']);
  assert.deepEqual(value.highlightIds,['a','k','v']);
  assert.equal(value.fields['peer-count'],'2');
  assert.match(value.fields['peer-summary'],/K 3.41만\/㎡.*V 2.54만\/㎡/);
  assert.doesNotMatch(value.fields['peer-summary'],/%/);
  assert.equal(evidence.selected,'x');
  for(const key of ['x-slope','x-elevation','x-year','x-score']) assert.equal(evidence.fields[key],'자료 없음');
  assert.equal(evidence.frame.selected,'x');
  assert.deepEqual(evidence.frame.weights,evidence.weights);
});

test('price bars compare A and the two actual peers on one zero-based axis', () => {
  const snapshot=model.filmSnapshot(5/7);
  assert.deepEqual(snapshot.priceBars?.map(row=>row.id),['a','k','v']);
  const maximum=Math.max(...snapshot.priceBars.map(row=>monthlyUnit(BUILDINGS.find(b=>b.id===row.id))));
  for(const row of snapshot.priceBars){
    assert.equal(row.unit,monthlyUnit(BUILDINGS.find(b=>b.id===row.id)));
    assert.equal(row.ratio,row.unit/maximum);
    assert.equal(snapshot.fields['unit-'+row.id],row.unit.toFixed(2));
    assert.ok(row.ratio>0&&row.ratio<=1);
  }
  assert.ok(Math.abs(snapshot.priceBars[0].ratio-.5)<1e-12);
  assert.deepEqual(model.filmSnapshot(0).priceBars,snapshot.priceBars,'preferences cannot change money');
});

test('atelier film has different authored compositions and deterministic formations',()=>{
 const frames=Array.from({length:8},(_,i)=>model.filmSnapshot(i/7).frame);
 assert.ok(frames[0].composition.desktop.x>.6);assert.ok(frames[1].composition.desktop.x<.4);
 assert.ok(frames[4].composition.desktop.x>.5&&frames[4].composition.desktop.x<.6);assert.equal(frames[4].formation.from,'comparison');
 assert.equal(frames[5].formation.from,'value');assert.equal(frames[6].formation.from,'evidence');
 for(let i=0;i<=100;i++){
  const p=i/100,a=model.filmSnapshot(p,'discover').frame,b=model.filmSnapshot(p,'closing').frame;
  assert.deepEqual(a,b);assert.equal(a.fit,undefined);
  assert.equal(a.composition.mobile.x,.5);assert.ok(a.composition.mobile.y>=.3&&a.composition.mobile.y<=.44);
  const reduced=model.filmSnapshot(p,undefined,{reduced:true}).frame;
  assert.equal(reduced.formation.from,reduced.formation.to);assert.equal(reduced.formation.mix,0);
  const complete=model.filmSnapshot(p,undefined,{complete:true}).frame;
  assert.equal(complete.formation.from,'discover');assert.equal(complete.formation.to,'discover');
 }
});

test('all eight chapters have deterministic scroll beats and completed accessible variants', () => {
  assert.equal(typeof model.filmSnapshot,'function');
  const phases=['discover','price','conditions','criteria','comparison','value','evidence','closing'];
  for (let i=0;i<8;i++) {
    const start=Math.max(0,(i-.5)/7+TRANSITION_WINDOW), width=i===0?.5/7-TRANSITION_WINDOW:1/7-2*TRANSITION_WINDOW;
    const a=model.filmSnapshot(start+width*.05), b=model.filmSnapshot(start+width*.42);
    assert.notDeepEqual(a.beats[phases[i]],b.beats[phases[i]],phases[i]+' has actual scroll-authored graphics');
    const held=model.filmSnapshot(start+width*.7);
    assert.deepEqual(held.beats[phases[i]],[1,1,1]);
    const reverse=model.filmSnapshot(start+width*.42,'closing');
    assert.deepEqual(b.frame,reverse.frame,'history cannot alter camera/colors/data');
  }
  for(const options of [{reduced:true},{complete:true}]) {
    const snapshot=model.filmSnapshot(3/7,'criteria',options);
    assert.ok(Object.values(snapshot.beats).flat().every(v=>v===1));
    assert.deepEqual(snapshot.weights,{slope:80,elevation:10,age:10});
    assert.equal(snapshot.frame.formation.from,options.complete?'discover':'criteria');
    assert.equal(snapshot.fields.rent,'35');
  }
});

test('reduced formation follows the authoritative text phase on both sides of hysteresis',()=>{
 for(const [progress,previous,expected] of [[5.5/7+.001,'value','value'],[5.5/7-.001,'evidence','evidence']]){
  const snapshot=model.filmSnapshot(progress,previous,{reduced:true});
  assert.equal(snapshot.timeline.phase,expected);
  assert.deepEqual(snapshot.frame.formation,{from:expected,to:expected,mix:0});
 }
});

test('automatic criteria colors stay continuous across discrete interactive score bins',async()=>{
 const {colorFor,colorFrameForTransition}=await import('../scripts/city.mjs');
 const b=BUILDINGS[1];
 let lo=2.5/7+TRANSITION_WINDOW,hi=3/7;
 for(let n=0;n<40;n++){const p=(lo+hi)/2;if(model.filmSnapshot(p).cards[1].score<60)lo=p;else hi=p;}
 const p=(lo+hi)/2,before=model.filmSnapshot(p-1e-7),after=model.filmSnapshot(p+1e-7);
 assert.notEqual(colorFor(b,BUILDINGS,'score',before.weights),colorFor(b,BUILDINGS,'score',after.weights),'the example crosses a real20-point bin');
 const a=colorFrameForTransition(b,BUILDINGS,before.frame.colorBlend,before.weights).color;
 const z=colorFrameForTransition(b,BUILDINGS,after.frame.colorBlend,after.weights).color;
 const rgb=hex=>hex.slice(1).match(/../g).map(value=>parseInt(value,16));
 assert.ok(rgb(a).every((value,index)=>Math.abs(value-rgb(z)[index])<=1),'film colors cannot jump at interactive bin boundaries');
 assert.deepEqual(model.filmSnapshot(p-1e-7,'closing').frame,before.frame);
});

test('monthly cost summary reuses the unrounded unit conversion and remains fixed through the story',()=>{
 const a=BUILDINGS.find(building=>building.id==='a');
 const total=monthlyUnit(a)*a.area,depositMonthly=total-a.rent;
 const expected={'monthly-cost':total.toFixed(2),'deposit-monthly':depositMonthly.toFixed(2)};
 assert.deepEqual(expected,{'monthly-cost':'39.17','deposit-monthly':'4.17'});
 for(const progress of [0,.4,5/7,6/7,1])for(const options of [{},{reduced:true},{complete:true}]){
  const fields=model.filmSnapshot(progress,undefined,options).fields;
  assert.equal(fields['monthly-cost'],expected['monthly-cost']);
  assert.equal(fields['deposit-monthly'],expected['deposit-monthly']);
  assert.notEqual(fields['monthly-cost'],(Number(fields.unit)*a.area).toFixed(2),'do not multiply the rounded1.70 display back into a monthly total');
  assert.ok(Math.abs(Number(fields['monthly-cost'])-Number(fields['deposit-monthly'])-a.rent)<1e-12);
 }
});
