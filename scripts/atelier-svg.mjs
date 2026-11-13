import { BUILDINGS } from './demo.mjs';
import { PALETTES, colorFrameForTransition } from './city.mjs';
import { clampFormation, formationPose, neighborhoodPresence } from './scene-formation.mjs';
import { compositionProjection } from './scene-framing.mjs';
import { neighborhoodSVG } from './atelier-neighborhood.mjs';

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
  const stone='#e8e7de',edge='#f5f3eb',plaster='#d1d9ce',glass='#567d70',metal='#867963',wood='#aa9272';
  const index=IDS.indexOf(id),pavilionX=.30+(index%3-1)*.035;
  let s=box(0,.026,0,1.66,.052,1.40,stone);
  s+=box(-.12,.060,.16,.39,.014,.91,plaster);
  for(const z of [-.16,.02,.20,.38,.56])s+=box(-.12,.071,z,.32,.012,.15,edge);
  s+=box(-.22,.73,-.43,.64,.26,.30,stone)+box(-.22,.865,-.43,.67,.035,.34,edge);
  s+=box(-.22,.737,-.269,.47,.135,.016,glass);
  for(const x of [-.40,-.22,-.04])s+=box(x,.737,-.255,.014,.15,.025,metal);
  s+=box(-.59,.35,-.04,.28,.57,.98,stone)+box(-.52,.092,-.03,.44,.060,1.04,edge);
  s+=box(-.438,.35,-.03,.018,.44,.84,glass)+box(-.52,.36,.458,.28,.47,.018,glass);
  for(const z of [-.36,-.11,.14,.39])s+=box(-.423,.35,z,.031,.49,.016,metal);
  for(const x of [-.665,-.53,-.395])s+=box(x,.36,.483,.018,.49,.035,metal);
  s+=box(-.52,.66,-.03,.45,.055,1.04,edge);
  s+=box(.38,.445,-.40,.56,.74,.27,color,{data:true});
  s+=box(.668,.438,-.04,.018,.66,.68,glass);
  for(const y of [.267,.624]) {
    s+=box(.38,y,y<.3?.287:.263,.51,.285,.018,glass);
    for(const z of [-.29,-.03,.23])s+=box(.689,y,z,.025,.31,.014,metal);
    for(const x of [.21,.47])s+=box(x,y,.305,.012,.29,.018,metal);
    for(const x of index%3===1?[.10,.66]:[.10,.38,.66])s+=box(x,y,.45,.030,.31,.041,color,{data:true});
    s+=box(.38,y+.148,.32,.56,.018,.27,wood);
  }
  s+=box(.38,.098,-.02,.68,.065,1.05,edge)+box(.38,.445,.01,.71,.045,1.13,edge);
  s+=box(.39,.639,.548,.64,.014,.014,metal)+box(.708,.639,.12,.014,.014,.86,metal);
  for(const x of [.075,.285,.495,.705])s+=box(x,.568,.548,.010,.15,.010,metal);
  for(const z of [-.30,-.02,.26])s+=box(.708,.568,z,.010,.15,.010,metal);
  s+=box(.38,.800,-.01,.72,.050,1.11,edge);
  s+=box(pavilionX,1.001,-.353,.58,.34,.36,color,{data:true});
  s+=box(pavilionX,.835,-.27,.70,.045,.72,edge);
  s+=box(pavilionX,1.008,-.163,.49,.27,.018,glass)+box(pavilionX+.299,1.008,-.31,.018,.27,.33,glass);
  for(const x of [-.23,0,.23])s+=box(pavilionX+x,1.008,-.143,.012,.28,.023,metal);
  s+=box(pavilionX,1.177,-.27,.74,.045,.75,edge)+box(pavilionX,1.207,-.27,.61,.015,.61,plaster);
  s+=box(pavilionX,.968,.065,.64,.012,.012,metal);
  for(const x of [-.315,0,.315])s+=box(pavilionX+x,.911,.065,.010,.12,.010,metal);
  const plant=(x,y,z,w,h)=>{const[cx,cy]=point(x,y,z);return `<ellipse cx="${num(cx)}" cy="${num(cy)}" rx="${w*80}" ry="${h*100}" fill="#65805d"/>`;};
  s+=box(-.53,.715,-.20,.29,.060,.49,plaster);
  for(const z of [-.36,-.22,-.07])s+=plant(-.53,.786,z,.095,.059);
  const planterX=index%2?.15:.51;
  s+=box(planterX,.871,.34,.29,.055,.19,plaster)+plant(planterX,.922,.34,.122,.062);
  s+=box(-.20,.103,-.33,.18,.09,.19,stone)+box(-.20,.201,-.33,.018,.17,.018,wood)+plant(-.20,.302,-.33,.114,.135);
  s+=box(-.17,.076,.641,.36,.035,.13,edge)+box(-.17,.052,.704,.42,.023,.05,stone);
  s+=box(-.30,.137,.23,.068,.022,.28,wood);
  s+=`<g class="building-missing" opacity="${missing}">`;
  for(let i=0;i<6;i++)s+=`<path d="M${points([point(.035+i*.085,1.219,-.51)])}L${points([point(.13+i*.085,1.219,-.05)])}" fill="none" stroke="#52675b" stroke-width="1"/>`;
  s+='</g>';
  const [mx,my]=point(.1,1.42,-.12);
  return s+`<g class="building-marker" transform="translate(${num(mx)} ${num(my)})"><circle r="14" fill="${id==='a'||id==='x'?'#194b3e':'#72548e'}"/><text text-anchor="middle" y="5" fill="#ffffff" font-family="Arial,sans-serif" font-size="14" font-weight="600">${id.toUpperCase()}</text></g>`;
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
  const wideMobile=Math.max(0,Math.min(1,(width-420)/180));
  const offsetFor=phase=>phase==='criteria'?.009:0;
  const mobileOffset=blend?0:(offsetFor(formation.from)+(offsetFor(formation.to)-offsetFor(formation.from))*formation.mix)*wideMobile;
  const y=.5+(projection.top+projection.bottom)/2*projection.zoom/(2*halfHeight)+mobileOffset;
  const unitFor=phase=>{
    const triple=phase==='comparison'||phase==='value',scale=triple?(phase==='value'?.66:.78):1.35;
    // Fit the complete roof and thin foundation between the mobile
    // copy and proof bands; their heights differ from the WebGL projection.
    const mobileHeight={discover:.32,price:.33,conditions:.32,criteria:.28,comparison:.23,value:.105,evidence:.22,closing:.25}[phase]??.32;
    const mobile=Math.min(width*(triple?.23:.68),height*mobileHeight);
    const desktop=Math.min(width*(triple?.20:.47),height*(triple?.47:.79));
    const targetW=mobile+(desktop-mobile)*blend;
    return targetW/(254*scale)*(['discover','closing'].includes(phase)?(blend?.44:.42):phase==='conditions'?.9:phase==='criteria'?.95:1);
  };
  const unit=(unitFor(formation.from)+(unitFor(formation.to)-unitFor(formation.from))*formation.mix)*(frame.standalone?1:projection.zoom);
  return {x:width*x,y:height*y,unit,spacing:110};
}
function transform(id,formation,place) {
  const pose=formationPose(id,formation);
  return {visible:pose.scale>.001,value:`translate(${num(place.x+pose.x*place.spacing*place.unit)} ${num(place.y+50*pose.scale*place.unit-pose.y*100*place.unit+pose.z*40*place.unit)}) scale(${num(pose.scale*place.unit)})`};
}

