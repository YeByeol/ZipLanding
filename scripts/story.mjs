import { PALETTES, mixColor } from './city.mjs';
import { PHASES, MODES, storyTimeline } from './story-timeline.mjs';
import { filmSnapshot } from './film-model.mjs';

const captions = {
  discover:'설명용으로 설계한 가상 동네입니다. 지금 연결된 실제 거래나 지역 자료가 아닙니다.',
  price:'청록색이 진할수록 면적당 월 환산 가격이 높습니다. 가격만으로 장소의 조건은 설명되지 않습니다.',
  conditions:'모래색은 예시 경사입니다. A의 경사·고도·준공 연도를 함께 읽습니다.',
  criteria:'시연 중요도가 균등에서 경사 80%·고도 10%·연식 10%로 바뀝니다. 가격은 점수에서 제외합니다.',
  comparison:'같은 A·B·C의 점수와 가격·조건입니다. 모든 사람에게 같은 우승 장소를 뜻하지 않습니다.',
  value:'보증금 연 5% 환산 가정·관리비 제외. 비슷한 점수의 두 곳을 보여주며 퍼센트로 요약하지 않습니다.',
  evidence:'X의 조건과 점수는 자료 없음입니다. 실제 제품에서도 신고 계약과 추정 지형, 건물 묶음의 근거를 구분합니다.',
  closing:'관악구에서 개발 중인 실제 지도로 이어집니다. 같은 장소와 카메라에서 지도·내 기준·시간·근거를 살펴봅니다.',
};

const CLOCK_EPSILON=.00002;
export function stepStoryProgress(current,target,elapsed=16){
 const end=Number.isFinite(target)?Math.max(0,Math.min(1,target)):0;
 if(!Number.isFinite(current))return end;
 const start=Math.max(0,Math.min(1,current));
 if(Math.abs(end-start)<=CLOCK_EPSILON)return end;
 const dt=Number.isFinite(elapsed)?Math.max(0,elapsed):16;
 const next=start+(end-start)*(1-Math.exp(-dt/90));
 return Math.abs(end-next)<=CLOCK_EPSILON?end:next;
}

export function storyPhaseForSteps(rects, viewport) {
  const fallback={phase:'discover',progress:0};
  if(!Number.isFinite(viewport)||viewport<=0||!Array.isArray(rects)||rects.length!==PHASES.length)return fallback;
  const tops=Array.from(rects,rect=>rect?.top);
  if(!tops.every(Number.isFinite)||tops.some((top,i)=>i&&top<tops[i-1])||tops.at(-1)<=tops[0])return fallback;
  const progress=Math.max(0,Math.min(1,-tops[0]/(tops.at(-1)-tops[0])));
  return {phase:storyTimeline(progress).phase,progress};
}

