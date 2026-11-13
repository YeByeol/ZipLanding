// A fictional neighborhood context. Positions express relationships, not measured property data.
const COLORS = {
  ground: '#e6e9df', road: '#c8d1c8', paving: '#f2f1e8',
  wall: '#d5ded2', stone: '#c5cdbd', warm: '#dfdfce', roof: '#edefe5',
  glass: '#719083', frame: '#a0ad99', wood: '#a59a7d',
  grass: '#bdcdae', leaf: '#78916a', leafLight: '#98ac81',
};
const LOTS = [
  {id:'west-court',x:-1.90,z:-.97},
  {id:'west-studio',x:-1.93,z:.25},
  {id:'north-terrace',x:-.20,z:-1.45},
  {id:'north-house',x:1.50,z:-1.47},
  {id:'south-studio',x:-.24,z:1.52},
  {id:'south-court',x:1.72,z:1.51},
];

function describeNeighborhood() {
  const parts = [];
  const box = (x,y,z,w,h,d,role,lot='ground') => parts.push({kind:'box',x,y,z,w,h,d,role,lot});
  const tree = (x,z,size=.13,lot='park') => {
    box(x,.13,z,.022,.28,.022,'wood',lot);
    for (const [dx,dy,dz,s,role] of [[0,0,0,1,'leaf'],[-.45,.27,.20,.72,'leafLight'],[.38,.20,-.22,.66,'leaf']]) {
      parts.push({kind:'tree',x:x+dx*size,y:.35+dy*size,z:z+dz*size,w:size*s,h:size*s*1.24,d:size*s,role,lot});
    }
  };
  const planter = (x,y,z,w,d,lot) => {
    box(x,y,z,w,.045,d,'stone',lot);
    box(x,y+.026,z,w-.024,.012,d-.024,'grass',lot);
  };
  // Small bays and projecting jambs produce depth without turning a whole wall into glass.
  const volume = (x,z,w,d,h,base,floors,bays,role,lot) => {
    box(x,base+h/2,z,w,h,d,role,lot);
    box(x,base+.012,z,w+.035,.025,d+.035,'paving',lot);
    const floorH=h/floors,front=z+d/2,side=x+w/2;
    for (let f=0; f<floors; f++) {
      const y=base+floorH*(f+.51),windowH=floorH*.62;
      for (let i=0; i<bays; i++) {
        const cx=x+w*((i+.5)/bays-.5),windowW=w*.67/bays;
        box(cx,y,front+.006,windowW,windowH,.012,'glass',lot);
        for (const dx of [-1,1]) box(cx+dx*(windowW/2+.008),y,front+.017,.014,windowH+.025,.035,'frame',lot);
        box(cx,y-windowH/2-.010,front+.027,windowW+.038,.018,.06,'roof',lot);
      }
      for (let i=0; i<2; i++) {
        const cz=z+d*((i+.5)/2-.5);
        box(side+.006,y,cz,.012,windowH,d*.29,'glass',lot);
        for (const dz of [-1,1]) box(side+.017,y,cz+dz*d*.158,.035,windowH+.025,.014,'frame',lot);
      }
      if (f>0) box(x,base+floorH*f,z,w+.045,.023,d+.045,'roof',lot);
    }
    box(x,base+h+.014,z,w+.055,.028,d+.055,'roof',lot);
    box(x,base+h+.032,z,w-.06,.010,d-.06,'ground',lot);
    // A fine parapet keeps the roof an inhabited surface, not a thick lid.
    for (const side of [-1,1]) {
      box(x+side*(w/2-.008),base+h+.047,z,.020,.038,d,'wall',lot);
      box(x,base+h+.047,z+side*(d/2-.008),w,.038,.020,'wall',lot);
    }
  };

  // All roads and pavements are flush with the ground; there is no display pedestal.
  box(0,-.043,0,5.20,.025,3.80,'ground');
  box(0,-.024,.98,5.20,.012,.32,'road');
  box(-1.13,-.023,0,.30,.014,3.80,'road');
  box(.735,-.024,-.98,3.73,.012,.20,'road');
  for (const z of [.755,1.205]) box(0,-.010,z,5.20,.018,.13,'paving');
  for (const x of [-1.355,-.905]) box(x,-.009,-.12,.13,.020,3.56,'paving');
  for (const z of [-1.125,-.835]) box(.735,-.010,z,3.73,.018,.09,'paving');
  // Clear road intersections and short crossings locate the central residence in a block.
  box(-1.13,.002,.98,.30,.009,.32,'road');
  box(-1.13,.002,-.98,.30,.009,.20,'road');
  for (const x of [-.34,-.23,-.12,-.01,.10]) box(x,-.010,.98,.055,.008,.22,'paving');
  for (const z of [.68,.59,.50,.41]) box(-1.13,-.006,z,.22,.008,.045,'paving');
  for (const x of [.37,.45,.53,.61]) box(x,-.010,-.98,.042,.008,.15,'paving');
  box(-.12,.002,.735,.35,.012,.12,'paving');

  // A pocket garden meets the east footway and the south street, rather than floating alone.
  box(1.70,-.012,.10,1.03,.020,1.10,'grass','park');
  box(1.44,.003,.11,.13,.016,1.10,'paving','park');
  box(1.80,.003,.35,.70,.016,.13,'paving','park');
  box(1.44,.003,.66,.13,.016,.23,'paving','park');
  for (const [x,z,s] of [[1.80,-.23,.14],[2.10,.15,.13],[1.83,.58,.12]]) tree(x,z,s);
  box(1.87,.09,-.02,.29,.026,.075,'wood','park');
  for (const x of [1.76,1.98]) box(x,.043,-.02,.025,.075,.055,'frame','park');

  // Six distinct silhouettes share a restrained material kit; none encodes a property value.
  for (const {id,x,z} of LOTS) {
    if (id==='west-court') {
      volume(x,z,.68,.75,.49,0,2,3,'stone',id);
      volume(x-.07,z-.12,.45,.46,.28,.52,1,2,'wall',id);
      planter(x+.22,.56,z+.20,.16,.27,id);
      box(x,.10,z+.435,.42,.035,.10,'paving',id);
    } else if (id==='west-studio') {
      volume(x,z,.68,.60,.34,0,1,2,'warm',id);
      box(x,.394,z-.10,.26,.055,.34,'wall',id);
      for (const dx of [-.105,-.035,.035,.105]) box(x+dx,.429,z-.10,.016,.017,.36,'wood',id);
      box(x,.278,z+.345,.71,.026,.16,'roof',id);
      for (const dx of [-.30,.30]) box(x+dx,.13,z+.392,.022,.26,.025,'frame',id);
    } else if (id==='north-terrace') {
      volume(x,z,.98,.44,.32,0,1,4,'wall',id);
      volume(x-.29,z-.015,.34,.39,.31,.35,1,2,'warm',id);
      volume(x+.13,z-.015,.43,.39,.19,.35,1,2,'stone',id);
      planter(x+.35,.395,z+.10,.17,.15,id);
    } else if (id==='north-house') {
      volume(x,z,.62,.54,.80,0,3,2,'warm',id);
      box(x+.34,.43,z-.11,.16,.86,.32,'stone',id);
      box(x+.34,.874,z-.11,.19,.028,.35,'roof',id);
      for (const y of [.16,.42,.68]) box(x+.34,y,z+.057,.06,.12,.013,'glass',id);
      planter(x-.10,.864,z-.04,.25,.29,id);
    } else if (id==='south-studio') {
      volume(x,z,.96,.40,.31,0,1,4,'stone',id);
      box(x,.332,z+.25,1.03,.028,.16,'roof',id);
      for (const dx of [-.44,0,.44]) box(x+dx,.16,z+.30,.018,.32,.018,'frame',id);
      planter(x+.26,.374,z-.045,.30,.18,id);
      box(x-.28,.377,z-.035,.23,.055,.19,'warm',id);
    } else {
      volume(x-.23,z-.015,.34,.47,.58,0,2,2,'wall',id);
      volume(x+.155,z+.045,.43,.35,.40,0,1,2,'warm',id);
      planter(x+.17,.463,z+.02,.27,.22,id);
      box(x-.025,.35,z+.285,.35,.028,.15,'roof',id);
      for (const dx of [-.17,.14]) box(x+dx,.17,z+.34,.018,.34,.018,'frame',id);
    }
  }
  // Repeated street trees establish a walkable edge; crowns stay clear of the crossing.
  for (const [x,z,lot] of [[-1.46,-1.59,'west-court'],[-1.46,-.43,'west-court'],[-1.46,.61,'west-studio'],[-1.46,1.59,'west-studio'],[.69,1.245,'south-studio']]) {
    box(x,.002,z,.17,.012,.17,'grass',lot);
    tree(x,z,.09,lot);
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
      color:COLORS[role], roughness:role==='glass'?.25:role==='frame'?.52:.88, metalness:role==='frame'?.12:0,
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
