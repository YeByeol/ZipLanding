import test from 'node:test';
import assert from 'node:assert/strict';
import * as city from '../scripts/city.mjs';
const timelineModule = await import('../scripts/story-timeline.mjs').catch(() => ({}));

test('one timeline holds each reading pose and uses smooth, history-free transitions', () => {
  assert.equal(typeof timelineModule.storyTimeline, 'function');
  const { storyTimeline, PHASES } = timelineModule;
  for (const [index, p] of [0, 1/7, 2/7, 3/7, 4/7, 5/7, 6/7, 1].entries()) {
    const frame = storyTimeline(p);
    assert.equal(frame.from, PHASES[index]); assert.equal(frame.to, PHASES[index]);
    assert.deepEqual(frame.opacities, PHASES.map((_, i) => +(i === index)));
  }
  for (const boundary of Array.from({length:7},(_,i)=>(i+.5)/7)) {
    for (const p of [boundary - timelineModule.TRANSITION_WINDOW, boundary, boundary + timelineModule.TRANSITION_WINDOW]) {
      const forward = storyTimeline(p, 'discover'), reverse = storyTimeline(p, 'closing');
      const physical = ({ phase, ...rest }) => rest;
      assert.deepEqual(physical(forward), physical(reverse));
    }
    const center = storyTimeline(boundary);
    assert.ok(Math.abs(center.blend - .5) < 1e-12);
    assert.deepEqual(center.opacities, Array(8).fill(0), 'only the handoff point hides both panels without overlapping titles');
    const epsilon = 1e-6;
    for (const edge of [boundary - timelineModule.TRANSITION_WINDOW, boundary + timelineModule.TRANSITION_WINDOW]) {
      const speed = Math.abs(storyTimeline(edge + epsilon).blend - storyTimeline(edge - epsilon).blend) / (2 * epsilon);
      // Adjacent holds use blend 0; compare the interpolated phase coordinate instead.
      const coordinate = p => { const f = storyTimeline(p); return PHASES.indexOf(f.from) + (PHASES.indexOf(f.to) - PHASES.indexOf(f.from)) * f.blend; };
      assert.ok(Math.abs(coordinate(edge + epsilon) - coordinate(edge - epsilon)) / (2 * epsilon) < .001);
      assert.ok(Number.isFinite(speed));
      const h = 1e-6;
      const acceleration = Math.abs(coordinate(edge + h) - 2 * coordinate(edge) + coordinate(edge - h)) / h ** 2;
      assert.ok(acceleration < .1, 'transition acceleration reaches zero beside each hold');
    }
  }
});

test('logical phase alone has hysteresis, supports seeks, and reduced motion has one readable panel', () => {
  assert.equal(typeof timelineModule.storyTimeline, 'function');
  const { storyTimeline } = timelineModule;
  let phase = 'discover'; const boundary=.5/7;
  for (const p of [boundary+.001,boundary-.001,boundary+.002]) {phase=storyTimeline(p,phase).phase;assert.equal(phase,'discover');}
  phase=storyTimeline(boundary+.007,phase).phase;assert.equal(phase,'price');
  assert.equal(storyTimeline(boundary-.001,phase).phase,'price');
  assert.equal(storyTimeline(1,phase).phase,'closing');
  assert.equal(storyTimeline(0,'closing').phase,'discover');
  const reduced=storyTimeline(3/7,'criteria',{reduced:true});
  assert.equal(reduced.from,'criteria'); assert.equal(reduced.to,'criteria');
  assert.deepEqual(reduced.opacities,[0,0,0,1,0,0,0,0]);
});

test('shared RGB transition blends endpoints and missingness independently of blended gray', () => {
  assert.equal(typeof city.colorFrameForTransition, 'function');
  assert.equal(typeof city.mixColor, 'function');
  const building = { id: 'x', slope: null, elevation: null, year: null, rent: 10, deposit: 0, area: 20 };
  const frame = city.colorFrameForTransition(building, [building], { from: 'price', to: 'terrain', mix: .5 });
  assert.equal(frame.missing, .5);
  assert.equal(frame.color, city.mixColor(city.colorFor(building, [building], 'price'), '#d9d6cf', .5));
  assert.equal(city.mixColor('#000000', '#ffffff', .5), '#808080');
});

test('floating point fade endpoints remain bounded so zero-opacity panels can be hidden', () => {
  const { storyTimeline } = timelineModule;
  for (const boundary of Array.from({length:7},(_,i)=>(i+.5)/7)) for (let power = 3; power < 16; power++) {
    const p = boundary - timelineModule.TRANSITION_WINDOW + .45 * (1 - 10 ** -power) * (2 * timelineModule.TRANSITION_WINDOW);
    const frame = storyTimeline(p);
    assert.ok(frame.opacities.every(value => value >= 0 && value <= 1));
    assert.ok(frame.blend >= 0 && frame.blend <= 1);
  }
});

