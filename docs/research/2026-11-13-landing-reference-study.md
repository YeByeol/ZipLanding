# ZIP 랜딩 전면 개선: 레퍼런스·무료 렌더링·스킬 검토

조사일: 2026-11-13. 대상은 ZipDev를 소개하는 ZipLanding이며, 기존 paper/forest 색상, Pretendard, Z 심벌, 로컬 Three.js 0.187.0을 기준으로 한다.

## 판단

**한 동네와 한 선택 대상을 끝까지 유지하는 3D 제품 설명**이 적합하다. 첫 화면에서 가상 동네의 관계를 보여주고, 선택한 건물을 확대해 가격·조건·개인 기준을 설명한 뒤, 비교와 근거를 거쳐 동네로 돌아온다. 3D는 각 문장의 이유를 보여주는 매체가 되어야 한다. 큰 오브제를 한 번 보여준 뒤 비슷한 카드가 이어지는 구성은 사용자가 거듭 거부한 방향이다.

새 지도 엔진을 추가하기보다 **기존 Three와 공유 스크롤 시간축을 재사용**하는 안을 권장한다. GSAP는 복잡한 타임라인 저작이 실제로 필요해졌을 때의 대안이다. 라이브러리 교체만으로 구도·정보 계층·모션 연속성 문제는 해결되지 않는다.

이 문서는 외부 사이트가 보여주는 방법을 분석한다. 경쟁 제품의 기능·효과·수치를 ZipDev의 제공 기능으로 간주하지 않는다. 실제 소개 문구와 단계 이름은 ZipDev 코드·제품 문서 검토 결과에 맞춰 확정해야 한다.

## 확인 방식과 한계

- 아래 다섯 곳은 운영 주체의 공식 페이지, 공식 구현 예제 또는 공식 소스 저장소를 확인했다.
- Apple은 공개 HTML의 컴포넌트와 섹션 구조도 직접 확인했다. Mapbox·Google은 공식 예제 코드와 설정 구조를 확인했다.
- 외부 사이트의 실시간 브라우저 관찰은 CUA의 `The browser access host is unavailable` 오류로 진행하지 못했다. 따라서 프레임 단위의 실제 움직임·성능을 관찰했다고 주장하지 않는다. 확인된 구조와 ZIP에 대한 설계 제안을 아래에서 분리한다.
- Chartogne-Taillet은 JavaScript 전용 진입 화면만 확인되어 핵심 근거에서 제외했다. Google Earth 웹 앱 역시 지원 기기 안내만 반환하여, 실행 화면 대신 공식 3D Storytelling 자료를 선정했다.

## 공식 레퍼런스 다섯 곳

### 1. Apple — 사용자가 지정한 MacBook Pro 페이지

