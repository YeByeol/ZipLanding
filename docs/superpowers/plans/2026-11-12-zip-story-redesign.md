# ZIP 연결된 랜딩 스토리 재설계 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 첫 질문부터 한 도시의 정보 전환, 한 체험, 세 곳의 선택 이유로 이어지는 랜딩 전체를 재제작하고 기존 Pages에 배포한다.

**Architecture:** 기존 계산·색·Three/SVG 엔진을 재사용한다. index/styles는 전체 구성과 시각 위계를 교체하고, 새 story module은 스크롤에서 도출한 phase만 소개 renderer에 반영한다. main의 단일 제품 state와 계산이 체험·선택·비교·소개 값에 공유된다.

**Tech Stack:** static HTML/CSS, vanilla ES modules, 기존 Three.js 0.187.0, Node test, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-11-12-zip-story-redesign.md`

## Global Constraints

- ZIP 로고·Pretendard·paper/teal·가격 청록/점수 보라 유지. 새 런타임 의존성 없음.
- 가상 예시·개발 중 표시와 기존 score/comparison/URL 정책 유지. ZipDev 코드는 수정하지 않음.
- 소개는 한 #story-city, 체험은 한 #experience-city. 처음 화면에 시점 조작을 나열하지 않음.
- 스크롤이 제품 state/URL/선택을 변경하지 않음. explicit slider는 score 모드로 바꾸되 selected ID 유지.
- 320px overflow 없음, 본문16px/작은글자13px/버튼44px, 제목 두 줄 이하.
- reduced motion에서 정보 phase는 현재 장을 반영하고 자동 카메라는 멈춤. JS/WebGL 실패 시 읽기 보장.

## Review Focus

- 위로 되돌아가는 scroll 및 resize에서 phase/범례/색 의미가 같은 장을 가리키는지.
- 공유 URL의 mode·weights·selected·empty saved를 default가 덮지 않는지.
- 모바일 sticky/짧은 가로 화면에서 본문·행동을 가리지 않는지.
- 중요도 입력/새 선택/비교 제거 뒤 재렌더가 hover·focus·카메라를 깨지 않는지.
- JS 차단·그래픽 미지원·reduced motion에서 모든 이야기와 초기 예시 수치가 읽히는지.

### Task 1: 전체 시각·문구·반응형 재제작

**Files:** `index.html`, `styles.css` only.
**Interfaces:** spec DOM/연결 인터페이스의 IDs/data 속성을 정확히 제공한다. root와 Task2는 이 계약으로 결합된다.

- [ ] 기존 메타·SVG브랜드·글꼴·스크립트 없는 수치를 보존하고 새 copy deck/4장 소개/한 체험/이유 비교/근거/마무리 순서로 HTML을 교체한다.
- [ ] split-stage 44/56 소개와 한 도시, 넓은 체험, 요약 비교 카드, 짧은 근거·FAQ·닫는 행동을 구현한다. 작은 화면의 별도 composition을 만든다.
- [ ] 소개와 체험의 값/범례/phase 상태 스타일, hover/focus/disabled, native details를 포함한다. 이동시키는 마케팅 문구는 처음부터 읽히게 한다.
- [ ] 기본 A: 보증금1000/월세35/면적23/경사1/고도90/1995/점수37, B:3000/48/30/2/83/2001/45, C:5000/61/37/3/76/2007/52를 기존 계산과 확인해 초기 HTML에 넣는다.
- [ ] Taste 소스 lint 및 DOM 필수 ID 자기검사, 1440/768/390 screenshot로 Task2와 결합 후 확인한다.

### Task 2: 의미가 이어지는 phase와 단일 제품 체험

**Files:** create `scripts/story.mjs`, `tests/story.test.mjs`; modify `scripts/main.mjs`, `scripts/motion.mjs`, `tests/motion.test.mjs`, `package.json`.

**Interfaces:**
- `storyPhaseForSteps(rects, viewport)` pure export returns `{phase, progress}`. rects are 4 ordered `{top}` values; screen midline chooses last crossed phase; progress clamps0..1 from first/last top. Invalid values return price/0. Phases are price/conditions/criteria/value.
- `mountStory({root,element,owner})` returns `{update(state),updateScroll({reduced}),destroy()}`. root=#platform, element=#story-city, owner=mountScene3D; module queries spec data attrs under root. It imports existing BUILDINGS/scoreBuilding/monthlyUnit/comparisonFor/PALETTES rather than new calculations. Mode map price→price,conditions→terrain,criteria→score,value→price. Each phase preserves selected ID/weights/saved. Intro has interactive:false.
- `mountMotion` optional `onUpdate({reduced})` runs in existing batched frame before reduced-motion return. No additional global scroll loop. Existing consumers/tests remain valid.
- main creates story owner + one interactive experience owner. Story state updates render numeric fields and active phase without mutating state. Existing `render()` calls `story.update(state)`, experience.update(state). Default mode score only if URL has no explicit valid mode; slider input sets score, preserves selection. Keep all controls/share/focus and clean up on pagehide.
- renderComparison creates `.saved-place` summary sections with native choose/remove actions, marker `.place-id`, score `.place-score`, price `.place-price`, facts `.place-facts` for slope/elevation/year, all derived existing values. Full table remains. No invented best-choice labels.

- [ ] Write tests for forward/backward boundaries, invalid viewport/rects, progress clamp, mode map and state not mutated; prove RED.
- [ ] Implement phase/controller + onUpdate connection with bounded scene.update only state/phase changes; setProgress only meaningful delta and !reduced. No per-frame DOM churn/infinite loop.
- [ ] Integrate shared numeric fields, selected bridge, comparison summary, semantic colors and legend. Clear stale hovered state through existing renderer update.
- [ ] Verify query/default priority, empty saved, missing values, explicit slider→score, keyboard/focus, reduced info-current/camera-static tests. Prove GREEN and existing21 tests preserved.
- [ ] Run npm test/check and export-city; add story.mjs to syntax script and bump version2.0.0.

### Task 3: 전체 검증·수정·공개

**Files:** docs/verification.md, README.md and scoped implementation fixes only.

- [ ] Independent fresh code/spec review after Tasks1/2; fix important defects.
- [ ] Batched desktop/tablet/mobile screenshots: verify hero question, all4meaningfullydifferent chapters/continuoussamecity, one interaction area, summary-firstcomparison, closingquestionanswered. Check sticky overlap and shortheight. Fix in one batch; one confirm batch.
- [ ] Actual browser: forward/reversephase+legend+renderer; state/URL unchanged byscroll; sliderchangescolors/scores; savedplacebridge; missing/emptystates; nativepointer+touch; reducedcurrentphase; WebGLfallback; scriptblockedHTML; axe.
- [ ] Source lint+Taste realbrowser+Impeccable mechanical detector once; contextual exceptions only from approvedbrand/productUI.
- [ ] Fresh tests/check/export, stage only intended changes, commit+ff main+push authorized Pages deployment, verify Actions success and publicassets/nativeinteraction/390px.
- [ ] Record exact receipts/sourceSHA and actual limits, docs-onlycommit, clean featurebranch and ownbrowsersession.