test('large camera transitions use the wider shared progress window before each reading hold',()=>{
 const frame=timelineModule.storyTimeline(.5/7+.04);
 assert.equal(frame.from,'discover');assert.equal(frame.to,'price');assert.ok(frame.blend<1&&frame.blend>0);
});

test('each handoff keeps copy readable through most of the camera move without overlapping panels',()=>{
 const {storyTimeline,PHASES,TRANSITION_WINDOW:window}=timelineModule;
 const samples=2000,step=2*window/samples;
 for(let i=0;i<PHASES.length-1;i++){
  const boundary=(i+.5)/7;
  let unreadable=0,longestUnreadable=0,empty=0,longestEmpty=0;
  for(let sample=0;sample<=samples;sample++){
   const frame=storyTimeline(boundary-window+step*sample);
   assert.ok(frame.opacities.filter(alpha=>alpha>0).length<=1,'outgoing and incoming panels never overlap');
   const copy=frame.opacities.map((alpha,j)=>alpha*frame.entrances[PHASES[j]][1]);
   unreadable=Math.max(...copy)<.5?unreadable+1:0;
   empty=Math.max(...frame.opacities)===0?empty+1:0;
   longestUnreadable=Math.max(longestUnreadable,unreadable);
   longestEmpty=Math.max(longestEmpty,empty);
  }
  assert.ok(longestEmpty<=1,`${PHASES[i]} handoff has no fully empty progress interval`);
  assert.ok(longestUnreadable*step<=2*window*.2,`${PHASES[i]} copy stays readable for at least 80% of the camera transition`);
 }
});

test('effective reading layers remain continuous when scrolling or seeking across a handoff',()=>{
 const {storyTimeline,PHASES,TRANSITION_WINDOW:window}=timelineModule;
 const step=2*window/4000;
 for(let i=0;i<PHASES.length-1;i++){
  const start=(i+.5)/7-window;
  let previous;
  for(let sample=0;sample<=4000;sample++){
   const p=start+step*sample,forward=storyTimeline(p,'discover'),reverse=storyTimeline(p,'closing');
   const layers=frame=>frame.opacities.flatMap((alpha,j)=>frame.entrances[PHASES[j]].map(entrance=>alpha*entrance));
   const current=layers(forward);
   assert.deepEqual(current,layers(reverse),'physical reading layers do not depend on scroll history');
   assert.ok(current.every(alpha=>Number.isFinite(alpha)&&alpha>=0&&alpha<=1));
   if(previous)assert.ok(current.every((alpha,j)=>Math.abs(alpha-previous[j])<.01),'no layer pops in or disappears at an edge');
   previous=current;
  }
 }
});


test('typography and HUD enter in reading order, settle before each hold and seek identically',()=>{
 const {storyTimeline,PHASES,TRANSITION_WINDOW:window}=timelineModule;
 assert.deepEqual(storyTimeline(0).entrances.discover,[1,1,1]);
 for(let i=1;i<PHASES.length;i++){
  const phase=PHASES[i],boundary=(i-.5)/7,start=boundary,end=boundary+window;
  assert.deepEqual(storyTimeline(start).entrances[phase],[0,0,0]);
  assert.deepEqual(storyTimeline(end+1e-12).entrances[phase],[1,1,1]);
  let previous=[0,0,0];
  for(let sample=0;sample<=40;sample++){
   const p=start+(end-start)*sample/40,forward=storyTimeline(p,'discover').entrances[phase],reverse=storyTimeline(p,'closing').entrances[phase];
   assert.deepEqual(forward,reverse,'scroll direction and logical phase cannot alter the pose');
   assert.ok(forward.every((value,j)=>Number.isFinite(value)&&value>=previous[j]&&value>=0&&value<=1));
   assert.ok(forward[0]>=forward[1]&&forward[1]>=forward[2],'headline leads copy, then the information graphic');
   previous=forward;
  }
  const half=storyTimeline((start+end)/2).entrances[phase];
  assert.ok(half[0]>.9&&half[1]>.5&&half[2]>.2,'all three layers are readable while the camera is still moving');
  const moving=storyTimeline(boundary+window*.75);
  assert.notEqual(moving.from,moving.to,'the camera still has room to finish its move');
  assert.deepEqual(moving.entrances[phase],[1,1,1],'reading layers settle before the camera finishes');
 }
 for(const p of [0,.2,.5,1])assert.ok(Object.values(storyTimeline(p,undefined,{reduced:true}).entrances).every(values=>values.every(value=>value===1)));
});
