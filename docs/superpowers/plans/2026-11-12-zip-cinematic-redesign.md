# ZIP 전폭 시네마틱 랜딩 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 사용자 Apple 레퍼런스의 전폭 장면·대상 크기 변화·짧은 문구 리듬을 ZIP의 독자적 소개로 구현해 Pages에 공개한다.
**Architecture:** 기존26개 테스트가 검증한 제품 state/계산/두 scene을 재사용한다. HTML/CSS는 split-stage를 완전히 교체한다. story는 viewport waypoint에서 phase와 연속 camera frame을 도출하고, renderer는 소개 전용 bounded presentation API로 받아 유한 보간한다.
**Tech Stack:** static HTML/CSS, vanilla modules, Three0.187.0, Node test, Pages.
**Spec:** `docs/superpowers/specs/2026-11-12-zip-cinematic-redesign.md`

## Global Constraints
- Apple자산·소스·문구 복사 없음. ZIP/예시데이터/청록가격·보라점수 유지.
- 전체한무대(소개)와 한체험, 스크롤은 제품state/URL불변. 새 runtime dependency 없음.
- 첫프레임wide, 선택장소macro, 다시wide 점수, plan 가격의 구도차가 보여야함.
- mobile본문viewport고정 금지: 모든연출요소는같은sticky-stage안에서함께끝남.
- JS/WebGL/reduced/320px/선택X/20peers를실제로확인. 모든모드·공유·담기·키보드기능보존.

## Review Focus
- 4waypoint전진/역방향/resize에서 phase와 camera progress가 분리되어 첫프레임0 유지.
- presentation API가 interactive scene의 수동camera를덮지않고 bounds/NaN을막음.
- 선택X 및 연식중요도0의20peers가 무대에서CTA/값을넘치게하지않음.
- reducedmotion과 WebGLfallback이 모든장면의정보를제공하며 camera는wide정지.
- JS없는initialHTML은4장본문·SVG·올바른보라범례·비교값이읽힘.

### Task 1: 전면 시각 재제작
**Files:** index.html, styles.css only.
**Interface:** spec의existingIDs/data-story-fields+unit/waypoints/panels. Root film #platform, sticky #story-stage, 4waypoints(data-story-step) + 4panels(data-story-panel), 동일phaseanchors. 모든콘텐츠는stage안, scrolltrack은별도4waypoint. DefaultHTML은4panels일반흐름; storyEnhanced true만fullviewport sticky+activepanel. hidden default금지(초기JS가hide).
- [x] 첫h1/전폭dark도시/짧은4장문구, 카메라macro공간을고려한overlay composition구현.
- [x] 400svh boundedstage+normalflowexit, mobile동일전폭무대; lowheightfallback.
- [x] 체험을widecanvas+아래3sliders로교체. 비교요약/근거/FAQ/큰닫는ZIP까지새composition.
- [x] source/DOMchecks, staticfacts/validinitiallegend/units/AXnames. Root가fresh3viewport와macro/wide변화를검증.

### Task 2: 소개 camera/state 연결
**Files:** scripts/scene3d.mjs, scripts/scene-model.mjs, scripts/story.mjs, tests/scene-model.test.mjs, tests/story.test.mjs; 필요시main소규모연결.
**Interface:**
- export `presentationForProgress(progress, building, {reduced=false}={})`: returns `{yaw,pitch,zoom,target:{x,y,z}}`. Spec4camera states at0,.3,.62,1; interpolate fromwide toselectedmacro towide score toplan. clampinvalidprogress, no mutation. reduced returns samewideframe0 regardlessprogress.
- owner.`setPresentation(frame)` introduced onlyfor interactive:false scene, preservesmanual/interactivecamera. yaw/pitch boundedclampView, narrativezoom.7..4.8, target finiteandcitybounds. Appliesexistingfiniteanimation. PublishdatasetviewPreset='story' andtargetX/Z/viewZoomforQA. Existingcontrolszoomrange.75..1.6 unchanged.
- storyPhaseForSteps retainsmidlinephase but progress=`clamp(-firstTop/(lastTop-firstTop))` soinitialframe0. updateScroll callssetPresentation onlychangedcamera frame and infoalwayscurrent. Remove obsolete storyActive-mobile-fixedbodycomplexity. Reduced getsstaticwide framewithoutcontinualcalls. Stateupdate selected changespresentationtarget ifneeded atcurrentscroll.
- peer preview maximum3+remainingcount; fullcomparison remainsnormaldetails. No longlist in viewport. Keepmode map price/terrain/score/price and no state/URLmutation.
- [x] RED tests forpresentationendpoints/interpolation/reverse/bounds/reduced/selectionmutation, progressinitial0, missing/20peersbounded, presentationinteractiveguardasfeasible.
- [x] Implementminimal API/controller reuseexistingThree andlogic. TestsGREEN26+new; syntax/export pass.

### Task 3: 검증과 공개
**Files:** README/docs/verification andscopedfixes.
- [x] Freshwholebranchreviewagainst2b5bfbf; spec+code+20peer/320failureboundaries.
- [x] Batchedfirst/macro/wide/planandmobileactualscreens; onefixbatch+oneconfirm. Focalmotionrealviewportpositions notclaimanimationfromtests.
- [x] Native/keyboard/sliders/sharedstate, reversecamera, manualexperiencecamera, empty/missing/longpeer, noJS/WebGLfallback/reduced. Axeandsource/Taste; detectoronlyasneededforchangednewworld,recordactualexceptions.
- [x] tests/check/export+scopedstaging, sourcecommit+ffmain+pushalreadyapproved. Actions+freshpublicUI+assetbytes+390verify. RecordsourceSHA, docs-onlyreceiptcommit, cleanupownbrowser/branch.

제작 검토 defaults는 spec 마지막 절을 우선한다. Body-fixed가 아닌 stage 내부 배치, lowheight<=620px JS/CSS 동기화, 공통 CTA, 동적 비교 제목을 두 Task 인터페이스에 포함한다.