export function mountStory({root,element,owner,onPhaseChange}) {
  const all=selector=>[...(root?.querySelectorAll(selector)??[])];
  const steps=all('[data-story-step]'),panels=all('[data-story-panel]'),links=all('[data-story-link]');
  const fields=all('[data-film-field]'),weights=all('[data-film-weight]');
  const priceBars=all('[data-film-price-bar]');
  const chapterSelect=root?.querySelector('#story-chapter-select'),position=root?.querySelector('#story-position');
  const previousButton=root?.querySelector('[data-story-prev]'),nextButton=root?.querySelector('[data-story-next]');
  const originalButtons=[previousButton,nextButton].filter(Boolean).map(button=>({button,disabled:button.disabled,label:button.getAttribute('aria-label')}));
  const legacyFields=all('[data-story-field]'),units=all('[data-story-unit]');
  const caption=root?.querySelector('#story-caption'),legend=root?.querySelector('#story-legend'),selection=root?.querySelector('#hero-selection');
  const originalRoot=Object.fromEntries(['storyPhase','storyEnhanced','filmProgress','filmTarget'].map(key=>[key,root?.dataset[key]]));
  const initialMode=element?.dataset.storyMode,captionOpacity=caption?.style.opacity;
  const originalFilmProgress=root?.style?.getPropertyValue?.('--film-progress')??'';
  const entranceKeys=['--enter-title','--enter-copy','--enter-graphic'];
  const originalPanels=panels.map(panel=>({panel,hidden:panel.hidden,inert:Boolean(panel.inert),tabIndex:panel.tabIndex??-1,tabindex:panel.getAttribute('tabindex'),aria:panel.getAttribute('aria-hidden'),opacity:panel.style.opacity,beats:[1,2,3].map(i=>panel.style.getPropertyValue?.('--beat-'+i)??''),entrances:entranceKeys.map(key=>panel.style.getPropertyValue?.(key)??'')}));
  const originalLinks=links.map(link=>({link,aria:link.getAttribute('aria-current')}));
  const viewport=root?.ownerDocument?.defaultView;
  const lowHeight=viewport?.matchMedia?.('(max-height: 620px)');
  // Dense proof scenes need a real model band, not a cropped sliver on short phones.
  const shortPhone=viewport?.matchMedia?.('(max-width: 760px) and (max-height: 700px)');
  const useDocumentFlow=()=>Boolean(lowHeight?.matches??viewport?.innerHeight<=620)||Boolean(shortPhone?.matches);
  let enhanced=!useDocumentFlow();
  let reduced=viewport?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches??false;
  let progress=0,targetProgress=0,phase,presentationKey,fieldsKey,destroyed=false,hasRead=false,frame=null,lastTime=null;
  const document=root?.ownerDocument;
  const canAnimate=typeof viewport?.requestAnimationFrame==='function'&&typeof viewport?.cancelAnimationFrame==='function';
  const setBeat=(panel,key,value)=>panel.style.setProperty?panel.style.setProperty(key,value):panel.style[key]=value;

  function render() {
    if(destroyed)return;
    const snapshot=filmSnapshot(progress,phase,{reduced,complete:!enhanced});
    const timeline=snapshot.timeline;
    const phaseChanged=phase!==timeline.phase;
    phase=timeline.phase;
    if(root){root.dataset.storyPhase=phase;root.dataset.storyEnhanced=String(enhanced);root.dataset.filmProgress=String(progress);root.dataset.filmTarget=String(targetProgress);root.style?.setProperty?.('--film-progress',String(progress));}
    if(element)element.dataset.storyMode=MODES[phase];
    for(const panel of panels){
      const index=PHASES.indexOf(panel.dataset.storyPanel),alpha=enhanced?timeline.opacities[index]??0:1;
      if(panel.hidden&&alpha>0){
        panel.style.opacity='0';panel.hidden=false;panel.scrollTop=0;
      }
      panel.tabIndex=enhanced?0:-1;
      panel.style.opacity=String(alpha);panel.hidden=alpha===0;
      panel.setAttribute('aria-hidden',String(enhanced&&panel.dataset.storyPanel!==phase));
      panel.inert=enhanced&&panel.dataset.storyPanel!==phase;
      snapshot.beats[panel.dataset.storyPanel]?.forEach((beat,i)=>setBeat(panel,'--beat-'+(i+1),String(beat)));
      entranceKeys.forEach((key,i)=>setBeat(panel,key,String(enhanced?timeline.entrances[panel.dataset.storyPanel][i]:1)));
    }
    if(chapterSelect)chapterSelect.value=phase;
    const phaseIndex=PHASES.indexOf(phase),focused=document?.activeElement;
    const labels=['발견','가격','조건','내 기준','장소 비교','가격 환산','근거','마무리'];
    for(const[button,index,direction]of[[previousButton,phaseIndex-1,'이전'],[nextButton,phaseIndex+1,'다음']]){
      if(!button)continue;
      const target=PHASES[index];
      const option=[...(chapterSelect?.options??[])].find(option=>option.value===target);
      const name=(option?.label||option?.textContent||labels[index]||'').trim();
      button.disabled=!target;
      button.setAttribute('aria-label',target?`${direction} 장면: ${name}`:`${direction} 장면 없음`);
      if(button.disabled&&focused===button)chapterSelect?.focus?.({preventScroll:true});
    }
    if(position)position.textContent='스크롤로 이어 보기';
    for(const link of links){
      const target=link.dataset.storyLink||link.getAttribute('href')?.replace('#story-','');
      if(target===phase)link.setAttribute('aria-current','step');else link.removeAttribute('aria-current');
    }
    const visiblePhase=PHASES[timeline.opacities.findIndex(alpha=>alpha>0)];
    if(legend?.style){legend.style.visibility=['criteria','comparison'].includes(visiblePhase)?'visible':'hidden';legend.style.opacity=String(Math.max(...timeline.opacities));}
    const {from,to,mix}=snapshot.frame.colorBlend;
    [...(legend?.querySelectorAll('i')??[])].forEach((swatch,i)=>{swatch.style.backgroundColor=mixColor(PALETTES[from][i],PALETTES[to][i],mix);});
    if(caption){
      const visible=timeline.opacities.findIndex(alpha=>alpha>0);
      const textPhase=enhanced?PHASES[visible<0?PHASES.indexOf(timeline.to):visible]:'discover';
      caption.textContent=captions[textPhase];caption.style.opacity=String(enhanced?Math.max(...timeline.opacities):1);
    }
    const nextFieldsKey=JSON.stringify(snapshot.fields);
    if(nextFieldsKey!==fieldsKey){
      fieldsKey=nextFieldsKey;
      for(const field of fields){const value=snapshot.fields[field.dataset.filmField];if(value!==undefined){field.textContent=value;field.dataset.missing=String(value==='자료 없음');}}
      const legacy={...snapshot.fields,place:'장소 A',id:'A',score:snapshot.fields['score-a'],peers:snapshot.fields['peer-summary']};
      for(const field of legacyFields){const value=legacy[field.dataset.storyField];if(value!==undefined){field.textContent=value;field.dataset.missing=String(value==='자료 없음');}}
      for(const unit of units)unit.hidden=legacy[unit.dataset.storyUnit]==='자료 없음';
    }
    for(const bar of weights){const value=snapshot.weights[bar.dataset.filmWeight];if(value===undefined)continue;bar.style.transform=`scaleX(${value/100})`;bar.setAttribute('aria-valuenow',String(value));bar.setAttribute('aria-valuetext',`${snapshot.fields['weight-'+bar.dataset.filmWeight]}%`);}
    for(const bar of priceBars){const row=snapshot.priceBars.find(row=>row.id===bar.dataset.filmPriceBar);if(row)bar.style.setProperty('--price-ratio',String(row.ratio));}
    if(selection)selection.textContent=snapshot.selected==='x'?'장소 X · 조건과 내 기준 점수 자료 없음':`장소 A · 월세 35만 · 시연 내 기준 ${snapshot.fields['score-a']}점`;
    const key=JSON.stringify(snapshot.frame);
    if(key!==presentationKey){presentationKey=key;owner?.setPresentation(snapshot.frame);}
    if(phaseChanged)onPhaseChange?.(phase);
  }
  function cancelClock(){
    if(frame!==null)viewport?.cancelAnimationFrame?.(frame);
    frame=null;lastTime=null;
  }
  function schedule(){
    if(!canAnimate||destroyed||document?.hidden||frame!==null||progress===targetProgress)return;
    lastTime??=viewport.performance?.now?.()??null;
    frame=viewport.requestAnimationFrame(tick);
  }
  function tick(time){
    frame=null;
    if(destroyed||document?.hidden)return;
    const elapsed=Number.isFinite(time)&&Number.isFinite(lastTime)?time-lastTime:16;
    lastTime=Number.isFinite(time)?time:null;
    progress=stepStoryProgress(progress,targetProgress,elapsed);
    render();
    if(progress===targetProgress)lastTime=null;else schedule();
  }
  function updateScroll({reduced:preference=reduced,immediate=false}={}){
    if(destroyed)return;
    const nextEnhanced=!useDocumentFlow();
    const modeChanged=enhanced!==nextEnhanced||reduced!==preference;
    if(modeChanged)presentationKey=undefined;
    enhanced=nextEnhanced;reduced=preference;
    targetProgress=storyPhaseForSteps(steps.map(step=>step.getBoundingClientRect()),viewport?.innerHeight).progress;
    const bypass=!hasRead||immediate||modeChanged||reduced||!enhanced||!canAnimate||document?.hidden;
    hasRead=true;
    if(bypass){cancelClock();progress=targetProgress;}
    else progress=stepStoryProgress(progress,targetProgress,0);
    render();
    if(progress===targetProgress)cancelClock();else schedule();
  }
  function visibilityChanged(){cancelClock();presentationKey=undefined;updateScroll({reduced:viewport?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches??reduced,immediate:true});}
  document?.addEventListener?.('visibilitychange',visibilityChanged);
  render();
  return {
    update(){render();},
    updateScroll,
    destroy(){
      destroyed=true;
      cancelClock();
      document?.removeEventListener?.('visibilitychange',visibilityChanged);
      if(originalFilmProgress)root?.style?.setProperty?.('--film-progress',originalFilmProgress);else root?.style?.removeProperty?.('--film-progress');
      if(root)for(const[key,value]of Object.entries(originalRoot)){if(value===undefined)delete root.dataset[key];else root.dataset[key]=value;}
      if(element){if(initialMode===undefined)delete element.dataset.storyMode;else element.dataset.storyMode=initialMode;}
      if(caption)caption.style.opacity=captionOpacity??'';
      for(const{panel,hidden,inert,tabIndex,tabindex,aria,opacity,beats,entrances}of originalPanels){panel.hidden=hidden;panel.inert=inert;panel.tabIndex=tabIndex;if(tabindex===null)panel.removeAttribute('tabindex');else panel.setAttribute('tabindex',tabindex);panel.style.opacity=opacity??'';if(aria===null)panel.removeAttribute('aria-hidden');else panel.setAttribute('aria-hidden',aria);beats.forEach((beat,i)=>{if(beat)setBeat(panel,'--beat-'+(i+1),beat);else panel.style.removeProperty?.('--beat-'+(i+1));});entrances.forEach((value,i)=>{if(value)setBeat(panel,entranceKeys[i],value);else panel.style.removeProperty?.(entranceKeys[i]);});}
      for(const{button,disabled,label}of originalButtons){button.disabled=disabled;if(label===null)button.removeAttribute('aria-label');else button.setAttribute('aria-label',label);}
      for(const{link,aria}of originalLinks){if(aria===null)link.removeAttribute('aria-current');else link.setAttribute('aria-current',aria);}
    },
  };
}