출처: [PROLED XDR 디스플레이 탑재 MacBook Pro](https://www.apple.com/kr/macbook-pro/proled-xdr-display/).

**확인:** 공개 HTML에는 미디어 히어로, 제품 뷰어, 디스플레이·터치·성능별 이야기 영역이 있으며, 여러 후속 영역에 `VideoScrub` 컴포넌트가 존재한다. 기능 설명 뒤에는 비교·상세 정보가 이어진다. 모든 움직임이 실시간 WebGL이라는 근거는 없다. 오히려 제품 뷰어·스크롤 영상·갤러리를 혼합한다.

**ZIP 적용 제안:** 도입 이후에도 같은 건물을 계속 사용하되, 전체 배치 → 입면/출입 방향 → 조건을 보는 시점 → 비교를 위한 동일 각도로 바꾼다. 각 장면은 하나의 시각적 질문만 해결한다. 설명이 길어지면 본문을 큰 표로 덮지 말고, 장면의 도착 지점에 짧은 제목과 한 개의 근거를 배치한다. Apple의 색상·카피·미디어를 복제하지 않고, 제품을 반복해서 다른 관점으로 설명하는 구조를 가져온다.

### 2. Giraffe — 도시·건물·숫자의 연결

출처: [Giraffe 공식 제품 소개](https://www.giraffe.build/).

**확인:** 공식 페이지는 한 프로젝트의 부지·설계·수치·보고를 연결하는 흐름을 설명하고, Pipeline → Due Diligence → Design Options → Feasibility → Investment Case의 순서를 제시한다. 단계 이동을 보여주는 데모와 개별 수치 표시가 존재한다. 이는 Giraffe의 기능 설명이며 ZipDev의 기능 증거는 아니다.

**ZIP 적용 제안:** 장소 A의 식별자와 실제로 검증한 정보가 장면 사이에서 유지되어야 한다. 지도에서 선택한 A가 가격 설명의 A, 조건 설명의 A, 비교표의 A로 연결되는 모습 자체를 시연한다. 정보 UI는 매 장면 새로 나타나는 장식 카드보다 같은 기준선·같은 단위·같은 선택 상태를 유지하는 작은 모듈이 적합하다. 값이 바뀌면 어떤 기준이 바뀌었기 때문인지 바로 옆에서 설명한다.

### 3. Mapbox — 스크롤과 지도 카메라의 연결

출처: [공식 scroll/flyTo 예제](https://docs.mapbox.com/mapbox-gl-js/example/scroll-fly-to/), [3D storytelling 설명](https://www.mapbox.com/blog/interactive-storytelling-3d-maps-with-mapbox-gl-js-v2), [공식 템플릿](https://github.com/mapbox/storytelling).

**확인:** 예제는 고정 지도와 장별 설명을 연결하고, 각 장에 center·zoom·bearing·pitch를 정의한다. 공식 템플릿은 장별 레이어 불투명도, 지형, 숨긴 장을 통한 지도 전환 등을 지원한다. 예제 자체는 장 진입 시 `flyTo`를 호출하는 방식이므로, 이것만으로 정방향·역방향 모두 정확한 연속 scrub이 보장되지는 않는다.

**ZIP 적용 제안:** 카메라·건물·강조색·근거 UI를 같은 장 상태에서 파생시킨다. 장면이 바뀔 때 전체 canvas를 교체하지 않는다. 데스크톱의 설명과 지도는 겹치지 않는 영역을 갖게 하고, 모바일에서는 설명/3D/핵심 근거를 세로로 나누어 배치한다. 지도 이동만 필요한 연결 구간은 설명을 추가하지 않아도 된다. 기존 공유 시간축이 이미 있으므로 Mapbox 엔진이나 진입 이벤트 구현을 그대로 가져올 필요는 없다.

### 4. Google Maps Platform — 장소를 따라가는 3D 이야기

출처: [3D Storytelling 공식 설명](https://developers.google.com/maps/architecture/3d-storytelling), [에디터 문서](https://developers.google.com/maps/architecture/3d-storytelling-editor), [공식 소스](https://github.com/googlemaps-samples/js-3d-storytelling).

**확인:** 공식 솔루션은 장별 장소·카메라·초점 설정을 JSON으로 보관한다. 샘플은 Cesium 렌더러와 Google Photorealistic 3D Tiles를 사용하며 여러 Google API 및 키를 요구한다. 저장소는 2025-07-31 보관 처리되었다. 무료 샘플 코드가 데이터 서비스의 무제한 무료 사용을 뜻하지 않는다.

**ZIP 적용 제안:** 화면마다 임의 줌을 지정하기보다 ‘어디를 보고 있으며 어떤 관계를 설명하는지’를 먼저 정하고 카메라를 설계한다. 첫 동네 전경과 마지막 동네 전경을 같은 공간으로 연결하면 확대된 건물의 위치를 잃지 않는다. 실데이터 연동을 확인하기 전에는 가상 동네를 실제 지역처럼 보이게 하는 지명·주소·거리 수치를 붙이지 않는다.

### 5. Bruno Simon — 같은 세계의 일관된 3D 표현

출처: [공식 포트폴리오](https://bruno-simon.com/), [제작자가 연결한 소스](https://github.com/brunosimon/folio-2025).

**확인:** 제작자는 Three.js 기반의 탐색 가능한 3D 세계라고 설명한다. 품질 옵션, 모바일/키보드 조작, renderer 선택 등의 UI가 있고, 공개 소스 및 Blender 파일을 안내한다. 이는 사용자가 직접 탐색하는 작품으로, 스크롤 기반 제품 소개와는 목적이 다르다.

**ZIP 적용 제안:** 주인공 건물·주변 건물·나무·보행 공간의 재질, 규모와 조명을 한 세계의 규칙으로 맞춘다. 선택 대상만 대비를 높이고 주변 동네는 방향을 이해할 만큼만 남긴다. 게임 조작·사운드·물리·장식적 수집 요소는 도입하지 않는다. 사용자가 스크롤만으로 전체 설명을 볼 수 있어야 한다.

## ZIP 화면 구성 및 모션 제안

아래는 구현 지침이며 외부 사례를 그대로 재현한 사실이 아니다. 단계별 기능 설명은 ZipDev 검토 결과와 대조한다.

| 현재 장 역할 | 장면이 보여줄 관계 | 3D 움직임 | 정보 UI |
| --- | --- | --- | --- |
| 발견 | 동네 안에서 장소를 보는 이유 | 전체 동네에서 A로 시선이 모임 | 한 줄 목적·선택 A·한 개 행동 |
| 가격 | A의 기본 조건 | 같은 A를 확대하고 정면을 읽을 수 있게 회전 | 월세/보증금/면적을 일정한 숫자 기준선에 배치 |
| 생활 조건 | 가격 밖에서 봐야 하는 조건 | 새로운 장식판 없이 필요한 면과 주변 관계를 보여줌 | 검증된 조건만 값·단위·설명으로 표시 |
| 개인 기준 | 기준 변경과 결과의 인과관계 | 같은 모델의 강조 상태가 연속적으로 변함 | 현재 적용 기준과 변화 이유를 동시에 표시 |
| 비교 | 세 장소를 동일 기준으로 읽기 | A 정체성을 유지한 채 B/C가 같은 각도로 합류 | 핵심 행만 먼저 제시; 비교 열과 모델 위치 일치 |
| 비용 해석 | 단위·가정이 비교를 어떻게 바꾸는가 | 비교 구도 유지, 관련 장소만 강조 | 식 전체보다 입력→환산 결과→가정을 단계적으로 제시 |
| 근거 | 관측값·가정·부재의 차이 | 모르는 값을 확정된 시각값으로 채우지 않음 | 값의 출처/가정/누락을 독립적인 텍스트 계층으로 표시 |
| 마무리 | 내 선택을 동네 맥락으로 돌려보기 | 처음 동네로 부드럽게 복귀, A 선택 상태 유지 | 한 개 주 행동과 짧은 설명 |

### 겹침을 디자인 단계에서 없애는 방법

1. **텍스트용 사각 덮개를 만들지 않는다.** 데스크톱에서는 설명 영역과 모델의 핵심 실루엣이 차지할 영역을 먼저 나눈다. 장면을 만들 때 카메라 target과 projection offset으로 여백을 확보한다. 가독성을 되찾으려고 반투명 패널을 뒤에 추가하는 방식은 배제한다.
2. 제목·본문·수치는 서로 다른 계층으로 설계한다. 본문 아래에 곧바로 거대한 패널을 붙이지 않는다. 값과 단위는 줄바꿈되어도 의미가 보존되게 묶고, 숫자는 tabular alignment를 사용한다.
3. 비교 영역은 밝거나 어두운 큰 카드 한 장으로 덮기보다 작은 제목, A/B/C 열 제목, 정렬된 값, 필요한 구분선으로 구성한다. 스크롤 장면에서 보여줄 핵심과 별도 체험에서 볼 전체 상세를 구분한다.
4. 진행 상태와 행동 버튼은 한 곳씩만 둔다. 진행바·이전/다음·CTA가 같은 하단 영역에서 경쟁하지 않도록 실제 높이와 safe area를 확보한다. 버튼 위치를 화면 크기마다 임의 absolute 값으로 누적 보정하지 않는다.
5. 모바일에서는 3D가 텍스트 뒤로 지나가지 않도록 설명, 장면, 근거 영역의 높이를 콘텐츠 기준으로 배분한다. 짧은 높이의 휴대폰에서도 지붕·기초·핵심 숫자가 모두 보여야 한다.

### 연속성을 만드는 모션 규칙

- 장별 동작은 ‘시선 이동 → 증거 변화 → 읽을 시간 → 다음 관계로 연결’로 구성한다. 모든 시간에 계속 흔들리는 것이 전 구간 모션을 뜻하지 않는다.
- 기존 한 개 시간축에서 카메라, 모델 배치, 색상, 설명 노출을 함께 계산한다. 두 easing clock이 같은 속성을 쓰지 않게 한다.
- 빠른 스크롤과 역스크롤에서도 동일 진행률은 동일 장면을 만든다. 장 진입 callback만으로 상태를 누적하지 않는다.
- 큰 카메라 움직임 중에는 읽을 글을 이동시키지 않는다. 짧은 등장 변화 뒤에는 안정된 기준선에 둔다. 본문에 blur·scale·perspective 효과를 적용하지 않는다.
- 검증은 장 중앙의 스크린샷에 더해 모든 장 경계 전/중/후, 역방향, resize, 낮은 viewport, reduced motion을 포함한다. 갑작스러운 canvas 교체·흰 프레임·중복 텍스트·하단 잘림을 별도로 확인한다.

## 무료 렌더링 후보 네 가지

무료 범위와 구현 비용을 분리한다. 크기는 2026-11-13 파일 수신 후 측정한 원본 바이트와 로컬 gzip 결과이며, 네트워크에서 실제로 전송된 크기나 성능 벤치마크는 아니다. 별도 worker·WASM·스타일·데이터·모델 파일을 제외한 경우를 명시했다. 조사 중 패키지를 설치하거나 실행하지 않았다.

| 후보 | 라이선스와 무료 범위 | 이번 환경의 비용 | 적합성 |
| --- | --- | --- | --- |
| **기존 Three.js 0.187.0** | [r187 MIT](https://github.com/mrdoob/three.js/blob/r187/LICENSE). 자체 모델·조명·카메라 렌더링에 별도 API 계정 불필요 | 현재 local module/core 합 2,133,699 B, 각각 gzip 합 419,412 B. 기존에 이미 제공 중인 비용이며 새 추가 비용이 아님. 선택한 addon 합 11,430 B는 앞선 리소스 검토에서 확인 | **채택.** 가상 동네와 건물을 자유롭게 연출하며 기존 스크롤 구조·SVG fallback 유지 |
| **GSAP 3.15.1 + ScrollTrigger** | [Standard No-Charge License](https://gsap.com/community/standard-license/). 일반 웹사이트 사용은 무상이며 상업 사용도 포함. MIT가 아니며 시각적 애니메이션 빌더 관련 금지 용도가 존재 | core 73,357 B + ScrollTrigger 44,683 B; 각각 gzip 합 46,439 B. 통합 시 기존 clock과 중복되지 않도록 역할 이관 필요 | **조건부 대안.** 여러 track·label 저작을 단순하게 만들 때 유용. 현재 구조를 보수하는 단계에 덧붙이지 않음 |
| **MapLibre GL JS 6.18.0** | [BSD-3-Clause](https://github.com/maplibre/maplibre-gl-js/blob/v6.18.0/LICENSE.txt). 렌더러 무료. 지도 타일·글꼴·스타일·검색 서비스의 권리/요금은 별도 | ESM 1,108,914 B, gzip 295,887 B; CSS 71,596 B, gzip 10,191 B. 데이터/추가 리소스 제외. 좌표·스타일·tile source·3D custom layer 통합 필요 | 실제 지도 탐색이 제품의 확인된 핵심일 때 별도 체험 후보. 가상 동네 소개를 위해 새 지도 stack을 추가할 이유는 약함 |
| **CesiumJS 1.147.0** | [공식 안내](https://cesium.com/platform/cesiumjs/): Apache-2.0, 상업·비상업 무상. 자체 데이터로 [offline 구성](https://github.com/CesiumGS/cesium/blob/main/Documentation/OfflineGuide/README.md) 가능. ion·외부 terrain/imagery/3D Tiles 사용 범위는 별도 | 주 Cesium.js만 6,095,011 B, gzip 1,774,708 B; worker/assets/widgets/data 제외. 지구좌표·타일·credits·카메라·배포 경로 관리가 추가됨 | 실제 지리 좌표·지형·3D Tiles를 설명해야 할 때 제품 화면에 적합. 현재 랜딩의 가상 모델용 추가 런타임으로는 과함 |

측정 출처: [GSAP core](https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/gsap.min.js), [ScrollTrigger](https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/ScrollTrigger.min.js), [MapLibre ESM](https://cdn.jsdelivr.net/npm/maplibre-gl@6.18.0/dist/maplibre-gl.mjs), [MapLibre CSS](https://cdn.jsdelivr.net/npm/maplibre-gl@6.18.0/dist/maplibre-gl.css), [Cesium main bundle](https://cdn.jsdelivr.net/npm/cesium@1.147.0/Build/Cesium/Cesium.js). MapLibre 6.18.0은 `dist/maplibre-gl.mjs`를 제공하며 과거 `.js` 경로를 그대로 가정하면 404가 발생한다.

무료 에셋은 [Poly Haven CC0](https://polyhaven.com/license)가 후보이나, 이미 적용한 [RoomEnvironment](https://threejs.org/docs/pages/RoomEnvironment.html)와 [PMREM](https://threejs.org/docs/pages/PMREMGenerator.html)으로 스튜디오 반사를 만들 수 있다. 외부 HDR/재질은 화면 품질이 실제로 개선될 때만 추가한다. 구체 파일·용량·라이선스는 [앞선 조형 리소스 검토](2026-11-13-sculpture-resources.md)에 기록했다. stock 건물이나 고해상도 HDR을 사용했다는 사실 자체가 품질 근거가 되지는 않는다.

## 스킬 검토

### 이번 작업에서 유지할 최소 구성

- **Taste / design-taste-frontend**: 본격적인 랜딩 아트 디렉션의 주 흐름. [제작자 저장소](https://github.com/leonxlnx/taste-skill)는 실제 레퍼런스·브라우저 확인·제품 UI를 강조한다. 설치된 버전을 사용하고, 기존 palette/type을 유지한다. 최신 공개 README가 달라졌다고 작업 중 전역 스킬을 업데이트하지 않는다.
- **Impeccable**: 별도 제작 흐름을 다시 돌리는 대신 정보 부분의 layout/typeset/adapt/harden 검사에 좁혀 쓴다. [제작자 설명](https://github.com/pbakaus/impeccable)은 기존 UI의 문제를 구체적으로 수정하는 데 초점을 둔다.
- **UI UX Pro Max / Three.js stack 자료**: 재질 공유·반복 mesh·cleanup·접근성 등 구현 검토에 한정한다. [제작자 저장소](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)가 Three.js stack 지원을 명시한다. 로컬 자료의 버전과 실제 r187 API를 구분한다.
- **설치된 HyperFrames animation의 Three/카메라 참조**: 같은 시간축, 같은 공간, 명확한 읽기 구간이라는 원칙만 참고한다. 웹 랜딩에 영상 렌더러나 HyperFrames runtime을 설치할 필요는 없다.

### 새로 발견한 공식 후보: GSAP AI Skills

[GSAP 공식 문서](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)의 AI Skills 링크가 [greensock/gsap-skills](https://github.com/greensock/gsap-skills)를 직접 가리킨다. 해당 저장소와 다음 원문을 읽었으며 **설치는 실행하지 않았다**. 스킬 문서는 MIT이고 GSAP 실행 라이브러리의 라이선스와 별개다.

- [gsap-timeline](https://github.com/greensock/gsap-skills/blob/main/skills/gsap-timeline/SKILL.md): label과 position을 사용해 순서를 표현하며, ScrollTrigger는 중첩 tween 각각이 아니라 최상위 timeline에 둔다.
- [gsap-scrolltrigger](https://github.com/greensock/gsap-skills/blob/main/skills/gsap-scrolltrigger/SKILL.md): pin/scrub/refresh/cleanup의 실제 규칙. pin wrapper 자체를 움직이지 않고 자식을 움직이는 것이 이 페이지의 겹침·점프 방지에 참고된다.
- [gsap-performance](https://github.com/greensock/gsap-skills/blob/main/skills/gsap-performance/SKILL.md): DOM read/write 분리, transform/opacity 사용, 프레임마다 새 tween을 만들지 않기, 필요한 요소에만 will-change 적용.

GSAP를 채택할 경우 이 공식 스킬이 가장 직접적인 보조 자료다. 다만 현재 사용자 요구는 연출과 완성도이므로, 새 스킬 설치나 라이브러리 도입이 작업 성과를 대신할 수 없다.

## 다음 구현의 판정 기준

1. 첫 화면에서 서비스의 확인된 목적과 지도가 왜 필요한지 이해된다.
2. A의 정체성이 끝까지 유지되고, 장마다 새로운 정보가 기존 대상에 연결된다.
3. 정보 UI가 오브제를 덮거나 제목과 겹치지 않으며, 사각 배경으로 숨겨 해결하지 않는다.
4. 모든 단계가 같은 공간의 연속 장면으로 작동하고, 역스크롤도 같은 상태를 복원한다.
5. 데스크톱·모바일·reduced motion·WebGL 불가 상태 모두에서 의미와 행동이 유지된다.
6. 검증하지 않은 실데이터·제품 기능·정확도·성능 효과를 문구나 지도 표현으로 암시하지 않는다.
