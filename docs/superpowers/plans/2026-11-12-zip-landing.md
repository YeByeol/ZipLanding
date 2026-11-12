# ZIP Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 승인된 ZIP 소개와 연결된 예시 체험을 제작하고 GitHub Pages에서 실제 작동하게 배포한다.

**Architecture:** 정적 HTML/CSS와 브라우저 ES modules. 순수 계산 모듈을 UI와 분리하고, SVG 도시를 DOM으로 그려 선택과 재색칠을 연결한다. 로컬 이미지와 글꼴만 사용한다.

**Tech Stack:** HTML, CSS, JavaScript, Node built-in test runner, SVG, GitHub Pages Actions.

**Spec:** `docs/superpowers/specs/2026-11-12-zip-landing-design.md` (사용자 승인).

## Global Constraints

- 기존 ZipDev와 미커밋 작업은 수정하지 않는다.
- 설명용 가상 데이터이며 실제 지역 가격이 아님을 명시한다. 매물·출시·고객·성과를 꾸미지 않는다.
- 가격은 점수에서 제외한다. 동일 중요도로 시작하고 모두 0이면 동일 중요도로 계산한다.
- 로고 원본 SVG, 밝은 바탕, 청록 가격·보라 점수, 제목 두 줄, 본문 16px 이상.
- 자산은 상대 경로. 외부 키·API·서버·가입·결제·개인정보 입력 없이 동작.
- 사용자에게 제작·배포 재승인을 요청하지 않는다. 이미 승인된 디자인의 실행이다.

## Review Focus

- URL의 손상·중복·범위 밖 입력: 안전한 기본값으로 복원하고 코드를 실행하지 않는다 (Task 1).
- 중요도 모두 0·결측 조건·같은 점수: 유한한 값과 설명이 유지된다 (Task 1).
- 모바일·키보드·no-JS·reduced motion: 본문 접근과 조작 대안을 유지한다 (Task 3).
- Clipboard API 실패·주소 상태 공유: 수동 복사로 이어지고 후보·기준이 복원된다 (Task 3).
- Pages 하위 경로·이미지/글꼴·배포: 실제 공개 주소에서 로드되고 동작한다 (Task 4).

### Task 1: 예시 데이터와 계산

**Files:** `scripts/demo.mjs`, `tests/demo.test.mjs`.

**Interfaces:** `BUILDINGS` (id,label,deposit,rent,area,slope,elevation,year,x,y,w,d,height), `DEFAULT_WEIGHTS={slope:1,elevation:1,age:1}`, `scoreBuilding(building,weights)`, `monthlyUnit(building)`, `rankBuildings(weights)`, `comparisonFor(building,weights)`, `parseState(search)`, `serializeState(state)`.

- [x] Node tests를 먼저 써서 가중치에 따른 순위 변경, 가격 제외, 결측, 0 입력, 동점, 공유 상태 정제·복원을 확인하고 실패를 기록한다.
- [x] 24개 가상 건물과 순수 계산을 구현한다. 금액은 만원, slope %, elevation m, year 연도. 점수는 각 조건을 예시 집합 내 순위로 만들고 가중 평균한다.
- [x] 월 환산 단가 `(rent + deposit*.05/12)/area`, 취향 점수 ±5 내 비교(본인 제외). 5개 미만이면 가격 나열, 5개 이상이면 비교 퍼센트와 수를 제공한다.
- [x] `node --test tests/demo.test.mjs`를 통과시킨다.

### Task 2: 브랜드와 도시 자산

**Files:** `assets/logo.svg`, `assets/mark.svg`, `assets/favicon.svg`, `assets/city-{price,score,terrain,compare}.svg`, `scripts/city.mjs`.

**Interfaces:** `mountCity(container,{buildings,onSelect,interactive=false})` returns `{update({mode,weights,selected,saved}),destroy()}`. `buildings`는 Task 1 스키마. map 클릭은 id를 넘긴다. SVG는 `data-building-id`를 가진다.

- [x] 심볼·가로 워드마크·반전 가능한 단색 SVG를 만든다. 실제 문자 Z로 읽히는 구획과 연결을 사용한다.
- [x] 가상 도시를 정교한 등각투영으로 그린다. 길·블록·공원·지형·건물 면·선택을 구분하고 price/score/terrain/compare 정지 장면을 만든다.
- [x] 렌더러는 동일 데이터의 x/y/w/d/height를 사용하고 색만 상태와 계산에 따라 바꾼다. 지도 SVG는 aria-hidden으로 두고 HTML 버튼으로 동등한 선택을 제공한다.
- [x] SVG 유효성과 로컬 브라우저 렌더를 확인한다. 작은 로고와 모바일 모형을 시각 검사한다.

### Task 3: 이야기·화면·연결

**Files:** `index.html`, `styles.css`, `scripts/main.mjs`, `assets/fonts/*`, `assets/og.png`, `package.json`, `README.md`.

**Consumes:** Task 1·2 exports. `state={weights,selected,saved,mode}`. mode price/score/value/terrain.

- [x] 승인된 문구·와이어프레임으로 페이지와 HTML 기본 예시를 만든다. 첫 화면 CTA, 자유 탐색, 중요도 체험, 가격 비교, 근거와 FAQ, 마무리를 각각 다른 구성으로 둔다.
- [x] 하나의 state→render 흐름으로 모든 지도·선택·정규화 비율·비교표·share URL을 연결한다. slider에 값·레이블, 결과에 aria-live. 저장·제거·reset을 연결한다.
- [x] 공유 실패 시 선택 가능한 readonly URL 필드를 제공한다. no-JS에서는 체험 설명과 정지 그림을 남긴다.
- [x] 1440/768/390/320px, 키보드, reduced-motion을 확인한다. 본문 16px, 최소 44px 조작 목표, overflow 제한을 확인한다.
- [x] Taste lint·inspect를 실행하고 실제 스크린샷을 보고 최대 세 차례 수정한다. 점수 보라색·실제 UI 프래그먼트에 필요한 예외만 근거와 함께 기록한다.

### Task 4: 검토와 공개

**Files:** `.github/workflows/pages.yml`, `docs/verification.md`.

- [x] 독립 검토자가 승인 설계·구현·테스트를 함께 보고 중요한 동작/보안/제품 주장 문제를 지적한다. 필요한 수정을 검증한다.
- [x] 소스 트리를 확인해 키·원자료·로컬 QA·이웃 저장소 파일이 포함되지 않았는지 확인한다.
- [x] `YeByeol/ZipLanding` 공개 저장소를 만들고 GitHub Pages Actions로 정적 페이지를 배포한다.
- [x] Actions 성공과 실제 `https://yebyeol.github.io/ZipLanding/`의 asset·상호작용·모바일을 확인한다.
- [x] 공개 URL, 구현 내용, 검증 범위와 남은 제한을 간단히 전달한다.