/** A concept maquette, not a measured plan of the fictional example property. */
export function atelierSVG(options={}) {
  const state=initial(options),buildings=state.buildings??BUILDINGS,formation=state.formation;
  const width=960,height=550,place=layout(formation,width,height,{standalone:true,composition:{desktop:{x:.5,y:.55}}});
  const context=`<g class="atelier-neighborhood" transform="${transform('a',formation,place).value}" opacity="${neighborhoodPresence(formation)}">${neighborhoodSVG({box,point})}</g>`;
  const subjects=IDS.map(id=>{
    const building=buildings.find(item=>item.id===id);if(!building)return'';
    const {color,missing}=colorFrameForTransition(building,buildings,state.colorBlend??{from:state.mode},state.weights);
    const t=transform(id,formation,place);
    return `<g data-building-id="${id}" data-visible="${t.visible}" class="atelier-subject" transform="${t.value}" style="display:${t.visible?'inline':'none'}"><ellipse class="atelier-shadow" cx="28" cy="50" rx="107" ry="25" fill="#214e3c" opacity=".07"/><g class="atelier-architecture" >${maquette(id,color,missing)}</g></g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" aria-hidden="true" focusable="false" class="city-svg atelier-svg" data-city-mode="${state.mode}"><title>ZIP 설명용 가상 동네와 장소 모형</title>${context}${subjects}</svg>`;
}

export function mountAtelier(container,{buildings=BUILDINGS}={}) {
  if(!container||typeof container.querySelector!=='function')throw new TypeError('An atelier container is required.');
  let state=initial({buildings}),frame={},destroyed=false;
  container.innerHTML=atelierSVG(state);
  const svg=container.querySelector('svg'),context=svg.querySelector('.atelier-neighborhood');
  const subjects=[...svg.querySelectorAll('[data-building-id]')].map(node=>({node,building:buildings.find(item=>item.id===node.dataset.buildingId),faces:[...node.querySelectorAll('.atelier-data-face')],missing:node.querySelector('.building-missing'),shadow:node.querySelector('.atelier-shadow'),architecture:node.querySelector('.atelier-architecture')}));
  function draw() {
    if(destroyed)return;
    const width=container.clientWidth||960,height=container.clientHeight||550;
    const formation=clampFormation(frame.formation??state.formation),place=layout(formation,width,height,frame);
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.dataset.cityMode=state.mode;
    context?.setAttribute('transform',transform('a',formation,place).value);context?.setAttribute('opacity',String(neighborhoodPresence(formation)));
    for(const item of subjects) {
      const t=transform(item.building.id,formation,place),{color,missing}=colorFrameForTransition(item.building,buildings,state.colorBlend??{from:state.mode},state.weights);
      item.node.setAttribute('transform',t.value);item.node.dataset.visible=String(t.visible);item.node.style.display=t.visible?'':'none';
      for(const face of item.faces)face.setAttribute('fill',shade(color,Number(face.dataset.faceShade)));
      item.missing.setAttribute('opacity',String(missing));

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
