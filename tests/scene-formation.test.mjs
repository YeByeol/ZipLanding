import test from 'node:test';
import assert from 'node:assert/strict';
import {atelierPresentation,clampFormation,formationPose,neighborhoodPresence} from '../scripts/scene-formation.mjs';
import {PHASES,TRANSITION_WINDOW} from '../scripts/story-timeline.mjs';

test('formations contain only the actual story subjects and never turn values into geometry',()=>{
 const ids=['a','b','c','k','v','x'],expected=[['a'],['a'],['a'],['a'],['a','b','c'],['a','k','v'],['x'],['a']];
 PHASES.forEach((phase,i)=>{
  const formation={from:phase,to:phase,mix:0};
  assert.deepEqual(ids.filter(id=>formationPose(id,formation).scale>0),expected[i]);
  assert.equal(formationPose('unknown',formation).scale,0);
  for(const id of ids)assert.ok(Object.values(formationPose(id,formation)).every(Number.isFinite));
 });
 const triptych=expected[4].map(id=>formationPose(id,{from:'comparison'}));
 assert.ok(triptych[0].x<triptych[1].x&&triptych[1].x<triptych[2].x);
 assert.equal(triptych[0].scale,triptych[1].scale);assert.equal(triptych[1].scale,triptych[2].scale,'illustration scale does not encode score, rent or floor count');
});

test('formation seeks are history-free and enter and leave with zero velocity',()=>{
 const values=p=>['a','b','c','k','v','x'].flatMap(id=>Object.values(formationPose(id,atelierPresentation(p).formation)));
 for(let i=0;i<7;i++)for(const edge of [(i+.5)/7-TRANSITION_WINDOW,(i+.5)/7+TRANSITION_WINDOW]){
  const h=1e-6,a=values(edge-h),b=values(edge),c=values(edge+h);
  a.forEach((value,k)=>{
   assert.ok(Math.abs(c[k]-value)/(2*h)<.01);
   assert.ok(Math.abs(c[k]-2*b[k]+value)/(h*h)<2);
  });
 }
 for(const p of [0,.12,.41,.6,.8,1]){const a=values(p);values(1-p);assert.deepEqual(values(p),a);}
 assert.deepEqual(clampFormation({from:'invalid',to:'invalid',mix:Infinity}),{from:'discover',to:'discover',mix:0});
});

test('incoming and outgoing maquette solids have separate paths through every handoff',()=>{
 const ids=['a','b','c','k','v','x'];
 for(let chapter=0;chapter<7;chapter++)for(let sample=0;sample<=80;sample++){
  const formation={from:PHASES[chapter],to:PHASES[chapter+1],mix:sample/80};
  const visible=ids.map(id=>({id,...formationPose(id,formation)})).filter(p=>p.scale>.01);
  for(let i=0;i<visible.length;i++)for(let j=i+1;j<visible.length;j++){
   const a=visible[i],b=visible[j];
   const separated=Math.abs(a.x-b.x)>=.86*(a.scale+b.scale)||Math.abs(a.z-b.z)>=.73*(a.scale+b.scale);
   assert.ok(separated,`${formation.from}→${formation.to} ${formation.mix}: ${a.id}/${b.id} solids overlap`);
  }
 }
});

test('the neighborhood returns with the same place and fades on the shared formation clock',()=>{
 assert.equal(neighborhoodPresence({from:'discover'}),1);
 assert.equal(neighborhoodPresence({from:'closing'}),1);
 for(const from of ['price','conditions','criteria','comparison','value','evidence'])assert.equal(neighborhoodPresence({from}),0);
 for(const t of [0,.1,.5,.9,1]){
  assert.equal(neighborhoodPresence({from:'discover',to:'price',mix:t}),1-t);
  assert.equal(neighborhoodPresence({from:'evidence',to:'closing',mix:t}),t);
 }
});

test('incoming subjects wait for the reading handoff instead of surfacing behind outgoing proof',()=>{
 for(const id of ['b','c'])assert.equal(formationPose(id,{from:'criteria',to:'comparison',mix:.4}).scale,0);
 assert.ok(formationPose('b',{from:'criteria',to:'comparison',mix:.75}).scale>0);
 assert.equal(formationPose('x',{from:'evidence',to:'closing',mix:.6}).scale,0);
});
