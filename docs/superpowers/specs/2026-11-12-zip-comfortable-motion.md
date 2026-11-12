# ZIP 처음부터 끝까지 편안하게 이어지는 동작 설계

2026-11-12. 사용자: 장면 전환이 갑자기 바뀌며 깜빡이고 눈이 피로하다. 처음부터 끝까지 제대로 설계해 달라. Apple 참고 방향과 ZIP 제품·브랜드·실제 체험은 유지하고 **전환 구조와 전체 읽기 리듬을 교체**한다. 기존 제작·배포 승인 범위의 후속 수정이다.

## 재현과 원인

현재 배포 source2b6815d/main4663938과 같은 로컬 파일에서 재현했다. 높이1000px의 첫 경계를 −1→+1px 넘으면 도시 viewport가 x0/y341.11/h658.88에서 x403.19/y109.11/h779.52로 교체된다. 두 번째 경계에서도 x403→0/y109→406으로 바뀐다. 경계±2px 여섯 샘플에서 phase가 세 번 교체됐다. 제목은 hidden/display:none으로 즉시 교체, 범례는 즉시 변경, 카메라/색은 별도 시간 보간이었다. 카메라 경로도 선형 정점에서 속도가 반전하며 읽는 정지가 없었다. 정지 화면 검증이 이 경계의 불연속을 잡지 못했다.

## 하나의 동작 원칙

도시가 같은 장소로 남아 있고, 무엇을 읽는지가 차분히 바뀐다. **한 진행값에서 카메라·색·문구를 함께 계산**한다. 읽는 구간은 정지, 장 사이의 짧은 구간에서만 이동한다. 별도 CSS 레이아웃 교체나 각자 다른 시간으로 추종하는 연출을 없앤다. 새 모션 라이브러리는 추가하지 않는다.

## 전체 여정

- 첫 화면: 로딩을 기다리는 강제 인트로 없이 제목·정지 도시·체험 행동이 읽힌다. 작은 스크롤 동안 wide frame을 유지한다.
- 장소의 조건: 명시적인 전환 구간에서 같은 장소로 가까워진 뒤 멈춘다. 제목과 세 조건을 읽는 동안 계속 확대·회전하지 않는다.
- 나의 기준: 같은 도시로 넓어진 뒤 보라색 기준을 읽는다. 가격을 점수에서 제외한다는 설명과 실제 선택 점수는 유지된다.
- 가격 비교: 작은 시점 변화로 가격을 읽은 뒤 멈춘다. 긴 비교 목록을 고정 무대에 쏟지 않는다.
- 체험 진입: 도시와 소개가 같은 stage 안에서 함께 빠진다. 소개 이후에도 큰 배경 밝기가 반복해 바뀌지 않게 짙은 외곽 바탕을 이어가고, 실제 제품 UI만 밝은 하나의 명확한 영역으로 둔다.
- 직접 조작: slider/선택/담기/비교는 즉시 이해되는 결과와150–220ms 정도의 짧은 피드백만 제공한다. 원래의 데이터·URL·동일 ID·수동 camera 우선을 유지한다.
- 비교·근거·마무리: 자연스러운 문서 스크롤로 읽힌다. 섹션마다 제목·본문을 반복해서 위로 밀어 올리는 등장 효과를 제거한다. 같은 짙은 바탕과 단계적 여백, 밝은 제품·비교 영역을 사용한다. footer CTA로 돌아가도 story state를 임의로 초기화하지 않는다.

## 통합 timeline

`story-timeline.mjs`에 phase names/mode map과 순수한 `storyTimeline(progress, previousPhase)`를 둔다. progress0..1,4개 읽기 상태 price/conditions/criteria/value. 경계1/6,1/2,5/6의 양옆0.06을 전환 창으로 쓰고 나머지는 정지 구간이다. 전환의 blend는 quintic smootherstep(0/1에서 속도·가속도0)으로 계산한다.

- 카메라·재질색·범례는 같은 from/to/blend를 사용한다. camera의 값과 색은 시간 지연 없이 해당 scroll frame을 적용한다. GPU paint는 기존 요청 렌더를 쓰며 상시 루프를 만들지 않는다. 직접 조작하는 experience의 기존 damping은 보존한다.
- camera holds: wide yaw.72/pitch.68/zoom1; conditions yaw.62/pitch.80/zoom3.2+선택 건물; criteria yaw.72/pitch.76/zoom1.05; value yaw.56/pitch.92/zoom1.05. 큰 확대·회전 폭을 줄인다. camera target의 selected 좌표와 높이는 기존 실제 예시 geometry를 사용한다.
- 문구는 전환 전반부에서 조용히 사라지고 후반부에서 나타난다. 중간의 짧은 여백에서도 **도시는 항상 보인다**. 겹쳐 읽히는 두 제목이나 배경/화면 전체의 fade-to-black을 만들지 않는다. 위치 이동 없는 opacity 중심, 추가 text transform 없음.
- logical phase는 장 표시·접근성용이다. 경계±.012 진행도의 deadband를 두어 미세한 왕복으로 장 표시가 토글되지 않게 한다. 동일 progress의 카메라·색·투명도는 방향과 이력에 관계없이 동일하다.
- inactive panel은 opacity0일 때만 hidden 가능하다. 시각적으로 나오는 panel은 display:none이 되지 않는다. aria-hidden은 안정된 logical phase를 기준으로 한다. 공통 CTA와 장 링크는 panel 바깥을 유지한다. permanent H1을 보존한다.
- reduced motion은 wide 정지 camera, 공간 이동 없이 의미 정보와 단위가 읽히는 경로다. 작은 왕복에 장이 교체되지 않는다. low-height 일반 흐름에서는 네 panel이 모두 opacity1로 읽히고 단일 정지 그림을 유지한다.

