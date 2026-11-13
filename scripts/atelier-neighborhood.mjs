// A fictional neighborhood context. Positions express relationships, not measured property data.
const COLORS = {
  ground: '#e6e9df', road: '#ced6cf', paving: '#f1f1e8',
  wall: '#d5ded2', roof: '#e9ede3', glass: '#91a69a',
  frame: '#b1c0b2', wood: '#a59c82', grass: '#c1d0b2', leaf: '#829a76',
};
const LOTS = [
  {id:'west-court',x:-1.88,z:-.88,w:.68,d:.72,h:.69},
  {id:'west-studio',x:-1.90,z:.28,w:.64,d:.62,h:.46},
  {id:'north-terrace',x:-.20,z:-1.37,w:.92,d:.45,h:.60},
  {id:'north-house',x:1.44,z:-1.29,w:.80,d:.67,h:.75},
  {id:'south-studio',x:-.22,z:1.52,w:.85,d:.45,h:.49},
  {id:'south-court',x:1.72,z:1.51,w:.77,d:.44,h:.41},
];

function describeNeighborhood() {
  const parts = [];
  const box = (x,y,z,w,h,d,role,lot='ground') => parts.push({kind:'box',x,y,z,w,h,d,role,lot});
  const tree = (x,z,size=.16) => {
    box(x,.13,z,.027,.28,.027,'wood','park');
    parts.push({kind:'tree',x,y:.37,z,w:size,h:size*1.32,d:size,role:'leaf',lot:'park'});
  };

  // Flush street surfaces keep this a place, rather than another display pedestal.
  box(0,-.043,0,5.20,.025,3.80,'ground');
  box(0,-.024,.98,5.20,.012,.32,'road');
  box(-1.13,-.023,0,.30,.014,3.80,'road');
  for (const z of [.755,1.205]) box(0,-.010,z,5.20,.018,.13,'paving');
  for (const x of [-1.355,-.905]) box(x,-.009,-.12,.13,.020,3.56,'paving');
  // The intersection is paved as a continuous street, not a grid overlay.
  box(-1.13,.002,.98,.30,.009,.32,'road');
  for (const x of [-.34,-.23,-.12,-.01,.10]) box(x,-.010,.98,.055,.008,.22,'paving');
  for (const z of [-.28,-.17,-.06,.05]) box(-1.13,-.006,z,.22,.008,.05,'paving');
  box(-.12,.002,.735,.35,.012,.12,'paving');

  // A small public garden is visible from the main residence's eastern side.
  box(1.70,-.012,.10,1.03,.020,1.10,'grass','park');
  box(1.44,.003,.11,.13,.016,1.10,'paving','park');
  box(1.80,.003,.35,.70,.016,.13,'paving','park');
  for (const [x,z,s] of [[1.80,-.23,.17],[2.10,.15,.15],[1.73,.60,.16]]) tree(x,z,s);
  box(1.87,.09,-.02,.29,.026,.075,'wood','park');
  for (const x of [1.76,1.98]) box(x,.043,-.02,.025,.075,.055,'frame','park');

  for (const lot of LOTS) {
    const {x,z,w,d,h,id} = lot;
    const floors = h > .55 ? 2 : 1;
    const front = z+d/2, side = x+w/2;
    // Deep dark bays sit behind a restrained rhythm of narrow pale frames.
    box(x,h/2,z,w,h,d,'wall',id);
    box(x,.025,z,w+.045,.033,d+.045,'paving',id);
    box(x,h+.018,z,w+.070,.036,d+.070,'roof',id);
    box(x,h+.039,z,w-.09,.012,d-.09,'ground',id);
    for (let f=0; f<floors; f++) {
      const windowH = h/floors*.62, y = h/floors*(f+.51);
      box(x,y,front+.006,w*.79,windowH,.012,'glass',id);
      box(side+.006,y,z,.012,windowH,d*.73,'glass',id);
      for (const ratio of [-.39,-.13,.13,.39]) {
        box(x+w*ratio,y,front+.024,.017,windowH+.035,.045,'frame',id);
      }
      for (const ratio of [-.35,0,.35]) {
        box(side+.023,y,z+d*ratio,.045,windowH+.035,.017,'frame',id);
      }
      box(x,y+windowH/2+.025,front+.035,w+.035,.030,.10,'roof',id);
      box(x,y-windowH/2-.012,front+.031,w*.84,.023,.08,'roof',id);
    }
    if (floors === 2) box(x,h/2,z,w+.055,.024,d+.055,'roof',id);
    box(x-w*.23,h+.085,z-d*.19,w*.30,.09,d*.31,'wall',id);
    box(x-w*.23,h+.134,z-d*.19,w*.35,.014,d*.36,'roof',id);
    box(x+w*.22,h+.065,z-d*.12,w*.22,.05,d*.44,'grass',id);
  }
  return parts;
}

