import test from 'node:test';
import assert from 'node:assert/strict';
const module=await import('../scripts/story-connections.mjs').catch(()=>({}));

test('leader geometry stays deterministic and rejects invalid coordinates',()=>{
  assert.equal(typeof module.connectionPath,'function');
  const from={x:124.25,y:260},to={x:332,y:419};
  const path=module.connectionPath(from,to);
  assert.match(path,/^M124\.25,260 C/);
  assert.ok(path.endsWith('332,419'));
  assert.equal(module.connectionPath(from,to),path);
  for(const invalid of [null,{x:NaN,y:2},{x:2,y:Infinity}])assert.equal(module.connectionPath(invalid,to),null);
});

test('opaque data surfaces hide covered markers without clamping them to an edge',()=>{
  assert.equal(typeof module.isCovered,'function');
  const rect={left:100,top:200,right:300,bottom:400};
  assert.equal(module.isCovered({x:150,y:250},[rect]),true);
  assert.equal(module.isCovered({x:100,y:200},[rect]),true);
  assert.equal(module.isCovered({x:99.9,y:250},[rect]),false);
  assert.equal(module.isCovered({x:150,y:250},[]),false);
});

test('leaders stay out of the opaque reading scrim without moving their real origins',()=>{
  const window=module.inCityReadingWindow;
  assert.equal(window({x:210,y:147},{width:320,height:576}),false);
  assert.equal(window({x:190,y:220},{width:390,height:780}),true);
  assert.equal(window({x:400,y:300},{width:1440,height:928}),false);
  assert.equal(window({x:1000,y:300},{width:1440,height:928}),true);
  assert.equal(window({x:NaN,y:300},{width:1440,height:928}),false);
  assert.equal(window({x:1,y:1},{width:0,height:0}),false);
});

test('scrolling a constrained reading area refreshes leaders and destroy removes its listener',()=>{
 let reads=0,unsubscribed=0;
 const rect={left:0,top:72,right:600,bottom:572,width:600,height:500};
 const stage=Object.assign(new EventTarget(),{getBoundingClientRect:()=>rect});
 const layer={style:{},setAttribute(){reads++;}};
 const city={getBoundingClientRect:()=>rect};
 const root={dataset:{storyEnhanced:'true'},ownerDocument:{defaultView:{matchMedia:()=>({matches:false})}},querySelector:s=>({'#story-connections':layer,'#story-stage':stage,'#story-city':city,'.story-panels':stage}[s]),querySelectorAll:()=>[]};
 const controller=module.mountStoryConnections({root,owner:{projectAnchors:()=>[],onPaint:()=>()=>unsubscribed++}});
 controller.setSnapshot({beats:{}});
 stage.dispatchEvent(new Event('scroll'));
 assert.equal(reads,1,'inner reading scroll updates projected endpoints without another camera paint');
 controller.destroy();stage.dispatchEvent(new Event('scroll'));
 assert.equal(reads,1);assert.equal(unsubscribed,1);assert.equal(layer.style.display,'none');
});
