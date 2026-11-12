import test from 'node:test';
import assert from 'node:assert/strict';
import {storyPhaseForSteps,mountStory} from '../scripts/story.mjs';
import {PHASES} from '../scripts/story-timeline.mjs';
import {filmSnapshot} from '../scripts/film-model.mjs';
const rects=tops=>tops.map(top=>({top}));
function node(dataset={}) {
 const attrs=new Map(),vars=new Map();
 return {dataset,style:{setProperty:(k,v)=>vars.set(k,v),getPropertyValue:k=>vars.get(k)??'',removeProperty:k=>vars.delete(k)},hidden:false,tabIndex:-1,scrollTop:0,textContent:'',setAttribute:(k,v)=>attrs.set(k,String(v)),getAttribute:k=>attrs.get(k)??null,removeAttribute:k=>attrs.delete(k)};
}
function fixture({clock=false,progressStyle='',onPhaseChange,nav=false,legacyLinks=true}={}) {
 let p=0,low=false,time=0,nextFrame=1;const rafs=new Map();
 const document=Object.assign(new EventTarget(),{hidden:false});
 const viewport={innerHeight:800,matchMedia:q=>({get matches(){return q==='(max-height: 620px)'&&low;}})};
 if(clock){viewport.performance={now:()=>time};viewport.requestAnimationFrame=fn=>{const id=nextFrame++;rafs.set(id,fn);return id;};viewport.cancelAnimationFrame=id=>rafs.delete(id);}
 document.defaultView=viewport;
 const steps=PHASES.map((phase,i)=>({...node({storyStep:phase}),getBoundingClientRect:()=>({top:i*1120-p*7840})}));
 const panels=PHASES.map(phase=>node({storyPanel:phase})),links=legacyLinks?PHASES.map(phase=>node({storyLink:phase})):[];
 const names=Object.keys(filmSnapshot(0).fields),fields=names.map(name=>node({filmField:name}));
 const weights=['slope','elevation','age'].map(name=>node({filmWeight:name}));
 const swatches=Array.from({length:5},()=>node()),caption=node(),selection=node();
 const previous={...node(),disabled:true},next={...node(),disabled:true};
 const chapterSelect={...node(),options:PHASES.map((value,i)=>({value,textContent:['발견','가격','조건','내 기준','장소 비교','가격 환산','근거','마무리'][i]})),focus(){document.activeElement=chapterSelect;}};
 const root={...node(),ownerDocument:document,querySelectorAll:s=>({'[data-story-step]':steps,'[data-story-panel]':panels,'[data-story-link]':links,'[data-film-field]':fields,'[data-film-weight]':weights}[s]??[]),querySelector:s=>({'#story-caption':caption,'#story-legend':{querySelectorAll:()=>swatches},'#hero-selection':selection,'#story-chapter-select':nav?chapterSelect:undefined,'[data-story-prev]':nav?previous:undefined,'[data-story-next]':nav?next:undefined}[s])};
 if(progressStyle)root.style.setProperty('--film-progress',progressStyle);
 const element=node(),frames=[],updates=[];
 const controller=mountStory({root,element,onPhaseChange,owner:{setPresentation:f=>frames.push(f),update:s=>updates.push(s)}});
 return {root,element,panels,links,fields,weights,swatches,caption,selection,frames,updates,controller,rafs,previous,next,chapterSelect,focus(node){document.activeElement=node;},active(){return document.activeElement;},seek(value,reduced=false,immediate=false){p=value;controller.updateScroll({reduced,immediate});},low(value){low=value;controller.updateScroll();},tick(dt=16){time+=dt;const callbacks=[...rafs.values()];rafs.clear();callbacks.forEach(fn=>fn(time));},visibility(hidden){document.hidden=hidden;document.dispatchEvent(new Event('visibilitychange'));}};
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
 const v=fixture();v.seek(2/7);assert.equal(v.frames.at(-1).zoom,3.4);v.low(true);
 assert.equal(v.root.dataset.storyEnhanced,'false');assert.ok(v.panels.every(p=>!p.hidden&&p.style.opacity==='1'&&p.getAttribute('aria-hidden')==='false'));
 assert.ok(v.panels.every(p=>[1,2,3].every(i=>p.style.getPropertyValue('--beat-'+i)==='1')));assert.equal(v.frames.at(-1).zoom,1.22);
 assert.equal(v.fields.find(f=>f.dataset.filmField==='score-a').textContent,'80');assert.equal(v.fields.find(f=>f.dataset.filmField==='rent').textContent,'35');
 v.low(false);assert.equal(v.frames.at(-1).zoom,3.4);assert.equal(v.panels.filter(p=>!p.hidden).length,1);
 v.controller.destroy();assert.equal(v.root.dataset.storyEnhanced,undefined);assert.ok(v.panels.every(p=>!p.hidden));
});
test('reduced motion completes graphics, keeps one stable panel, missing X and stationary camera',()=>{
 const v=fixture();v.seek(6/7,true);assert.equal(v.root.dataset.storyPhase,'evidence');assert.equal(v.panels.filter(p=>!p.hidden).length,1);assert.equal(v.frames.at(-1).zoom,1.22);
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

test('the closing action cannot receive focus while its enhanced panel is aria-hidden',()=>{
 const v=fixture();v.seek(6.5/7+.004);
 assert.equal(v.panels[7].getAttribute('aria-hidden'),'true');assert.equal(v.panels[7].inert,true);
 v.seek(1);assert.equal(v.panels[7].inert,false);assert.ok(v.panels.slice(0,7).every(p=>p.inert));
 v.low(true);assert.ok(v.panels.every(p=>!p.inert),'ordinary reading flow leaves every chapter usable');
 v.controller.destroy();assert.ok(v.panels.every(p=>!p.inert));
});


test('shared scroll clock smooths every film surface from one progress and settles without idle frames',()=>{
 const v=fixture({clock:true,progressStyle:'.17'});v.seek(0);v.seek(3/7);
 assert.equal(v.rafs.size,1);assert.equal(+v.root.dataset.filmProgress,0,'target scroll does not jump just the camera');assert.equal(+v.root.dataset.filmTarget,3/7);
 v.tick(16);const p=+v.root.dataset.filmProgress;
 assert.ok(p>0&&p<3/7);assert.equal(v.root.style.getPropertyValue('--film-progress'),String(p),'journey indicator shares the same filtered clock');
 assert.deepEqual(v.frames.at(-1),filmSnapshot(p).frame,'GPU receives the shared filtered snapshot');
 assert.equal(v.panels[0].style.opacity,String(filmSnapshot(p).timeline.opacities[0]));
 assert.equal(v.fields.find(f=>f.dataset.filmField==='score-a').textContent,filmSnapshot(p).fields['score-a']);
 assert.equal(v.weights[0].style.transform,`scaleX(${filmSnapshot(p).weights.slope/100})`);
 for(let i=0;i<80&&v.rafs.size;i++)v.tick(16);
 assert.equal(+v.root.dataset.filmProgress,3/7);assert.equal(v.rafs.size,0);
 assert.deepEqual(v.frames.at(-1),filmSnapshot(3/7).frame);v.controller.destroy();assert.equal(v.root.style.getPropertyValue('--film-progress'),'.17','destroy restores the prior inline indicator value');
});

test('shared clock reverses continuously and explicit seek cancels pending tracking immediately',()=>{
 const v=fixture({clock:true});v.seek(0);v.seek(1);v.tick(32);const forward=+v.root.dataset.filmProgress;
 v.seek(0);v.tick(16);const reverse=+v.root.dataset.filmProgress;assert.ok(reverse>=0&&reverse<forward);
 v.seek(6/7,false,true);assert.equal(+v.root.dataset.filmProgress,6/7);assert.equal(v.rafs.size,0);assert.deepEqual(v.frames.at(-1),filmSnapshot(6/7).frame);
 v.controller.destroy();
});

test('initial read, reduced, lowheight and visibility bypass the clock and destroy cancels future work',()=>{
 const v=fixture({clock:true});v.seek(2/7);assert.equal(+v.root.dataset.filmProgress,2/7);assert.equal(v.rafs.size,0);
 v.seek(1);assert.equal(v.rafs.size,1);v.visibility(true);assert.equal(v.rafs.size,0);assert.equal(+v.root.dataset.filmProgress,1);
 v.seek(3/7);assert.equal(v.rafs.size,0,'hidden geometry reads snap without scheduling');v.visibility(false);assert.equal(+v.root.dataset.filmProgress,3/7);
 v.seek(6/7,true);assert.equal(v.rafs.size,0);assert.equal(+v.root.dataset.filmProgress,6/7);assert.equal(v.frames.at(-1).zoom,1.22);
 v.seek(1);v.low(true);assert.equal(v.rafs.size,0);assert.equal(+v.root.dataset.filmProgress,1);assert.equal(v.frames.at(-1).zoom,1.22);
 v.low(false);v.seek(0);assert.equal(v.rafs.size,1);const late=[...v.rafs.values()];v.controller.destroy();assert.equal(v.rafs.size,0);const calls=v.frames.length;late.forEach(fn=>fn(2000));assert.equal(v.frames.length,calls);assert.equal(v.rafs.size,0);
});


test('logical phase callback fires once after a filtered boundary crossing without more scroll input',()=>{
 const phases=[],v=fixture({clock:true,onPhaseChange:phase=>phases.push(phase)});
 assert.deepEqual(phases,['discover']);v.seek(2/7);phases.length=0;
 v.seek(.37);assert.deepEqual(phases,[],'raw scroll target alone does not announce a new phase');
 for(let i=0;i<80&&v.rafs.size;i++)v.tick(16);
 assert.equal(v.root.dataset.storyPhase,'criteria');assert.deepEqual(phases,['criteria']);
 v.controller.update();v.seek(.37);assert.deepEqual(phases,['criteria'],'repeated information renders do not refresh navigation forever');
 v.controller.destroy();
});


test('the compact dock owns native edge states and actual neighboring chapter names without legacy links',()=>{
 const v=fixture({nav:true,legacyLinks:false});
 assert.equal(v.previous.disabled,true);assert.equal(v.next.disabled,false);assert.equal(v.previous.getAttribute('aria-label'),'이전 장면 없음');assert.equal(v.next.getAttribute('aria-label'),'다음 장면: 가격');
 v.seek(3/7);assert.equal(v.previous.disabled,false);assert.equal(v.next.disabled,false);assert.equal(v.previous.getAttribute('aria-label'),'이전 장면: 조건');assert.equal(v.next.getAttribute('aria-label'),'다음 장면: 장소 비교');assert.equal(v.chapterSelect.value,'criteria');
 v.focus(v.next);v.seek(1);assert.equal(v.next.disabled,true);assert.equal(v.next.getAttribute('aria-label'),'다음 장면 없음');assert.equal(v.previous.getAttribute('aria-label'),'이전 장면: 근거');assert.equal(v.active(),v.chapterSelect,'a newly disabled focused edge button keeps keyboard focus on the usable selector');
 v.controller.destroy();assert.equal(v.previous.disabled,true);assert.equal(v.next.disabled,true);assert.equal(v.previous.getAttribute('aria-label'),null);assert.equal(v.next.getAttribute('aria-label'),null);
});


test('enhanced reading panels are keyboard scrollable and original tabindex returns on destroy',()=>{
 const v=fixture();assert.ok(v.panels.every(p=>p.tabIndex===0));
 v.low(true);assert.ok(v.panels.every(p=>p.tabIndex===-1));v.low(false);assert.ok(v.panels.every(p=>p.tabIndex===0));
 v.controller.destroy();assert.ok(v.panels.every(p=>p.tabIndex===-1&&p.getAttribute('tabindex')===null));
});

test('incoming panel resets stale inner scroll before its first visible frame, not at logical phase change',()=>{
 const v=fixture(),boundary=2.5/7,panel=v.panels[3];let storedTop=0;
 Object.defineProperty(panel,'scrollTop',{get(){return panel.hidden?0:storedTop;},set(value){if(!panel.hidden)storedTop=value;}});
 v.seek(3/7);panel.scrollTop=200;v.seek(2/7);
 v.seek(boundary+.005);assert.equal(v.root.dataset.storyPhase,'conditions');assert.equal(panel.hidden,false);assert.equal(panel.scrollTop,0);
 panel.scrollTop=45;v.seek(boundary+.007);assert.equal(v.root.dataset.storyPhase,'criteria');assert.equal(panel.scrollTop,45);
 v.controller.destroy();
});


test('entrance channels share the filtered clock, complete in ordinary flow and restore on destroy',()=>{
 const v=fixture({clock:true}),names=['title','copy','graphic'];
 assert.ok(names.every(name=>v.panels[0].style.getPropertyValue('--enter-'+name)==='1'));
 v.seek(0);v.seek(3/7);v.tick(80);
 const p=+v.root.dataset.filmProgress,expected=filmSnapshot(p).timeline.entrances;
 for(const panel of v.panels)names.forEach((name,i)=>assert.equal(panel.style.getPropertyValue('--enter-'+name),String(expected[panel.dataset.storyPanel][i])));
 v.low(true);assert.ok(v.panels.every(panel=>names.every(name=>panel.style.getPropertyValue('--enter-'+name)==='1')));
 v.low(false);v.seek(.38,true);assert.ok(v.panels.every(panel=>names.every(name=>panel.style.getPropertyValue('--enter-'+name)==='1')));
 v.controller.destroy();assert.ok(v.panels.every(panel=>names.every(name=>panel.style.getPropertyValue('--enter-'+name)==='')));
});
