import test from 'node:test';
import assert from 'node:assert/strict';
import {mountScene3D} from '../scripts/scene3d.mjs';

function fixture(){
 const saved=Object.fromEntries(['window','document','IntersectionObserver','ResizeObserver','getComputedStyle','requestAnimationFrame','cancelAnimationFrame'].map(k=>[k,globalThis[k]]));
 const frames=new Map();let id=1,resize;
 const element=()=>({dataset:{},style:{},append(){},remove(){},setAttribute(){},addEventListener(){},removeEventListener(){},querySelectorAll:()=>[]});
 globalThis.IntersectionObserver=class{observe(){}disconnect(){}};
 globalThis.ResizeObserver=class{constructor(fn){resize=fn;}observe(){}disconnect(){}};
 globalThis.window={IntersectionObserver:globalThis.IntersectionObserver,matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}})};
 globalThis.document={hidden:false,createElement:element,addEventListener(){},removeEventListener(){}};
 globalThis.getComputedStyle=e=>({display:e.style.display??'block',visibility:e.style.visibility??'visible',opacity:e.style.opacity??'1'});
 globalThis.requestAnimationFrame=fn=>{frames.set(id,fn);return id++;};globalThis.cancelAnimationFrame=i=>frames.delete(i);
 const marker={...element(),getScreenCTM:()=>({a:2,b:0,c:0,d:2,e:450,f:150}),getBoundingClientRect:()=>({x:426,y:126,width:48,height:70})};
 const parts=new Map([['.building-marker',marker]]);
 const part=s=>{if(!parts.has(s))parts.set(s,{...element(),setAttribute(){},querySelector:part});return parts.get(s);};
 marker.querySelector=part;
 const building={dataset:{buildingId:'a'},querySelector:part,classList:{toggle(){}}};
 const svg={...element(),querySelectorAll:()=>[building]};
 const container={...element(),clientWidth:640,clientHeight:320,getBoundingClientRect:()=>({left:100,top:50,x:100,y:50,width:640,height:320}),querySelector:()=>svg};
 const owner=mountScene3D(container);
 return{owner,container,svg,marker,frames,resize:()=>resize?.(),cleanup(){owner.destroy();for(const[k,v]of Object.entries(saved)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}};
}

test('SVG marker projection uses actual CTM in container CSS pixels without drawing or RAF',()=>{
 const v=fixture();try{
  assert.equal(typeof v.owner.projectAnchors,'function');
  const ids=Object.freeze(['a','b','not-a-building']);const before=v.frames.size;
  assert.deepEqual(v.owner.projectAnchors(ids),[{id:'a',x:350,y:100,radius:24,visible:true,renderer:'svg'},{id:'b',x:0,y:0,radius:0,visible:false,renderer:'svg'},{id:'not-a-building',x:0,y:0,radius:0,visible:false,renderer:'svg'}]);
  v.owner.projectAnchors(ids);assert.equal(v.frames.size,before);assert.deepEqual(ids,['a','b','not-a-building']);
 }finally{v.cleanup();}
});

test('projection guards actual marker visibility, invalid CTMs and bounds without edge clamping',()=>{
 const v=fixture();try{
  assert.equal(typeof v.owner.projectAnchors,'function');
  const visible=()=>v.owner.projectAnchors(['a'])[0].visible;
  v.marker.style.display='none';assert.equal(visible(),false);v.marker.style.display='';
  v.marker.style.visibility='hidden';assert.equal(visible(),false);v.marker.style.visibility='';
  v.marker.getBoundingClientRect=()=>({width:0,height:0});assert.equal(visible(),false);v.marker.getBoundingClientRect=()=>({width:48,height:70});
  v.marker.getScreenCTM=()=>null;assert.equal(visible(),false);
  v.marker.getScreenCTM=()=>({e:Infinity,f:150});assert.equal(visible(),false);
  v.marker.getScreenCTM=()=>({e:1000,f:150});assert.deepEqual(v.owner.projectAnchors(['a'])[0],{id:'a',x:900,y:100,radius:24,visible:false,renderer:'svg'});
  v.container.clientWidth=0;assert.equal(visible(),false);
  v.container.clientWidth=Infinity;assert.equal(visible(),false);assert.equal(v.owner.projectAnchors(['a'])[0].x,0);v.container.clientWidth=640;
  v.container.style.visibility='hidden';assert.equal(visible(),false);v.container.style.visibility='';
  v.owner.destroy();assert.equal(visible(),false);
 }finally{v.cleanup();}
});

test('onPaint subscribes only, notifies once per fallback update/resize and unsubscribes cleanly',()=>{
 const v=fixture();try{
  assert.equal(typeof v.owner.onPaint,'function');
  let calls=0,last;const stop=v.owner.onPaint(()=>{calls++;last=v.owner.projectAnchors(['a'])[0];});
  assert.equal(calls,0,'registration never triggers owner reentry');
  v.owner.update({selected:'a'});assert.equal(calls,1);assert.equal(last.visible,true);
  v.owner.setPresentation({yaw:.62,pitch:.8,zoom:2.6,target:{x:0,y:.28,z:0}});assert.equal(calls,2);
  assert.equal(v.container.dataset.viewZoom,'2.6');
  v.resize();assert.equal(calls,3,'SVG resize refreshes current CSS coordinates');
  stop();v.owner.update({selected:'a'});assert.equal(calls,3);
  v.owner.onPaint(()=>calls++);v.owner.destroy();v.resize();assert.equal(calls,3);assert.equal(v.frames.size,0);
 }finally{v.cleanup();}
});