## 그림 viewport와 편안한 구성

도시 renderer의 clientWidth/clientHeight·intrinsic canvas 크기는 **장면 변경으로 바뀌지 않는다**. desktop/mobile 각각 하나의 고정 그림 viewport를 두고 모든 phase에서 유지한다. phase CSS로 left/top/width/height, clip-path 또는 transform을 갈아끼우지 않는다. 카메라만 도시의 시점을 움직인다.

네 장의 copy는 같은 상단 읽기 영역, 값은 같은 하단 읽기 영역에 놓는다. 한정된 값/짧은 본문/정해진 최대 높이를 확보한다. 조건 장만 갑자기 좌측으로 옮기지 않는다. 고정 canvas를 이용하는 새로운 구도는 root가 실제 wide/close/wide/price와320/375/390에서 확인해 정한다. 필요한 정적 바탕/클리핑은 모든 phase에 동일하다. 광범위한 global background 애니메이션은 없다.

브랜드 night/paper/ink와 가격청록·점수보라는 기존 tokens로 재사용한다. 어두운 마케팅 바탕의 텍스트와 footer logo는 밝은 버전, 실제 밝은 UI 안의 수치는 ink로 읽힌다. 새로운 테마 토큰 체계를 만들지 않는다. 모든 의미 글자13px이상, 본문16px이상, 조작44px이상, 제목두줄이하.

## 회귀/수용 기준

1. 수정 전 실패 재현을 보관한다. 각 경계의±0.5/±2px왕복, 느린 전진·역방향, 빠른0↔1seek에서 도시 viewport가 순간 이동·재크기되지 않는다.
2. 동일 progress의 camera/color/opacity가 접근 방향에 무관하게 같고, 읽기 구간에서 scroll을 해도 frame은 움직이지 않는다. 경계 jitter로 장·mode가 반복 토글되지 않는다.
3. 카메라·색의 reading-hold와 전환 끝에서 변화 속도가0에 가까워진다. renderer에서 story만 별도 추종하지 않는다. experience 수동 camera와 touch·hover는 유지된다.
4. 소개 종료·체험·비교·마무리까지 native scroll로 확인한다. 반복 등장 모션과 전체 화면 밝기 교체가 없다. 슬라이더/담기/삭제/공유/focus/빈 상태가 작동한다.
5. 정상 및 reduced, lowheight전환, WebGL/SVG, JS차단, 선택X·20peers·빈saved, 빠른방향변경을 검사한다. 기존32개 회귀와 새 연속성 테스트를 통과한다.
6. 실제 브라우저에서 before/after boundary trace와 연속 scroll 영상을 비교한다. 단위 테스트만으로 FPS나 눈 피로 개선을 보장하지 않는다. 동일 Pages 배포 후 실제 공개 전환과 파일 바이트를 확인한다.

## 제작 검토로 고정한 동기화 계약

- story는 DOM값만 갱신하고 WebGL을 다음 RAF로 미루지 않는다. 초기화된 visible story의 setPresentation은 예약된 자체 frame을 취소하고 같은 task/RAF에서 직접 그린다. experience의 기존 demand RAF/damping은 유지한다. 초기화 전/hidden/lost는 기존 안전 경로를 쓴다.
- logical phase가 renderer mode를 통해 색을 덮어쓰지 않는다. fromMode/toMode/mix가 물리 색의 유일한 근거다. SVG·WebGL·범례는 공통 RGB mixer를 쓰며, 결측 빗금의 opacity도 양 끝의 missingness를 섞어 계산한다(혼합된 회색 문자열 비교 금지).
- low-height 진입 때 wide 정지 frame을 적극 적용한다. 복귀 때 presentation cache를 비우고 현재 scroll frame을 다시 적용한다. 네 panel은 일반 흐름에서 opacity1, reduced는 안정된 logical panel1개와 wide camera를 사용한다.
- common CTA/장 링크와 permanent H1은 전환 밖에서 유지한다. reduced에서는 공간 이동·시간 추종 없이 한 상태를 읽고, 논리 phase hysteresis로 작은 왕복의 반복 교체를 막는다.
