const NS='http://www.w3.org/2000/svg';
const clamp=value=>Math.max(0,Math.min(1,value));
const point=value=>value&&Number.isFinite(value.x)&&Number.isFinite(value.y);

export function connectionPath(from,to){
  if(!point(from)||!point(to))return null;
  const n=value=>Math.round(value*100)/100;
  const gap=to.y-from.y;
  return `M${n(from.x)},${n(from.y)} C${n(from.x)},${n(from.y+gap*.45)} ${n(to.x)},${n(to.y-gap*.35)} ${n(to.x)},${n(to.y)}`;
}

export const isCovered=(source,rects)=>rects.some(rect=>source.x>=rect.left&&source.x<=rect.right&&source.y>=rect.top&&source.y<=rect.bottom);

export function mountStoryConnections({root,owner}){
  const layer=root?.querySelector('#story-connections');
  const stage=root?.querySelector('#story-stage');
  const city=root?.querySelector('#story-city');
  if(!layer||!stage||!city)return{setSnapshot(){},update(){},destroy(){}};
  const doc=root.ownerDocument;
  const links=[...root.querySelectorAll('[data-film-anchor]')].map(target=>{
    const panel=target.closest('[data-story-panel]');
    const group=doc.createElementNS(NS,'g'),path=doc.createElementNS(NS,'path'),ring=doc.createElementNS(NS,'circle');
    group.dataset.connectionPhase=panel.dataset.storyPanel;
    group.dataset.connectionId=target.dataset.filmAnchor;
    path.setAttribute('pathLength','1');path.setAttribute('fill','none');
    path.classList.add('story-connection-path');
    ring.setAttribute('r','12');ring.setAttribute('fill','none');ring.classList.add('story-connection-ring');
    group.append(path,ring);layer.append(group);
    return{target,panel,group,path,ring};
  });
  let snapshot,destroyed=false;

  function update(){
    if(destroyed)return;
    const active=root.dataset.storyEnhanced==='true'&&snapshot&&!doc.defaultView.matchMedia('(prefers-reduced-motion: reduce)').matches;
    layer.style.display=active?'':'none';
    if(!active)return;
    const box=stage.getBoundingClientRect(),art=city.getBoundingClientRect();
    if(!box.width||!box.height){layer.style.display='none';return;}
    layer.setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);
    const candidates=links.filter(link=>!link.panel.hidden&&+link.panel.style.opacity>0);
    const projections=new Map((owner?.projectAnchors?.([...new Set(candidates.map(link=>link.target.dataset.filmAnchor))])??[]).map(anchor=>[anchor.id,anchor]));
    const blockers=[...root.querySelectorAll('[data-film-occluder]')].filter(node=>!node.closest('[data-story-panel]')?.hidden).map(node=>node.getBoundingClientRect()).filter(rect=>rect.width&&rect.height);
    for(const link of links){
      const {target,panel,group,path,ring}=link;
      group.style.display='none';
      if(!candidates.includes(link))continue;
      const anchor=projections.get(target.dataset.filmAnchor),rect=target.getBoundingClientRect();
      if(!anchor?.visible||!rect.width||!rect.height)continue;
      const source={x:art.left+anchor.x,y:art.top+anchor.y};
      if(isCovered(source,blockers))continue;
      const paper=target.closest('[data-film-occluder]')?.getBoundingClientRect();
      const end={x:rect.left+rect.width/2-box.left,y:(paper?.top??rect.top)-box.top-5};
      const start={x:source.x-box.left,y:source.y-box.top};
      if(start.x<0||start.x>box.width||start.y<0||start.y>box.height||end.y<0||end.y>box.height)continue;
      const number=Number(target.dataset.filmLinkBeat||0);
      const beat=number?snapshot.beats[panel.dataset.storyPanel][number-1]:1;
      const alpha=clamp(+panel.style.opacity)*clamp(beat);
      if(!alpha)continue;
      path.setAttribute('d',connectionPath({x:start.x,y:start.y+12},end));
      path.style.strokeDashoffset=String(1-clamp(beat));
      ring.setAttribute('cx',String(start.x));ring.setAttribute('cy',String(start.y));
      group.style.opacity=String(alpha);group.style.display='';
      Object.assign(group.dataset,{sourceX:String(start.x),sourceY:String(start.y),targetX:String(end.x),targetY:String(end.y),renderer:anchor.renderer});
    }
  }
  const unsubscribe=owner?.onPaint?.(update);
  return{setSnapshot(next){snapshot=next;},update,destroy(){destroyed=true;unsubscribe?.();for(const{group}of links)group.remove();layer.style.display='none';}};
}
