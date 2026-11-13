import { BUILDINGS } from './demo.mjs';
import { PALETTES, colorFrameForTransition } from './city.mjs';
import { clampFormation, formationPose, formationLayers } from './scene-formation.mjs';
import { compositionProjection } from './scene-framing.mjs';

const IDS = ['a','b','c','k','v','x'];
const MODES = {discover:'price',price:'price',conditions:'terrain',criteria:'score',comparison:'score',value:'price',evidence:'score',closing:'price'};
const num = value => Number(value.toFixed(3));
const point = (x,y,z) => [80*(x-z),40*(x+z)-100*y];
const points = list => list.map(p=>p.map(num).join(',')).join(' ');
const polygon = (list,fill,attrs='') => `<polygon points="${points(list)}" fill="${fill}" ${attrs}/>`;
const shade = (hex,amount) => '#'+hex.slice(1).match(/../g).map(v=>Math.round(parseInt(v,16)*amount).toString(16).padStart(2,'0')).join('');
function box(x,y,z,w,h,d,color,{data=false,top=color}={}) {
  const a=x-w/2,b=z-d/2,lo=y-h/2,hi=y+h/2;
  const p=(u,v,t)=>point(u,t,v);
  const frontAttrs=data?'class="atelier-data-face" data-face-shade="1"':'';
  const sideAttrs=data?'class="atelier-data-face" data-face-shade="0.78"':'';
  return polygon([p(a+w,b,lo),p(a+w,b+d,lo),p(a+w,b+d,hi),p(a+w,b,hi)],shade(color,.78),sideAttrs)
    +polygon([p(a,b+d,lo),p(a+w,b+d,lo),p(a+w,b+d,hi),p(a,b+d,hi)],color,frontAttrs)
    +polygon([p(a,b,hi),p(a+w,b,hi),p(a+w,b+d,hi),p(a,b+d,hi)],top);
}
function maquette(id,color,missing) {
  const chalk='#e5ebe5',edge='#f3f5ed',forest='#194b3e',glass='#153c36',roof='#afc2b5';
  let s=box(0,.04,0,1.72,.14,1.46,chalk,{top:edge});
  s+=box(-.13,.15,.12,.35,.02,.75,roof);
  s+=box(-.1,.8,-.4,1.22,.30,.37,chalk);
  s+=box(-.52,.48,.03,.43,.68,1.04,chalk);
  s+=box(-.52,.83,.03,.47,.035,1.08,edge,{top:roof});
  s+=box(-.52,.48,.562,.29,.43,.012,glass);
  for(const x of [-.59,-.45])s+=box(x,.49,.58,.012,.43,.012,edge);
  s+=box(.4,.55,.04,.57,.82,1.02,color,{data:true,top:edge});
  s+=box(.69,.56,.09,.012,.46,.85,glass);
  s+=box(.4,.56,.565,.41,.46,.012,glass);
  for(const x of [.28,.42,.56])s+=box(x,.49,.58,.012,.43,.012,edge);
  for(const z of [-.15,.03,.21,.39])s+=box(.70,.56,z,.012,.46,.012,edge);
  s+=box(.29,1.03,-.21,.76,.30,.71,forest);
  s+=box(.29,1.04,.157,.60,.19,.012,glass);
  s+=box(.29,1.19,-.21,.80,.045,.75,edge,{top:edge});
  s+=polygon([point(-.025,1.218,-.5),point(.605,1.218,-.5),point(.605,1.218,.08),point(-.025,1.218,.08)],roof);
  s+=box(-.13,.18,.57,.35,.06,.12,edge)+box(-.13,.16,.69,.43,.025,.12,chalk)+box(-.30,.23,.36,.04,.18,.34,forest);
  s+=`<g class="building-missing" opacity="${missing}">`;
  for(let i=0;i<6;i++)s+=`<path d="M${points([point(-.02+i*.10,1.23,-.45)])}L${points([point(.13+i*.10,1.23,.02)])}" fill="none" stroke="#52675b" stroke-width="1"/>`;
  s+='</g>';
  const [mx,my]=point(.1,1.42,-.12);
  return s+`<g class="building-marker" transform="translate(${num(mx)} ${num(my)})"><circle r="14" fill="${id==='a'||id==='x'?forest:'#72548e'}"/><text text-anchor="middle" y="5" fill="#ffffff" font-family="Arial,sans-serif" font-size="14" font-weight="600">${id.toUpperCase()}</text></g>`;
}
function initial(options) {
  const phase=Object.hasOwn(MODES,options.phase)?options.phase:'discover';
  return {mode:MODES[phase],selected:phase==='evidence'?'x':'a',saved:['a','b','c'],weights:{slope:80,elevation:10,age:10},...options,
    mode:Object.hasOwn(PALETTES,options.mode)?options.mode:MODES[phase],formation:clampFormation(options.formation??{from:phase})};
}
function layout(formation,width,height,frame={}) {
  const blend=frame.standalone||width>760?1:0;
  const projection=compositionProjection({width,height,zoom:1,composition:frame.composition});
  const halfWidth=(projection.right-projection.left)/2,halfHeight=(projection.top-projection.bottom)/2;
  const x=.5-(projection.left+projection.right)/2*projection.zoom/(2*halfWidth);
  const y=.5+(projection.top+projection.bottom)/2*projection.zoom/(2*halfHeight);
  const unitFor=phase=>{
    const triple=phase==='comparison'||phase==='value',scale=triple?(phase==='value'?.66:.78):1.35;
    const mobile=Math.min(width*(triple?.23:.68),height*(triple?.26:.40));
    const desktop=Math.min(width*(triple?.20:.47),height*(triple?.47:.79));
    const targetW=mobile+(desktop-mobile)*blend;
    return targetW/(254*scale)*(phase==='conditions'?.7:phase==='criteria'?.85:1);
  };
  const unit=(unitFor(formation.from)+(unitFor(formation.to)-unitFor(formation.from))*formation.mix)*(frame.standalone?1:projection.zoom);
  return {x:width*x,y:height*y,unit,spacing:128+(110-128)*blend};
}
function transform(id,formation,place) {
  const pose=formationPose(id,formation);
  return {visible:pose.scale>.001,value:`translate(${num(place.x+pose.x*place.spacing*place.unit)} ${num(place.y+50*pose.scale*place.unit-pose.y*100*place.unit+pose.z*40*place.unit)}) scale(${num(pose.scale*place.unit)})`};
}

