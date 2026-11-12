import test from 'node:test';
import assert from 'node:assert/strict';
import { mountScene3D } from '../scripts/scene3d.mjs';

// Keep the real owner and SVG builder; browser surfaces defer GPU initialization.
function element() {
  return { dataset: {}, style: {}, append() {}, remove() {}, setAttribute() {}, addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [] };
}

test('presentation belongs only to the noninteractive owner and respects its manual view', () => {
  const saved = Object.fromEntries(['window', 'document', 'IntersectionObserver'].map(key => [key, globalThis[key]]));
  globalThis.IntersectionObserver = class { observe() {} disconnect() {} };
  globalThis.window = { IntersectionObserver: globalThis.IntersectionObserver, matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }) };
  globalThis.document = { createElement: element, addEventListener() {}, removeEventListener() {} };
  const svg = element();
  const container = () => ({ ...element(), querySelector: () => svg });
  const heroNode = container(), experienceNode = container();
  let hero, experience;
  try {
    hero = mountScene3D(heroNode);
    experience = mountScene3D(experienceNode, { interactive: true });
    assert.equal(typeof hero.setPresentation, 'function');
    hero.setPresentation({ yaw: .5, pitch: .86, zoom: 4.2, target: { x: -3, y: .5, z: -2 } });
    assert.equal(heroNode.dataset.viewPreset, 'story');
    assert.equal(heroNode.dataset.viewZoom, '1.05', 'reduced motion keeps the wide camera');
    assert.equal(heroNode.dataset.targetX, '0.0000');
    assert.equal(heroNode.dataset.manualView, 'false');
    experience.setPreset('plan');
    const manual = { ...experienceNode.dataset };
    experience.setPresentation({ zoom: 4.2 });
    assert.deepEqual(experienceNode.dataset, manual, 'story frames never replace experience controls');
    hero.rotate(.3);
    const heroManual = { ...heroNode.dataset };
    hero.setPresentation({ yaw: .2, zoom: 3 });
    assert.deepEqual(heroNode.dataset, heroManual, 'manual camera ownership survives presentation calls');
  } finally {
    hero?.destroy(); experience?.destroy();
    for (const [key, value] of Object.entries(saved)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; }
  }
});

test('story frames publish exact camera coordinates before GPU initialization without a tracking loop', () => {
  const saved = Object.fromEntries(['window', 'document', 'IntersectionObserver'].map(key => [key, globalThis[key]]));
  globalThis.IntersectionObserver = class { observe() {} disconnect() {} };
  globalThis.window = { IntersectionObserver: globalThis.IntersectionObserver, matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) };
  globalThis.document = { createElement: element, addEventListener() {}, removeEventListener() {} };
  const svg = element(), container = { ...element(), querySelector: () => svg };
  let owner;
  try {
    owner = mountScene3D(container);
    owner.setPresentation({ yaw: .62, pitch: .80, zoom: 3.2, target: { x: -3, y: .5, z: -2 }, colorBlend: { from: 'price', to: 'terrain', mix: .5 } });
    assert.equal(container.dataset.viewZoom, '3.2');
    assert.equal(container.dataset.viewYaw, '0.6200');
    assert.equal(container.dataset.targetX, '-3.0000');
    owner.setPresentation({ yaw: .56, pitch: .92, zoom: 1.05, target: { x: 0, y: .28, z: 0 }, colorBlend: { from: 'price', to: 'price', mix: 0 } });
    assert.equal(container.dataset.viewZoom, '1.05', 'fast seeks apply the requested frame directly');
  } finally {
    owner?.destroy();
    for (const [key, value] of Object.entries(saved)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; }
  }
});

test('story presentation owns its demonstrated weights, selection and highlight snapshot only', () => {
  const saved=Object.fromEntries(['window','document','IntersectionObserver'].map(key=>[key,globalThis[key]]));
  globalThis.IntersectionObserver=class{observe(){} disconnect(){}};
  globalThis.window={IntersectionObserver:globalThis.IntersectionObserver,matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}})};
  globalThis.document={createElement:element,addEventListener(){},removeEventListener(){}};
  function container(){
    const parts=new Map();const part=s=>{if(!parts.has(s))parts.set(s,{...element(),attributes:{},setAttribute(k,v){this.attributes[k]=v;},querySelector:part});return parts.get(s);};
    const node={dataset:{buildingId:'x'},querySelector:part,classList:{toggle(){}}};
    const svg={...element(),querySelectorAll:()=>[node]};return{...element(),querySelector:()=>svg,parts,part};
  }
  const storyNode=container(),interactiveNode=container();let story,interactive;
  try{
    story=mountScene3D(storyNode);interactive=mountScene3D(interactiveNode,{interactive:true});
    const frame={yaw:.62,pitch:.8,zoom:1.9,target:{x:2.975,y:.5,z:1.915},weights:{slope:80,elevation:10,age:10},selected:'x',highlightIds:['x'],saved:['a','b','c'],colorBlend:{from:'score',to:'score',mix:0}};
    story.setPresentation(frame);
    assert.equal(storyNode.part('.building-roof').attributes.fill,'#d9d6cf');
    assert.equal(storyNode.part('.building-outline').style.display,'');
    assert.equal(storyNode.part('.building-missing').style.opacity,'1');
    assert.equal(storyNode.dataset.viewZoom,'1.9');
    interactive.update({mode:'price',selected:'a'});const before=interactiveNode.part('.building-roof').attributes.fill;
    interactive.setPresentation(frame);assert.equal(interactiveNode.part('.building-roof').attributes.fill,before);
    story.rotate(.2);story.setPresentation({...frame,selected:'a',colorBlend:{from:'price',to:'price',mix:0}});
    assert.equal(storyNode.part('.building-roof').attributes.fill,'#d9d6cf','manual camera guard also protects story data ownership');
  }finally{story?.destroy();interactive?.destroy();for(const[k,v]of Object.entries(saved)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}
});
