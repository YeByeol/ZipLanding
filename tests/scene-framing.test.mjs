import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {filmSnapshot} from '../scripts/film-model.mjs';
import {productionDiorama} from './helpers/production-diorama.mjs';
const module=await import('../scripts/scene-framing.mjs').catch(()=>({}));
const phases=['discover','price','conditions','criteria','comparison','value','evidence','closing'];
const occupancies=[.84,.9,1,.9,.88,.94,.97,.84];
const cameraFor=(frame,width,height)=>{
 const aspect=width/height,half=Math.max(5.6,3.65*aspect),camera=new THREE.OrthographicCamera(-half,half,half/aspect,-half/aspect,.1,60);
 camera.zoom=frame.zoom;camera.position.set(frame.target.x+Math.sin(frame.yaw)*Math.cos(frame.pitch)*14,frame.target.y+Math.sin(frame.pitch)*14,frame.target.z+Math.cos(frame.yaw)*Math.cos(frame.pitch)*14);camera.lookAt(frame.target.x,frame.target.y,frame.target.z);camera.updateMatrixWorld(true);camera.updateProjectionMatrix();return camera;
};
const corners=box=>[box.min.x,box.max.x].flatMap(x=>[box.min.y,box.max.y].flatMap(y=>[box.min.z,box.max.z].map(z=>new THREE.Vector3(x,y,z))));

test('actual production geometry reproduces lower clipping and requires story-only fit',()=>{
 const scene=productionDiorama();try{
  const box=new THREE.Box3().setFromObject(scene.world),camera=cameraFor(filmSnapshot(2/7).frame,1440,331);
  const bottom=Math.max(...corners(box).map(v=>(1-v.project(camera).y)*331/2));
  assert.ok(bottom>900,'the actual previous macro frustum cuts the lower city, not merely a DOM panel');
  assert.equal(typeof module.fitOrthographicBounds,'function');
 }finally{scene.dispose();}
});

test('conservative fit contains actual world meshes, billboard radius and selected lift across all holds/transitions/aspects',()=>{
 assert.equal(typeof module.fitOrthographicBounds,'function');assert.equal(typeof module.storyWorldBounds,'function');
 const scene=productionDiorama();try{
  const bounds=module.storyWorldBounds(scene.world,THREE);
  const original=new THREE.Box3().setFromObject(scene.world);
  assert.ok(bounds.min.x<=original.min.x-.16&&bounds.min.y<=original.min.y-.16&&bounds.min.z<=original.min.z-.16);
  assert.ok(bounds.max.y>=original.max.y+.16+.08-1e-12);
  const samples=phases.map((_,i)=>i/7);for(let i=0;i<7;i++)for(let n=0;n<=20;n++)samples.push((i+.5)/7-.035+.07*n/20);
  for(const[width,height]of[[1440,331],[1366,278],[390,328],[320,219]])for(const p of samples){
   const snapshot=filmSnapshot(p),frame=snapshot.frame,camera=cameraFor(frame,width,height);
   const from=phases.indexOf(snapshot.timeline.from),to=phases.indexOf(snapshot.timeline.to),occupancy=occupancies[from]+(occupancies[to]-occupancies[from])*snapshot.timeline.blend;
   const result=module.fitOrthographicBounds(bounds,camera.matrixWorldInverse.elements,{width,height,padding:20,occupancy});
   Object.assign(camera,result);camera.updateProjectionMatrix();
   for(const corner of corners(bounds)){
    const ndc=corner.project(camera),x=(ndc.x+1)*width/2,y=(1-ndc.y)*height/2;
    assert.ok(x>=20-1e-7&&x<=width-20+1e-7&&y>=20-1e-7&&y<=height-20+1e-7,JSON.stringify({width,height,p,x,y}));
    assert.ok(ndc.z>=-1&&ndc.z<=1,'near/far still contain the full world bounds');
   }
   assert.deepEqual(module.fitOrthographicBounds(bounds,camera.matrixWorldInverse.elements,{width,height,padding:20,occupancy}),result,'fit derives from base size without iterative projection drift');
  }
 }finally{scene.dispose();}
});

test('fit rejects invalid geometry and keeps padding in CSS pixels independent of DPR',()=>{
 assert.equal(typeof module.fitOrthographicBounds,'function');
 const box=new THREE.Box3(new THREE.Vector3(-1,-1,-1),new THREE.Vector3(1,1,1)),view=new THREE.Matrix4().elements;
 for(const dims of [{width:0,height:200},{width:NaN,height:200},{width:320,height:Infinity}])assert.equal(module.fitOrthographicBounds(box,view,dims),null);
 const tiny=module.fitOrthographicBounds(box,view,{width:20,height:20,padding:NaN,occupancy:1});assert.ok(Number.isFinite(tiny.zoom)&&tiny.zoom>0,'invalid padding keeps tiny canvas projection usable');
 const a=module.fitOrthographicBounds(box,view,{width:320,height:200,padding:20,occupancy:1,dpr:1});
 const b=module.fitOrthographicBounds(box,view,{width:320,height:200,padding:20,occupancy:1,dpr:2});assert.deepEqual(a,b);
});
