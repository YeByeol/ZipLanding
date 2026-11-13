import fs from 'node:fs';
import * as THREE from '../../vendor/three.module.js';
import {BUILDINGS} from '../../scripts/demo.mjs';
import {buildingPosition} from '../../scripts/scene-model.mjs';
import {createBevelledBox} from '../../scripts/scene3d.mjs';
import {createAtelierModels} from '../../scripts/atelier-architecture.mjs';

// Execute the real builder without a GPU; colors/textures do not affect solid bounds.
export function productionDiorama(){
 const source=fs.readFileSync(new URL('../../scripts/scene3d.mjs',import.meta.url),'utf8');
 const start=source.indexOf('function buildDiorama()'),end=source.indexOf('  function buildAtelier()',start);
 const world=new THREE.Scene(),resources=new Set(),objects=[];
 const document={createElement:()=>({getContext:()=>({beginPath(){},arc(){},fill(){},stroke(){},fillText(){}})})};
 new Function('THREE','world','resources','objects','buildings','buildingPosition','colorFrame','createBevelledBox','document',`return (${source.slice(start,end).trim()})();`)(THREE,world,resources,objects,BUILDINGS,buildingPosition,()=>({color:'#ffffff',missing:0}),createBevelledBox,document);
 world.updateMatrixWorld(true);
 return{world,objects,dispose(){resources.forEach(resource=>resource.dispose?.());}};
}

export function productionAtelier(){
 const world=new THREE.Scene(),resources=new Set();
 const document={createElement:()=>({getContext:()=>({beginPath(){},arc(){},fill(){},fillText(){}})})};
 const objects=createAtelierModels({world,resources,buildings:BUILDINGS,colorFrame:()=>({color:'#ffffff',missing:0}),document});
 world.updateMatrixWorld(true);
 return{world,objects,resources,dispose(){resources.forEach(resource=>resource.dispose?.());}};
}