const PARTS = describeNeighborhood();

/** No animation loop or network access: the owning scene supplies one shared progress value. */
export function buildNeighborhood({THREE,remember}) {
  const own = value => { remember(value); return value; };
  const group = new THREE.Group(); group.name = 'atelier-neighborhood';
  const cube = own(new THREE.BoxGeometry(1,1,1));
  const canopy = own(new THREE.IcosahedronGeometry(1,1));
  const materials = new Map();
  const batches = new Map();
  for (const part of PARTS) {
    const key = `${part.kind}:${part.role}`;
    if (!batches.has(key)) batches.set(key,[]);
    batches.get(key).push(part);
  }
  const transform = new THREE.Object3D();
  let instanceCount = 0;
  for (const [key,parts] of batches) {
    const {kind,role} = parts[0];
    if (!materials.has(role)) materials.set(role, own(new THREE.MeshStandardMaterial({
      color:COLORS[role], roughness:role==='glass'?.36:.88, metalness:0,
    })));
    const mesh = own(new THREE.InstancedMesh(kind==='tree'?canopy:cube,materials.get(role),parts.length));
    mesh.name = `neighborhood-${key}`;
    parts.forEach((part,i) => {
      transform.position.set(part.x,part.y,part.z);
      transform.scale.set(part.w,part.h,part.d);
      transform.updateMatrix(); mesh.setMatrixAt(i,transform.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.receiveShadow = true;
    mesh.userData.contextShadow = !['ground','road','paving','grass','glass'].includes(role);
    mesh.castShadow = mesh.userData.contextShadow;
    mesh.computeBoundingBox(); mesh.computeBoundingSphere();
    group.add(mesh); instanceCount += parts.length;
  }
  const bounds = new THREE.Box3().setFromObject(group);
  const stats = {
    drawCalls:group.children.length, instances:instanceCount, buildings:LOTS.length,
    bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},
  };
  let previous = 1;
  function setVisibility(value) {
    const amount = Number.isFinite(value) ? Math.max(0,Math.min(1,value)) : 0;
    if (amount === previous) return;
    previous = amount;
    group.visible = amount > 0;
    const blending = amount < 1;
    for (const material of materials.values()) {
      material.opacity = amount;
      if (material.transparent !== blending) {
        material.transparent = blending; material.needsUpdate = true;
      }
      material.depthWrite = !blending;
    }
    // Transparent context must not leave opaque ghost shadows during its dissolve.
    for (const mesh of group.children) mesh.castShadow = !blending && mesh.userData.contextShadow;
  }
  return {group,setVisibility,stats};
}

/** Reuse the same architectural records for static/no-WebGL presentation. */
export function neighborhoodSVG({box,point}) {
  const render = part => {
    if (part.kind === 'box') return box(part.x,part.y,part.z,part.w,part.h,part.d,COLORS[part.role]);
    const [cx,cy] = point(part.x,part.y,part.z);
    const rx = Math.abs(point(part.x+part.w,part.y,part.z)[0]-cx);
    const ry = Math.abs(point(part.x,part.y+part.h,part.z)[1]-cy);
    return `<ellipse cx="${cx.toFixed(3)}" cy="${cy.toFixed(3)}" rx="${rx.toFixed(3)}" ry="${ry.toFixed(3)}" fill="${COLORS[part.role]}"/>`;
  };
  const terrain = PARTS.filter(part=>part.lot==='ground').map(render).join('');
  const lots = [...LOTS,{id:'park',x:1.70,z:.10}].sort((a,b)=>(a.x+a.z)-(b.x+b.z));
  return `<g class="atelier-neighborhood-ground">${terrain}</g>` + lots.map(lot => {
    const attribute = lot.id==='park'?'class="atelier-neighborhood-park"':`data-context-building="${lot.id}"`;
    return `<g ${attribute}>${PARTS.filter(part=>part.lot===lot.id).map(render).join('')}</g>`;
  }).join('');
}