/** A concept maquette, not a measured plan of the fictional example property. */
export function atelierSVG(options={}) {
  const state=initial(options),buildings=state.buildings??BUILDINGS,formation=state.formation;
  const width=960,height=550,place=layout(formation,width,height,{standalone:true,composition:{desktop:{x:.5,y:formationLayers(formation)>.5?.45:.55}}}),layers=formationLayers(formation);
  const layerMarkup=['#c8d8c9','#d5c6a1','#c9b9df'].map((color,i)=>`<g class="atelier-layer" data-layer="${i}" transform="translate(0 ${num(layers*(i+1)*24)})" opacity="${layers}">${box(0,0,0,1.96,.035,1.68,color)}</g>`).reverse().join('');
  const subjects=IDS.map(id=>{
    const building=buildings.find(item=>item.id===id);if(!building)return'';
    const {color,missing}=colorFrameForTransition(building,buildings,state.colorBlend??{from:state.mode},state.weights);
    const t=transform(id,formation,place);
    return `<g data-building-id="${id}" data-visible="${t.visible}" class="atelier-subject" transform="${t.value}" style="display:${t.visible?'inline':'none'}"><ellipse class="atelier-shadow" cx="28" cy="${num(50+layers*70)}" rx="107" ry="25" fill="#214e3c" opacity=".07"/>${id==='a'?layerMarkup:''}<g class="atelier-architecture" transform="translate(0 ${num(-layers*12)})">${maquette(id,color,missing)}</g></g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" aria-hidden="true" focusable="false" class="city-svg atelier-svg" data-city-mode="${state.mode}"><title>ZIP 설명용 가상 장소 모형</title>${subjects}</svg>`;
}

export function mountAtelier(container,{buildings=BUILDINGS}={}) {
  if(!container||typeof container.querySelector!=='function')throw new TypeError('An atelier container is required.');
  let state=initial({buildings}),frame={},destroyed=false;
  container.innerHTML=atelierSVG(state);
  const svg=container.querySelector('svg');
  const subjects=[...svg.querySelectorAll('[data-building-id]')].map(node=>({node,building:buildings.find(item=>item.id===node.dataset.buildingId),faces:[...node.querySelectorAll('.atelier-data-face')],missing:node.querySelector('.building-missing'),shadow:node.querySelector('.atelier-shadow'),architecture:node.querySelector('.atelier-architecture'),layers:[...node.querySelectorAll('.atelier-layer')]}));
  function draw() {
    if(destroyed)return;
    const width=container.clientWidth||960,height=container.clientHeight||550;
    const formation=clampFormation(frame.formation??state.formation),place=layout(formation,width,height,frame),layers=formationLayers(formation);
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.dataset.cityMode=state.mode;
    for(const item of subjects) {
      const t=transform(item.building.id,formation,place),{color,missing}=colorFrameForTransition(item.building,buildings,state.colorBlend??{from:state.mode},state.weights);
      item.node.setAttribute('transform',t.value);item.node.dataset.visible=String(t.visible);item.node.style.display=t.visible?'':'none';
      for(const face of item.faces)face.setAttribute('fill',shade(color,Number(face.dataset.faceShade)));
      item.missing.setAttribute('opacity',String(missing));item.shadow.setAttribute('cy',String(50+layers*70));item.architecture.setAttribute('transform',`translate(0 ${num(-layers*12)})`);
      for(const layer of item.layers){layer.setAttribute('opacity',String(layers));layer.setAttribute('transform',`translate(0 ${num(layers*(Number(layer.dataset.layer)+1)*24)})`);}
    }
  }
  const Resize=container.ownerDocument?.defaultView?.ResizeObserver;
  const observer=Resize?new Resize(draw):null;observer?.observe(container);draw();
  return {
    update(next={}){if(destroyed)return;state={...state,...next};if(next.phase||next.formation)state.formation=clampFormation(next.formation??{from:next.phase});draw();},
    setPresentation(next={}){if(destroyed)return;frame={...next,formation:clampFormation(next.formation)};state={...state,...next};draw();},
    destroy(){if(destroyed)return;destroyed=true;observer?.disconnect();svg.remove();},
  };
}
