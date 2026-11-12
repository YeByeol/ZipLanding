import test from 'node:test';
import assert from 'node:assert/strict';
import {storyPhaseForSteps,mountStory} from '../scripts/story.mjs';
import {PHASES} from '../scripts/story-timeline.mjs';
import {filmSnapshot} from '../scripts/film-model.mjs';
const rects=tops=>tops.map(top=>({top}));
function node(dataset={}) {
 const attrs=new Map(),vars=new Map();
 return {dataset,style:{setProperty:(k,v)=>vars.set(k,v),getPropertyValue:k=>vars.get(k)??'',removeProperty:k=>vars.delete(k)},hidden:false,textContent:'',setAttribute:(k,v)=>attrs.set(k,String(v)),getAttribute:k=>attrs.get(k)??null,removeAttribute:k=>attrs.delete(k)};
}
function fixture() {
 let p=0,low=false;
 const steps=PHASES.map((phase,i)=>({...node({storyStep:phase}),getBoundingClientRect:()=>({top:i*1120-p*7840})}));
 const panels=PHASES.map(phase=>node({storyPanel:phase})),links=PHASES.map(phase=>node({storyLink:phase}));
 const names=Object.keys(filmSnapshot(0).fields),fields=names.map(name=>node({filmField:name}));
 const weights=['slope','elevation','age'].map(name=>node({filmWeight:name}));
 const swatches=Array.from({length:5},()=>node()),caption=node(),selection=node();
 const root={...node(),ownerDocument:{defaultView:{innerHeight:800,matchMedia:q=>({get matches(){return q==='(max-height: 620px)'&&low;}})}},querySelectorAll:s=>({'[data-story-step]':steps,'[data-story-panel]':panels,'[data-story-link]':links,'[data-film-field]':fields,'[data-film-weight]':weights}[s]??[]),querySelector:s=>({'#story-caption':caption,'#story-legend':{querySelectorAll:()=>swatches},'#hero-selection':selection}[s])};
 const element=node(),frames=[],updates=[];
 const controller=mountStory({root,element,owner:{setPresentation:f=>frames.push(f),update:s=>updates.push(s)}});
 return {root,element,panels,links,fields,weights,swatches,caption,selection,frames,updates,controller,seek(value,reduced=false){p=value;controller.updateScroll({reduced});},low(value){low=value;controller.updateScroll();}};
}
test('eight-waypoint geometry is finite and the pure phase follows chapter centers',()=>{
 for(let i=0;i<8;i++) {const result=storyPhaseForSteps(rects(PHASES.map((_,j)=>j*1120-i*1120)),800);assert.equal(result.phase,PHASES[i]);assert.equal(result.progress,i/7);}
 for(const tops of [undefined,[],new Array(8),rects([0,1,2]),rects([0,1,2,3,4,5,6,NaN]),rects([0,1,2,3,4,7,6,8])]) assert.deepEqual(storyPhaseForSteps(tops,800),{phase:'discover',progress:0});
 for(const v of [0,-1,NaN,Infinity,undefined])assert.deepEqual(storyPhaseForSteps(rects(PHASES.map((_,i)=>i)),v),{phase:'discover',progress:0});
});
test('film fields, bars and renderer share one snapshot while visitor data stays independent',()=>{
 const v=fixture(); const visitor=Object.freeze({selected:'x',weights:Object.freeze({slope:0,elevation:100,age:0}),saved:Object.freeze([]),mode:'value'});const original=JSON.stringify(visitor);
 v.controller.update(visitor);v.seek(3/7);
 assert.equal(v.fields.find(f=>f.dataset.filmField==='score-a').textContent,'80');
 assert.equal(v.fields.find(f=>f.dataset.filmField==='rent').textContent,'35');
 assert.deepEqual(v.frames.at(-1).weights,{slope:80,elevation:10,age:10});
 assert.equal(v.frames.at(-1).selected,'a');
 assert.equal(v.weights[0].style.transform,'scaleX(0.8)');assert.equal(v.weights[0].getAttribute('aria-valuenow'),'80');
 assert.ok(v.panels[3].style.getPropertyValue('--beat-3')==='1');
 assert.equal(v.updates.length,0,'visitor state never enters the story renderer');
 const frame=v.frames.at(-1),calls=v.frames.length;v.controller.update({selected:'b',weights:{slope:100,elevation:0,age:0},saved:['x']});v.seek(3/7);
 assert.equal(v.frames.length,calls);assert.deepEqual(v.frames.at(-1),frame);assert.equal(JSON.stringify(visitor),original);
});
test('eight panel fades and beats rewind exactly and metadata alone has hysteresis',()=>{
 const v=fixture(),boundary=2.5/7;
 v.seek(boundary-.0175);assert.ok(+v.panels[2].style.opacity>0&&+v.panels[2].style.opacity<1);assert.equal(v.panels[2].hidden,false);
 v.seek(boundary);assert.ok(v.panels.every(p=>p.hidden));assert.equal(v.caption.style.opacity,'0');
 const phase=v.root.dataset.storyPhase;for(const p of [boundary+.001,boundary-.001,boundary+.002]){v.seek(p);assert.equal(v.root.dataset.storyPhase,phase);}
 const p=boundary+.035+.02;v.seek(p);const frame=v.frames.at(-1),beats=v.panels[3].style.getPropertyValue('--beat-2');v.seek(1);v.seek(p);
 assert.deepEqual(v.frames.at(-1),frame);assert.equal(v.panels[3].style.getPropertyValue('--beat-2'),beats);
 assert.equal(v.links.find(l=>l.getAttribute('aria-current')==='step').dataset.storyLink,'criteria');
});
test('low height exposes completed eight chapters with final truthful demo and actively wide camera',()=>{
 const v=fixture();v.seek(2/7);assert.equal(v.frames.at(-1).zoom,2.6);v.low(true);
 assert.equal(v.root.dataset.storyEnhanced,'false');assert.ok(v.panels.every(p=>!p.hidden&&p.style.opacity==='1'&&p.getAttribute('aria-hidden')==='false'));
 assert.ok(v.panels.every(p=>[1,2,3].every(i=>p.style.getPropertyValue('--beat-'+i)==='1')));assert.equal(v.frames.at(-1).zoom,1.05);
 assert.equal(v.fields.find(f=>f.dataset.filmField==='score-a').textContent,'80');assert.equal(v.fields.find(f=>f.dataset.filmField==='rent').textContent,'35');
 v.low(false);assert.equal(v.frames.at(-1).zoom,2.6);assert.equal(v.panels.filter(p=>!p.hidden).length,1);
 v.controller.destroy();assert.equal(v.root.dataset.storyEnhanced,undefined);assert.ok(v.panels.every(p=>!p.hidden));
});
test('reduced motion completes graphics, keeps one stable panel, missing X and stationary camera',()=>{
 const v=fixture();v.seek(6/7,true);assert.equal(v.root.dataset.storyPhase,'evidence');assert.equal(v.panels.filter(p=>!p.hidden).length,1);assert.equal(v.frames.at(-1).zoom,1.05);
 assert.ok(v.fields.filter(f=>f.dataset.filmField.startsWith('x-')).every(f=>f.textContent==='자료 없음'&&f.dataset.missing==='true'));
 assert.equal(v.fields.find(f=>f.dataset.filmField==='peer-count').textContent,'2');
 assert.equal(v.frames.at(-1).colorBlend.from,'score');
 const center=v.frames.at(-1).target;v.seek(1,true);assert.deepEqual(v.frames.at(-1).target,center);
 v.controller.destroy();const calls=v.frames.length;v.seek(0);v.controller.update({});assert.equal(v.frames.length,calls);
});

test('automatic bars use exact snapshot weights even when rounded number text holds',()=>{
 const v=fixture();const p=.409889;v.seek(p);
 const before=v.fields.find(f=>f.dataset.filmField==='weight-slope').textContent;
 v.seek(p+.0000001);
 assert.equal(v.fields.find(f=>f.dataset.filmField==='weight-slope').textContent,before,'tiny scroll keeps rounded readable numbers');
 assert.equal(v.weights[0].style.transform,`scaleX(${filmSnapshot(p+.0000001).weights.slope/100})`,'graphic follows exact same weights as the city');
});
