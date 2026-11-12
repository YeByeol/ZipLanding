import { PALETTES, mixColor } from './city.mjs';
import { PHASES, MODES, storyTimeline } from './story-timeline.mjs';
import { filmSnapshot } from './film-model.mjs';
import { mountStoryConnections } from './story-connections.mjs';

const captions = {
  discover:'직접 만든 24개 가상 장소입니다. 지금 연결된 실제 거래나 지역 자료가 아닙니다.',
  price:'청록색이 진할수록 면적당 월 환산 가격이 높습니다. 가격만으로 장소의 조건은 설명되지 않습니다.',
  conditions:'모래색은 예시 경사입니다. A의 경사·고도·준공 연도를 함께 읽습니다.',
  criteria:'시연 중요도가 균등에서 경사 80%·고도 10%·연식 10%로 바뀝니다. 가격은 점수에서 제외합니다.',
  comparison:'같은 A·B·C의 점수와 가격·조건입니다. 모든 사람에게 같은 우승 장소를 뜻하지 않습니다.',
  value:'보증금 연 5% 환산 가정·관리비 제외. 비슷한 점수의 두 곳을 보여주며 퍼센트로 요약하지 않습니다.',
  evidence:'X의 조건과 점수는 자료 없음입니다. 신고 계약·추정 지형·건물 묶음은 계획 중인 정보입니다.',
  closing:'이제 직접 기준을 바꿔보세요. 선택 체험의 입력은 이 소개의 시연과 별도로 유지됩니다.',
};

export function storyPhaseForSteps(rects, viewport) {
  const fallback={phase:'discover',progress:0};
  if(!Number.isFinite(viewport)||viewport<=0||!Array.isArray(rects)||rects.length!==PHASES.length)return fallback;
  const tops=Array.from(rects,rect=>rect?.top);
  if(!tops.every(Number.isFinite)||tops.some((top,i)=>i&&top<tops[i-1])||tops.at(-1)<=tops[0])return fallback;
  const progress=Math.max(0,Math.min(1,-tops[0]/(tops.at(-1)-tops[0])));
  return {phase:storyTimeline(progress).phase,progress};
}

export function mountStory({root,element,owner}) {
  const all=selector=>[...(root?.querySelectorAll(selector)??[])];
  const steps=all('[data-story-step]'),panels=all('[data-story-panel]'),links=all('[data-story-link]');
  const fields=all('[data-film-field]'),weights=all('[data-film-weight]');
  const priceBars=all('[data-film-price-bar]');
  const chapterSelect=root?.querySelector('#story-chapter-select'),position=root?.querySelector('#story-position');
  const legacyFields=all('[data-story-field]'),units=all('[data-story-unit]');
  const caption=root?.querySelector('#story-caption'),legend=root?.querySelector('#story-legend'),selection=root?.querySelector('#hero-selection');
  const originalRoot=Object.fromEntries(['storyPhase','storyEnhanced'].map(key=>[key,root?.dataset[key]]));
  const initialMode=element?.dataset.storyMode,captionOpacity=caption?.style.opacity;
  const originalPanels=panels.map(panel=>({panel,hidden:panel.hidden,inert:Boolean(panel.inert),aria:panel.getAttribute('aria-hidden'),opacity:panel.style.opacity,beats:[1,2,3].map(i=>panel.style.getPropertyValue?.('--beat-'+i)??'')}));
  const originalLinks=links.map(link=>({link,aria:link.getAttribute('aria-current')}));
  const viewport=root?.ownerDocument?.defaultView;
  const lowHeight=viewport?.matchMedia?.('(max-height: 620px)');
  let enhanced=!(lowHeight?.matches??viewport?.innerHeight<=620);
  let reduced=viewport?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches??false;
  let progress=0,phase,presentationKey,fieldsKey,destroyed=false;
  const setBeat=(panel,key,value)=>panel.style.setProperty?panel.style.setProperty(key,value):panel.style[key]=value;
  const connections=mountStoryConnections({root,owner});

  function render() {
    if(destroyed)return;
    const snapshot=filmSnapshot(progress,phase,{reduced,complete:!enhanced});
    const timeline=snapshot.timeline;
    phase=timeline.phase;
    if(root){root.dataset.storyPhase=phase;root.dataset.storyEnhanced=String(enhanced);}
    if(element)element.dataset.storyMode=MODES[phase];
    for(const panel of panels){
      const index=PHASES.indexOf(panel.dataset.storyPanel),alpha=enhanced?timeline.opacities[index]??0:1;
      panel.style.opacity=String(alpha);panel.hidden=alpha===0;
      panel.setAttribute('aria-hidden',String(enhanced&&panel.dataset.storyPanel!==phase));
      panel.inert=enhanced&&panel.dataset.storyPanel!==phase;
      snapshot.beats[panel.dataset.storyPanel]?.forEach((beat,i)=>setBeat(panel,'--beat-'+(i+1),String(beat)));
    }
    if(chapterSelect)chapterSelect.value=phase;
    if(position)position.textContent=`${String(PHASES.indexOf(phase)+1).padStart(2,'0')} / 08`;
    for(const link of links){
      const target=link.dataset.storyLink||link.getAttribute('href')?.replace('#story-','');
      if(target===phase)link.setAttribute('aria-current','step');else link.removeAttribute('aria-current');
    }
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
    connections.setSnapshot(snapshot);
    if(key!==presentationKey){presentationKey=key;owner?.setPresentation(snapshot.frame);}
    connections.update();
  }
  render();
  return {
    update(){render();},
    updateScroll({reduced:preference=reduced}={}){
      if(destroyed)return;
      const nextEnhanced=!(lowHeight?.matches??viewport?.innerHeight<=620);
      if(enhanced!==nextEnhanced||reduced!==preference)presentationKey=undefined;
      enhanced=nextEnhanced;reduced=preference;
      progress=storyPhaseForSteps(steps.map(step=>step.getBoundingClientRect()),viewport?.innerHeight).progress;
      render();
    },
    destroy(){
      destroyed=true;
      connections.destroy();
      if(root)for(const[key,value]of Object.entries(originalRoot)){if(value===undefined)delete root.dataset[key];else root.dataset[key]=value;}
      if(element){if(initialMode===undefined)delete element.dataset.storyMode;else element.dataset.storyMode=initialMode;}
      if(caption)caption.style.opacity=captionOpacity??'';
      for(const{panel,hidden,inert,aria,opacity,beats}of originalPanels){panel.hidden=hidden;panel.inert=inert;panel.style.opacity=opacity??'';if(aria===null)panel.removeAttribute('aria-hidden');else panel.setAttribute('aria-hidden',aria);beats.forEach((beat,i)=>{if(beat)setBeat(panel,'--beat-'+(i+1),beat);else panel.style.removeProperty?.('--beat-'+(i+1));});}
      for(const{link,aria}of originalLinks){if(aria===null)link.removeAttribute('aria-current');else link.setAttribute('aria-current',aria);}
    },
  };
}
