# ZIP 3D 스킬·프롬프트 조사와 적용

2026-11-12 · 사용자의 ‘스킬과 프롬프트 사이트를 조사해서 고도화’ 요청에 따른 후속 개선. 기존 브랜드·예시 데이터·비교 계산·페이지 스크롤·수동 카메라 우선 원칙을 유지한다.

## 확인한 스킬

skills.sh leaderboard와 `npx skills find threejs`, `3d website`, `gsap scroll`로 찾은 뒤 GitHub 원문, 대상 버전, 라이선스를 확인했다. 설치 수와 stars는 선택 근거의 일부일 뿐 품질 보증으로 쓰지 않았다. 새 전역 설정을 설치한 것이 아니라 공개 원문을 검토해 이번 프로젝트의 구현 지침으로 적용했다.

| 스킬 | 확인한 범위 | 적용 |
|---|---|---|
| [threejs-materials-lighting](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/00a9045a78714be481c09622727284e8960ee69f/skills/web-engines/threejs-materials-lighting/SKILL.md) | 커뮤니티 스킬, Apache-2.0. r187 명시. 조회 당시 저장소 8,399 stars | Standard 재질, 읽히는 key/fill, 한 개의 좁은 PCF 그림자, 색 공간·톤 매핑 확인 |
| [threejs-interaction](https://github.com/CloudAI-X/threejs-skills/blob/6ada7589fe9d88d3a95054dab89cb625bbc1aaeb/skills/threejs-interaction/SKILL.md) | 커뮤니티 스킬, MIT. r186 대상, 조회 당시 저장소 4,137 stars | canvas 상대 좌표, 제한된 raycast 대상, 이름표와 건물의 같은 선택, hover 정보와 HTML 대안 |
| [threejs-geometry](https://github.com/CloudAI-X/threejs-skills/blob/6ada7589fe9d88d3a95054dab89cb625bbc1aaeb/skills/threejs-geometry/SKILL.md) | r186, vanilla Three | 공유 geometry·작은 bevel·옥상/기단의 시각 위계 |
| [threejs-lighting](https://github.com/CloudAI-X/threejs-skills/blob/664c74f8078cf18e4206342212ce27f7278084cc/skills/threejs-lighting/SKILL.md) | r186. 보조 참고 | 재질·그림자 비용 판단 |

기존 vanilla Three.js 0.187.0 구조에 맞는 부분만 사용한다. 예제의 무제한 DPR, 상시 회전 루프, 전체 화면 OrbitControls는 적용하지 않는다. 기존 DPR 상한·요청 시 렌더·touch `pan-y pinch-zoom`과 reduced motion을 유지한다.

공식 r187 확인: [WebGLShadowMap](https://github.com/mrdoob/three.js/blob/r187/src/renderers/webgl/WebGLShadowMap.js)의 PCF soft 처리, [MeshPhysicalMaterial](https://github.com/mrdoob/three.js/blob/r187/src/materials/MeshPhysicalMaterial.js)의 비용과 용도, [OrbitControls](https://github.com/mrdoob/three.js/blob/r187/examples/jsm/controls/OrbitControls.js)의 터치·wheel 동작. PCFSoftShadowMap 대신 PCFShadowMap을 사용한다. 복잡한 후처리나 새 런타임 라이브러리는 필요하지 않다.

## 직접 읽은 프롬프트 자료

| 사이트 | 실제 열람 범위 | ZIP에 가져올 원리 |
|---|---|---|
| [Tripo — MONOLITH](https://www.tripo3d.ai/3d-prompts/monolith-procedural-3d-architecture-website) | 공개된 전체 프롬프트 | geometry·재질·빛·카메라를 구체적으로 분리해 설계. 원문의 어두운 유리 스타일은 채택하지 않음 |
| [Tripo — Scroll-driven WebGL production brief](https://www.tripo3d.ai/3d-prompts/scroll-driven-webgl-website-production-brief) | 공개된 전체 brief | 이름 붙은 장면, 정지 프레임 검토, 부드러운 시점 경로와 reduced motion |
| [Art Direction Daily](https://www.artdirectiondaily.com/prompts.html) | The Chart Search와 Real-Estate Search / Listings & Market Map의 공개 원문 | 지도·카드가 같은 식별자와 강조를 사용하고 인코딩의 뜻을 설명. ZIP의 A~X 식별자와 청록/보라 의미를 유지 |
| [vividsites PLOTBLOC](https://www.vividsites.app/t/modelcity) | 공개 소개와 실제 preview. ‘Scroll to descend’ 동작 확인. 전체 prompt/source는 Pro여서 열람하지 않음 | 정리된 건축 모형, 제한된 재질, 한 선택 대상의 위계와 여백. 자산·코드·유료 프롬프트는 사용하지 않음 |

이는 실제 자료를 읽고 구성 원리를 정리한 것이다. 완성 예시의 성능·코드 품질이나 광고 문구를 ZIP의 검증 결과로 옮기지 않는다.

## 이번 개선의 독자적 제작 brief

ZIP의 동네 모형을 실제 건축 전시물처럼 읽히게 만든다. 부드럽게 깎인 기단과 건물 모서리, 절제한 옥상·입면 디테일, 정돈된 길과 식재로 규모를 설명한다. 가격 청록과 점수 보라는 그대로 두고 조명만으로 면과 재질을 구분한다. 선택한 건물은 이름·값·강조가 같은 대상을 가리킨다. 사선·내려다보기·선택 확대라는 명확한 시점 동작을 제공하되, 사용자가 조작한 시점을 스크롤이 덮지 않는다. 회전·이름표·hover·표 비교가 하나로 연결되고, 정지 화면에서도 내용을 이해할 수 있어야 한다.

## 구현·검증 계획

- 3D: 공유 bevel geometry, 기단·옥상/입면 디테일, 한 개의 그림자와 조명 재조정. 카메라의 기존 기본 구도는 유지.
- 조작: 이름표 클릭도 같은 건물 선택으로 처리. hover 정보는 보조 기능이며 선택한 장소·HTML 대안을 유지.
- 시점: `사선 / 내려다보기 / 선택 확대`의 명시적 동작. 새 시점은 수동 조작으로 취급하고 초기화로 원래 스크롤 연출 복원.
- 검증: geometry bounds·시점/픽킹 기준의 의미 있는 테스트, 실제 이름표 클릭·hover·터치·수동 시점·그림자·결측 표시·그래픽 대체, 1440/768/390px 시각 점검, 공개 Pages 확인.
