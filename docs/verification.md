# ZIP 랜딩 검증 기록

2026-11-12 · 승인 설계: `superpowers/specs/2026-11-12-zip-landing-design.md`

## 구현

독립적인 정적 소개 페이지다. ZIP SVG 로고·심볼·반전형, 가상 입체 도시, 조건 중요도·지도·선택·세 곳 비교·공유를 연결했다. 실제 ZIP 서비스, 실제 관악구 지도·거래 자료나 출시 성과를 주장하지 않는다. 원래 ZipDev 저장소는 수정하지 않았다.

## 실제 확인

- `npm test`: Node 기본 테스트 **11개 통과**. 순위·가격 제외·0 가중치·결측·동점·가격 비교 표본·URL 경계, 지형의 경사 의미, 장소 식별자 회귀.
- `npm run check`: 브라우저 모듈 3개의 문법 검사 통과.
- `node scripts/export-city.mjs`: 정지 자산 내보내기와 마커·다중 지도 자기검사 통과.
- 브라우저 통합 **16항목**: 초기화, 지도 3개 연결, 정규화, 비교·재색칠, 0 입력 안내, 담기 제한·새 장소, D 식별자, 결측, 가격 대비 모드, 초기화, Clipboard 실패 대안, 공유 상태, focus 복원, 앵커 목적지.
- 스크립트 요청을 막은 브라우저 **4항목**: 기본 금액·조건 비교 읽기, 비동작 조작 비활성, 가격 그림과 범례 일치.
- 공유 URL·접근성 **6항목**: 소수 중요도와 ARIA 일치, 결측 건물·담은 곳·주제 복원, reduced-motion에서 진행 중인 애니메이션 없음.
- 실제 키보드 ArrowRight로 중요도 50→51, 비율 34% 반영 확인.
- **320px**에서 문서 가로 overflow 없음. 비교표 안에서만 가로 스크롤 가능.
- axe 브라우저 검사: **48 passes, 0 violations, 2 incomplete**. 자동 검사가 모든 접근성을 보증하지 않으며 incomplete 항목과 그림의 의미는 수동으로 살폈다.
- Taste 소스 검사: **0 FAIL, 0 WARN**.
- Taste 실제 브라우저 검사: **1440·768·390px 모두 FAIL 없음**, 제목 두 줄 이하, 작은 글자 기준 통과, console error 없음. 실제 스크린샷을 세 크기에서 확인했다.

## 독립 코드 검토와 수정

- 지형 설명은 경사인데 색이 고도를 따르던 문제: 먼저 실패하는 회귀 테스트로 확인한 뒤 경사로 수정. 범례와 렌더러는 같은 palette 상수를 사용한다.
- 스크립트 없는 기본 비교 누락: 스크립트 차단 브라우저에서 실패를 확인한 뒤 A/B/C의 실제 예시 가격·조건·점수를 정적 HTML에 넣었다. JS 전용 조작은 준비 전까지 비활성화한다.
- 소수 URL 중요도와 정수 슬라이더 불일치: `step="any"`로 맞추고 73.5의 DOM 값과 ARIA 일치를 확인했다.
- 담은 순서에 따라 D의 표지가 A로 변하던 문제: 실패 검사 후 건물 ID를 그대로 유지하도록 수정했다.

## 시각 검토

Direction `borrowed-category`, seed `527163847`: 건축 전시의 도시 모형. 가격 청록·내 기준 보라는 기존 제품 의미를 유지한다. Signature는 모형의 첫 등장과 기준에 따른 재색칠이다. 네 도시 그림은 이번 페이지를 위해 만든 개념 시각화이며 외부 사진·영상은 사용하지 않았다.

ROUND 1: 도시 모형과 두 줄 제목이 첫인상을 만들었다. 태블릿 제목 3줄, 모바일 표의 점수 설명 줄바꿈, 작은 글자와 일부 ARIA 문제를 수정했다.

ROUND 2: 도시→기준→가격→비교→근거의 흐름이 이어졌다. 소형 Z 문자를 실제 심볼 자산으로 바꾸고, 글자 등장 과정의 낮은 불투명도를 제거해 화면 밖에서도 대비를 유지했다.

ROUND 3: 3개 화면 크기에서 제목·본문·모형·표·FAQ·마무리를 직접 확인했다. 자체 평가: design 7.7 · usability 8.0 · creativity 7.5 · content 8.0 → 7.80. 외부 심사 점수가 아니다.

남은 도구 경고와 판단:

- `size-count`: 실제 지도 UI·숫자·브랜드와 반응형 제목이 포함된 전체 측정이므로 크기를 하나로 합치지 않았다. 소개 본문과 UI의 서로 다른 역할을 유지한다.
- `no-real-pictures`: 직접 조작하는 소프트웨어 UI와 자체 도시 시각화를 사용한다. 실제 도시 사진으로 개발 중 서비스의 현재 화면을 암시하지 않는다.
- `no-footage`: 별도 실사 영상 없이 도시 모형과 그림의 짧은 모션, 직접 조작하는 재색칠로 제품을 설명한다.
- `violet` 검사 예외: 승인된 제품 색인 ‘내 기준 점수’의 보라색에만 적용한다.

## 남은 범위

실제 휴대폰의 물리적 터치·저성능 기기 성능, 실서비스 데이터·서버 연결은 이번 검증에 포함하지 않는다. 모바일은 브라우저 viewport 검증이다. 모든 금액·점수는 가상 데이터이며 실거래나 투자 판단 근거가 아니다.

## 배포

- 공개 주소: https://yebyeol.github.io/ZipLanding/
- 저장소: https://github.com/YeByeol/ZipLanding (public, 기본 브랜치 main)
- 배포 소스: `18a95dbccd966307e2493f8de3871202be973ba9`
- GitHub Actions: https://github.com/YeByeol/ZipLanding/actions/runs/43143328843 — completed / success.
- Pages API: workflow 배포, HTTPS enforced.
- 공개 브라우저 6항목 통과: `/ZipLanding/` 경로, 지도 3개 초기화, 표시 이미지 자산 모두 HTTP 200, 로컬 글꼴, 슬라이더→비교표 갱신, 지형 전환.
- 공개 390px 화면: 가로 overflow 없음. 새 페이지 스크립트 오류 없음. Open Graph PNG HTTP 200.
- 지연 로딩 이미지는 화면 밖에서 `naturalWidth=0`일 수 있으므로 전체 이미지 로드 검사는 각 자산 URL의 HTTP 200과 화면 내 그림으로 확인했다.

## v1.1 스크롤·실제 3D 고도화

사용자 후속 요청에 따라 기존 브랜드와 데이터·비교 기능을 유지하며 실제 WebGL 도시로 고도화했다. Node tests **19/19**, 문법 검사 통과. 공식 Three.js **0.187.0** 두 파일은 npm 배포본과 바이트가 같고 MIT 라이선스를 포함한다.

- 데스크톱 실제 마우스 드래그: yaw/pitch 변경, 클릭 선택 오발생 없음.
- 실제 좌표 클릭: 도시의 X 건물을 선택하면 HTML 요약도 `장소 X · 월세 94만 · 자료 없음`으로 변경됨.
- 회전 버튼 뒤 스크롤: 수동 카메라 유지. 확대 버튼과 초기 시점·배율 복원 확인.
- 스크롤: 읽기 진행 표시·현재 메뉴·장면 카메라와 등장 연결. 세로 스크롤을 가로채지 않음.
- 모바일 CDP 터치: 수직 swipe는 문서 스크롤로, 수평 swipe는 도시 회전으로 작동. CSS `pan-y pinch-zoom`으로 기본 확대를 허용함. 실제 휴대폰 물리 터치는 미측정.
- 중요도 입력: 3D 색과 기존 비교 점수가 함께 변경됨. 결측·표본 부족은 회색과 지붕 빗금으로 표시.
- context loss → SVG 대체 → restore 후 기존 선택·수동 시점·배율 유지. 그래픽 미지원·실패에서도 HTML 비교가 남음.
- 초기화 중 ResizeObserver 실패 주입: 수정 전에는 `svg → webgl`로 대체 화면을 잘못 덮는 RED를 확인. 실패 latch와 부분 자원 해제 후, update·scroll 진행·visibility 이벤트에도 SVG가 유지되고 canvas가 0개인 GREEN 확인.
- 움직임 줄이기: 자동 카메라 변화·진행 중 DOM 애니메이션 없음. 명시적 조작은 유지.
- 렌더는 요청과 짧은 보간에만 실행. 작업자 브라우저 검사에서 idle 시 추가 프레임 없음. 이는 전체 기기 성능·FPS 보증이 아니다.
- axe: **49 passes, 0 violations, 2 incomplete**. 읽기 진행을 header landmark 안으로 옮기고 글자·조작의 등장 불투명도를 유지해 대비를 보존함.
- 1440·768·390px 실제 브라우저: 제목 두 줄 이하, console error 없음, Taste **0 FAIL**. 320px 문서 가로 overflow 없음. 소스 검사 **0 FAIL / 0 WARN**.
- 기존과 같은 사진·실사 영상 부재 및 다수 역할의 글자 크기 경고는 유지된다. 새 컨셉이나 무관한 사진을 추가하지 않고 실제 조작하는 도시를 중심 미디어로 사용했다.
- 새 시각 검토: 도시 모형의 실제 깊이·빛·그림자와 컨트롤을 1440·390px에서 직접 확인. 기존 이야기와 청록/보라 의미를 유지했다.

업그레이드 공개 배포:

- 동일 주소 https://yebyeol.github.io/ZipLanding/
- 배포 코드 `651e2f91a6b0f5e35785c509d112237f709ad155`.
- Actions https://github.com/YeByeol/ZipLanding/actions/runs/43146775548 — completed / success.
- 공개 브라우저 6항목 통과: WebGL first frame, 회전, 확대, 스크롤 중 수동 시점 유지, vendor·새 모듈 4개 HTTP 200, 읽기 진행 갱신.
- 공개 390px 가로 overflow 없음, 페이지 스크립트 오류 없음. 실제 기기 GPU·배터리·물리 터치 성능은 측정하지 않았다.

## v1.2 스킬·프롬프트 조사 기반 3D 개선

검토한 커뮤니티 스킬과 공개 프롬프트, 실제 열람 범위 및 버전·라이선스는 [조사 기록](research/3d-skills-and-prompts.md)에 남겼다. 전역 스킬 설정은 설치·수정하지 않았으며 유료 예시의 코드·프롬프트·자산을 사용하지 않았다.

- 공유 bevel geometry로 건물·기단 모서리를 정리하고 옥상·출입구·입면 디테일을 추가했다. 단일 PCF 그림자와 조명을 조정하고 기존 청록/보라 색의 의미를 유지한다.
- 이름표와 건물은 같은 ID를 선택한다. hover 요약은 보조 정보이며 선택한 장소 요약·HTML 버튼·키보드 조작은 남는다. 스크롤·드래그·상태 갱신·취소 시 hover를 제거한다.
- 사선·내려다보기·선택 확대를 명시적인 카메라 동작으로 제공한다. 수동 시점은 스크롤로 덮지 않으며, 선택 확대 후 다른 건물을 골라도 카메라를 자동 이동하지 않는다. 처음 시점 버튼은 스크롤 연출로 복귀한다.
- Node **21/21**와 문법 검사, SVG 자산 내보내기 통과. 새 bevel bounds/normal과 이름 붙은 카메라 테스트는 실패 후 구현해 통과하는 RED→GREEN을 확인했다.
- 독립 코드 검토에서 critical/important 지적 없음. 검토자가 별도로 21개 테스트·문법 검사·diff 공백 검사를 통과했다.
- 새 실제 브라우저 검사: 이름표 B의 hover→좌표 클릭→장소 B 가격·점수 요약, 세 이름 붙은 시점, 수동 시점 우선, 선택 변경 시 확대 위치 유지, 초기화, 실제 마우스 드래그를 확인했다.
- 모바일 전용 새 브라우저 검사: 390·320px 가로 overflow 없음. CDP 세로 touch는 scroll 0→175, 수동 시점 false 유지. 가로 touch는 scroll 0 유지, yaw .6768→−.1974로 변경, 선택 A 유지. reduced motion에서 내려다보기 버튼은 yaw .12/pitch 1.08로 즉시 반영됐다.
- Taste 소스 **0 FAIL / 0 WARN**. 1440·768·390px 렌더 검사 **0 FAIL**, console error 없음. 기존 역할별 글자 크기·외부 사진 부재·실사 영상 부재의 3개 WARN은 이전 판단대로 유지한다. 세 크기의 실제 스크린샷을 확인했다.

새 런타임 의존성은 추가하지 않았다. 모바일은 브라우저 에뮬레이션이며 실제 휴대폰 GPU·배터리·FPS는 측정하지 않았다.

최종 통합 검사 **18/18**: WebGL 첫 프레임·native 이름표 hover/click·세 시점·선택 위치·수동 유지·선택 변경·초기화·native 드래그·지연 초기화·주제 공유·실제 키보드 슬라이더·결측·context loss/restore·overflow·reduced motion을 통과했다. 카메라는 짧은 보간의 허용 오차 안에서 검사했다. 자동화에서 프로그램으로 섹션 이동할 때만 smooth scroll의 비동기 경합을 피하도록 scroll-behavior를 auto로 설정했으며, 별도 native touch 검사는 실제 스크롤 동작을 확인했다.

최종 axe **48 passes / 0 violations / 1 incomplete**. 범례·담은 장소의 이름이 허용된 group 역할에 연결되도록 수정했다. 남은 incomplete는 회전 기호 등 비문자 콘텐츠의 대비 자동 판정이며 실제 조작·기호를 화면에서 확인했다. 자동 검사가 모든 접근성을 보증하지 않는다.

v1.2 공개 배포 확인:

- 코드 `78fcc5dec2033eb36e3adaeec8ed7eb281902435`.
- Actions https://github.com/YeByeol/ZipLanding/actions/runs/43151499806 — completed / success.
- https://yebyeol.github.io/ZipLanding/ 공개 브라우저 **6/6**: 첫 WebGL 프레임, 내려다보기, 선택 건물 확대, 스크롤 중 수동 시점, 모바일 overflow 없음, 새 시점 조작 9개 확인.
- 공개 HTML·CSS·main·scene3d·scene-model **5개 모두 HTTP 200이며 로컬 배포 소스와 바이트 일치**.

## v2.0 Apple 레퍼런스 기반 전면 재설계

사용자가 https://www.apple.com/kr/macbook-pro/proled-xdr-display/ 를 제공하며 첫 화면부터 기존 구성을 모두 바꾸라고 명확히 했다. 실제 데스크톱·모바일을 열어 전폭 제품 무대, 큰 문구와 대상의 크기 변화, 세부 정보와 시점 연결을 확인했다. Apple의 이미지·코드·문구는 사용하지 않았다. 직전 좌우 설명형 초안은 배포하지 않고 feature branch의 중간 commit으로 보관했다.

구현 결과:

- 첫 화면은 짙은 청록의 전폭 무대와 ‘당신의 기준으로. 도시를 새롭게.’, 큰 입체 도시로 교체했다. 전체 구성과 문구·체험·비교·근거·큰 ZIP 마무리를 새로 만들었다.
- 자연스러운 약400svh 구간에서 한 도시가 전체→선택 장소 확대→전체 재색칠→가격 비교의 시점으로 이어진다. 문구·범례·숫자·건물색이 같은 phase를 가리킨다. 스크롤을 잠그거나 휠을 가로채지 않는다.
- 소개 전용 camera API는 직접 조작하는 체험 camera를 덮지 않는다. 일반 조작의 zoom 상한1.6은 유지하며 소개만4.8까지 허용한다. 모든 동작은 기존 요청 시 렌더와 짧은 보간을 사용한다.
- 실제 WebGL 확대 keyframe: zoom4.19868, yaw.5000, pitch.8600, targetX−2.9738/Z−1.9142에서 장소 A가 크게 보였다. 초기 wide는 zoom1/yaw.72/pitch.68이다. 위로 돌아가도 같은 장과 시점으로 복원된다.
- 체험은 넓은 도시 아래 세 슬라이더로 교체했다. 선택·가중치·가격·비교·공유는 같은 state를 유지한다. 저장 수0/1/2/3에 비교 제목이 맞춰지고, 마지막 제거 뒤 빈 상태의 보이는 복귀 링크에 focus가 남는다.
- 모든 phase는 같은 canvas를 유지한다. 소개 스크롤은 제품 mode/weights/selected/saved/URL을 바꾸지 않는다. 직접 slider 입력은 score로 전환하되 selected ID를 유지한다.

검증:

- Node **32/32**, syntax 검사·SVG 내보내기·diff 공백 검사 통과. 새 camera 보간·NaN/bounds·interactive guard·처음 progress0·역방향·reduced wide·저높이·현재 선택 retarget·20개 peer 제한은 RED→GREEN을 확인했다.
- 실제 브라우저 통합 **21/21**: 첫 구성·기본score·전진/역방향7장면·state/URL불변·canvas동일·키보드slider·공유계산·결측단위·동일ID·빈상태focus·share대안·reset·reduced정보/정지camera·overflow를 확인했다.
- 실제 phase link 클릭으로 조건→내 기준→가격 비교의 연속 camera/색 전환을 녹화했다. 이는 QA 기록이며 외부 영상 자산이 아니다.
- 1440·768·390 실제 렌더 검사 **FAIL0**, 일반 페이지 console error 없음. 제목 두 줄 이하·문서 가로 overflow 없음. 소스 lint **FAIL0/WARN0**. 글자 크기 수·외부 사진/별도 영상 부재 경고는 제품 자체 3D/실제 UI를 중심 미디어로 쓰는 이유로 유지한다.
- 투명 canvas 사각 영역과 큰 수치가 겹친다고 감지하는 pinned-over-picture 경고는 실제 pixel에서 확인했다. 읽는 문구가 밝은 도시와 겹친 곳은 camera 그림 영역을 조정했다. 첫 제목/설명, 확대 조건, 기준/가격 설명에 검은 공간을 확보했다. phase 링크에는 같은 짙은 무대를 깔아 모형 바닥색과 무관하게 읽힌다.
- 독립 검토의 중요2건(621–700px 높이의 읽기/중복 HUD 겹침, 일반 흐름 fallback에서 작동하지 않는 장 링크)을 수정하고 재검토를 통과했다. 낮은 화면은 네 장을 모두 노출하므로 불필요한 장 링크를 숨긴다.
- 최종 모바일 조건 문구와 도시의 실제 경계:390×844 문구bottom252.63/citytop283.39,375×667 240.67/248.72,320×640 226.58/242.23. 세 크기 모두 overflow0이다.
- 장소X의 세 결측값은 320px의 세 equal column에 들어가며 ‘자료 없음’의 가짜 단위가 없다. 연식 중요도0의 비교대상20개도 무대에는 개수만 표시하고, preview는3개+나머지 수로 제한한다. 전체 비교 설명은 문서 흐름의 details에서 읽힌다.
- 실제 CDP touch: 세로 swipe는 scroll3685→3943, camera/manual/선택 유지. 가로 swipe는 문서scroll유지, yaw.72→−.2097/manual=true, 선택A 유지.
- JS 차단: 네 장, SVG, 정적 A/B/C 요약과 보라 범례가 남고 조작은 비활성. vendor 차단: SVG와 HTML 장소 선택·요약이 작동한다. 844×390 저높이에서는 일반 흐름으로 네 장이 읽힌다.
- 최종 axe **45 passes / 0 violations / 1 incomplete**. 영구 페이지 H1, 비교 텍스트/제거버튼과 선택 배경의 대비, save 버튼 hover를 보완했다. 남은 incomplete는 비문자 화살표의 자동 대비 판정이다. 실제 조작과 색을 확인했으며 자동 검사만으로 전체 접근성을 보증하지 않는다.
- Impeccable detector의 실제 hover 대비 문제는 어두운 버튼 패턴으로 수정했다. 점수용 보라 의미는 확정 브랜드로 유지하며, 표/section의 padding 경고는 실제 부모 gutter·셀 padding과 화면으로 판단했다. 새 초기화·두 번째 테마를 추가하지 않았다.

브라우저 viewport·CDP 검증이며 실제 휴대폰 GPU·배터리·FPS는 측정하지 않았다. 모든 장소·금액·점수는 가상 예시이고 실제 서비스·실거래 지도 배포가 아니다.

v2.0 공개 배포 확인:

- 배포 소스 `2b6815db9797213f4d2bd993a6d5f22346f61e2c`.
- Actions https://github.com/YeByeol/ZipLanding/actions/runs/43164237428 — completed / success.
- https://yebyeol.github.io/ZipLanding/ 공개 브라우저 **6/6**: 새 전폭 hero, 실제 장 링크의 확대 전환, 넓은 점수 전환, 위에서 보는 가격 전환, 실제 키보드 중요도 조작,390px overflow 없음.
- 공개 HTML·CSS·main·motion·story·scene3d·scene-model **7개 HTTP200/로컬 검증 소스와 바이트 일치**.

## v2.1 장면 경계와 전체 읽기 리듬 수정

사용자가 지적한 깜빡임을 실제 경계 왕복으로 재현했다. v2.0에서는 스크롤 −1→+1px에서 도시 영역이 x0→403.19px, y341.11→109.11px, 높이658.88→779.52px로 순간 교체됐다. 경계 주변 여섯 샘플에서 장 표시가 세 번 바뀌었다. 당시 정지 화면 검증으로 이 불연속을 발견하지 못했다. 새 설계는 `superpowers/specs/2026-11-12-zip-comfortable-motion.md`에 기록했다.

수정:

- 모든 장에 같은 도시 viewport와 제목·수치 영역을 사용한다. 장마다 CSS 위치·크기를 바꾸지 않고 카메라만 이동한다.
- 하나의 순수 timeline에서 카메라·RGB 색·범례·문구 opacity를 계산한다. 장 사이에서만 quintic 전환하고, 각 장은 읽는 동안 정지한다. 소개 확대는3.2배로 낮췄다.
- 장 표시의 경계에 hysteresis를 두고, 물리적인 화면은 이력에 관계없이 같은 진행값에서 같은 상태를 그린다. 제목은 같은 위치에서 순서대로 사라지고 나타나며 도시·배경은 fade하지 않는다.
- 소개의 DOM/3D는 같은 task에서 그린다. 직접 조작하는 체험의 damping·수동 camera 우선은 유지한다. SVG·WebGL·범례는 같은 색 계산과 결측 빗금 보간을 사용한다.
- 소개부터 체험·비교·근거·마무리까지 짙은 외곽 바탕을 유지하고 실제 제품 UI는 밝은 영역에 둔다. 반복 section 등장 효과를 제거했다. 새 의존성은 없다.

최종 로컬 검증:

- Node **39/39**, 전체 모듈 문법 검사, SVG 내보내기, diff 검사 통과. 독립 read-only 검토에서 차단 결함 없음.
- 실제 브라우저 연속성 **10/10**. 세 경계±0.5/±2px 왕복·32지점 전진/역방향·빠른0↔1 seek에서 viewport와 canvas buffer 크기 불변, 경계 장/mode 반복 토글 없음, 같은 진행값의 camera/color/opacity 일치, reading hold 정지·동일 canvas 유지.
- 실제 WebGL draw 계측: 시각 상태가 바뀐 **21개 RAF callback 모두 같은 callback 안에서 GPU draw**가 발생했다. 정지 후300ms 동안 추가 story draw0. FPS 측정은 아니다.
- 실제 기능 **21/21**: 중요도 키보드, 선택·동일ID·계산 공유, 결측·단위, 담기/비교 빈 상태·focus, 공유 실패 대안·복귀, 초기화, reduced 정보/정지 camera, scroll의 제품 state/URL 불변.
- 최종 native 장 링크6회 전환·역방향과 하단5곳·마무리 CTA 복귀를 녹화했다. 작은 경계 왕복·동일 진행값의 전후 상태는 별도 trace로 확인했으며 영상의 정지 캡처만으로 연속성을 판단하지 않았다.
- 1440×900·768×1024·390×844·375×667·320×640의4개 hold, 총20개 실제 캡처에서 copy→그림→수치→범례/조작 영역 분리와 장별 동일 rect를 확인했다. 선택X3개·전체 여정14개 화면도 확인했다. 첫 검토에서 발견한 desktop 그림/수치,390px 설명/수치,320px 연도 단위 겹침을 한 묶음으로 수정했다.
- 실제 CDP touch: 세로 swipe scroll3685→3936, yaw.72·선택A·자동 시점 유지. 가로 swipe scroll3685유지, yaw.72→−.2097/manual=true, 선택A 유지.
- axe desktop/mobile 각각 **45 passes / 0 violations / 1 incomplete**. 자동 판정하지 못한 SVG 한 글자 마커·화살표·그림 근처 상태 문구는 실제 표면과 색으로 확인했다. 자동 검사만으로 전체 접근성을 보증하지 않는다.
- Taste 소스 **0 FAIL/0 WARN**, 실제1440·768·390 검사 **0 FAIL/3 WARN**. `still-page` 규칙만 사용자 요청의 읽기 정지·반복 등장 제거를 지키기 위해 명시적으로 허용했다. 글자 크기 수는 실제 수치/UI 역할을 유지하고, 실사 사진·별도 영상은 가상 도시 자체3D를 중심 미디어로 쓰므로 추가하지 않았다. covered-text·pinned-over-picture 문제는 실제 배치를 수정해 해소했다.

검증은 브라우저 viewport·실제 WebGL draw·CDP 입력 범위다. 실물 휴대폰의 GPU·배터리·FPS나 의학적인 눈 피로 개선은 측정하지 않았다. 가상 예시와 서비스 개발 상태는 그대로 명시한다.

## v2.2 본문 전체를 여덟 장의 스크롤 필름으로

v2.1은 경계 안정화의 내부 checkpoint였으며 공개하지 않았다. 상단4장 뒤에 직접 조작/정적 설명이 이어지던 구성을 없앴다. 최종 설계는 `superpowers/specs/2026-11-12-zip-entire-scroll-film.md`다.

본문 전체는 같은 도시를 따라 **발견→가격표→조건→중요도 자동 시연→세 장소 비교→가격 환산→자료의 한계→마무리**로 이어진다. 가격 연결선과 숫자 조립, 조건 층, 중요도 막대/계산 점수/도시 색, 카드 정렬/행 강조, 공식 항 조립, X의 결측 빗금/출처 연결선, Z의 선그리기가 각 장의 스크롤 진행값을 따른다. 일반적인 섹션 등장 효과만 더한 구성이 아니다. 직접 조작하지 않아도 이야기가 완결된다.

기존 중요도·선택·담기·비교·공유는 별도 native dialog에서 선택적으로 연다. 닫기/ESC는 보던 film 위치와 opener focus를 복원한다. 내부 앵커는 dialog만 스크롤하고 공유 링크의#experience/#comparison은 해당 체험을 연다. 시연은 방문자의 체험 state/query와 독립적이다.

최종 수치와 동작:

- 시연 중요도 균등→80/10/10에서 A/B/C는 반올림37/45/52→80/74/65점. 금액은 바뀌지 않는다. 막대·숫자·색이 같은 실제 계산 snapshot을 사용한다.
- 자동 점수의5단계 색 경계는 story 전용 연속 RGB ramp로 보간한다. 실제 체험의 기존5구간 의미는 유지한다. 아주 작은 왕복에서 색이 단계별로 튀는 재현도 RED→GREEN으로 고쳤다.
- A의 월 환산 단가1.70만/㎡, 연5%가정·관리비 제외. 시연 기준 ±5점의 실제 비교 대상은K/V2곳(3.41/2.54만/㎡)이다.5개 미만이므로 퍼센트 평가를 하지 않는다. X의 세 조건과 점수는 모두 자료 없음이다.
- 8장 모두 같은 canvas client/buffer 크기와 정확한 같은-task 렌더를 유지한다. 전환 구간과 각 장 안의 그래픽 동작 뒤에는 읽는 정지가 있다. noJS/낮은 높이는8개 일반 흐름·정적 그림·완성된 정보, reduced는 정지 camera·완성 그래픽과 before/after 문장으로 읽는다.

최종 확인:

- Node **42/42**, 전체 모듈 syntax, SVG 내보내기, diff 검사 통과. 독립 검토의 색 단계 불연속·균등 기준의 읽기 시점·fallback 앵커·초기 메뉴 current-location 문제를 수정했다. 제품 계산/URL/식별자/결측/수동 camera 회귀를 보존했다.
- 실제 전체 궤적 **14/14**:8개 장의 실제 CSS 그래픽 변화, camera 정지 구간,7경계 jitter, 전진/역방향 같은 physical frame, 빠른 seek, 모든 숫자/막대와 snapshot 일치, canvas 크기/ID 유지, 방문자 state/query 불변을 확인했다.
- 실제 선택 체험 **15/15**: dialog open/focus, keyboard slider, X 선택, narrative 독립, 빈 비교/focus, 내부 anchor, 공유 실패 대안/focus, close/ESC의 동일 film frame 복원, 재열기 state 보존, 공유 URL 복원과 native focus containment를 확인했다.
- 별도의 실제 fallback/camera **53개 확인**: noJS1000/620의8장과 실제 fragment/메뉴 이동,1000↔620 복귀, reduced, fresh vendor 차단 SVG 색/막대, score threshold 연속성, 결측 빗금, 실제 WEBGL_lose_context의 최신 frame, 선택 체험 camera8개/수동 우선/실제 hover. 최종 browser errors0.
- 실제 WebGL draw 계측: 시각 frame이 바뀐 **38개 RAF callback 모두 같은 callback 안에서 GPU draw**, 정지 후300ms story draw0. 이 계측은 FPS 벤치마크가 아니다.
- native smooth scroll로 전체8장을32개 동작 지점과 역방향3개 링크로 녹화했다(약20초 QA 영상). 중요도37/45/52→중간58/59/59→80/74/65, 후반 공식/근거/Z 동작까지 확인했다. 페이지는 영상 파일을 재생하는 방식이 아니라 실제3D/DOM을 스크롤로 조합한다.
- 1440×900·768×1024·390×844·375×667·320×640에서8장, 총40개 hold와 중간 동작10개, dialog10개 화면을 직접 확인했다. 장별 도시 rect 동일, 제목/그래픽/범례/조작/가상예시 고지 분리, 문서·dialog 가로 overflow0, close 표시를 확인했다. 이후 불필요한 정적 구분선만 정리했다.
- 실제 CDP touch: 본문 swipe는 window scroll100→353. dialog의 세로 swipe는 내부 scroll260→507, 가로 swipe는 내부 scroll260 고정/yaw.72→−.2097이며 선택A 유지. 두 경우 window353 고정, 닫은 뒤에도353으로 복귀했다.
- axe: 초기 film **39 passes/0 violations/0 incomplete**, criteria/mobile film **39/0/1**, dialog desktop/mobile **27/0/1**. 남은 incomplete는 겹친 그래픽·canvas·native dialog에서 자동으로 배경을 정하지 못하는 대비 판정이다. 실제 완성 상태의 불투명 paper/ink와 night/white 표면 및 화면을 확인했다. 자동 검사만으로 모든 접근성을 보증하지 않는다.
- Taste 소스 **0 FAIL/0 WARN**, 실제1440/768/390 **0 FAIL/3 WARN**. `few-pictures`만 자체3D/데이터 그래픽을 중심 미디어로 쓰는 명시적 예외다. 별도 영상 부재는 실제 조작 가능한3D로, pinned-over-picture는 canvas 위의 불투명 데이터 표면으로, still-page13개 측정은 실제8장 전체 궤적/중간 동작 확인과 읽기 정지 설계로 판단했다. 장식용 사진/상시 루프를 추가하지 않았다.

실물 휴대폰 GPU·배터리·FPS나 의학적인 눈 피로 개선은 측정하지 않았다. 가상 데이터·개발 중 서비스라는 고지를 유지한다.

v2.2 공개 배포 확인:

- 배포 소스 `313fda72c29fc0076aa8b3c61d3ba455626401f0`.
- Actions https://github.com/YeByeol/ZipLanding/actions/runs/43174162750 — completed / success.
- https://yebyeol.github.io/ZipLanding/ 실제 전체 궤적 **14/14**, 선택 체험 **15/15** 통과.8장 모두의 그래픽 변화·정지 camera·경계 왕복·역방향·자동 점수/가격·별도창 state/focus/scroll복귀를 공개 페이지에서 다시 확인했다.
- 공개 HTML/CSS/전체 앱 모듈/Three2개/로고·그림·글꼴·공유 이미지 **21개 모두 HTTP200이며 로컬 배포 소스와 바이트 일치**.
- 공개390px에서 기준→근거→마무리 native 링크와 최종 graphics를 확인했다. overflow0, main 안의 강제 입력0, Pretendard 로드, browser errors0.

## v2.3 도시와 데이터의 연결·모바일 읽기 개선

기존8장 이야기·브랜드·camera poses·계산은 유지하고, 실제 화면에서 확인한 도시/수치의 단절·좁은 비교 카드·가려진 마지막 메뉴·마무리 행동을 개선했다. 설계는 `superpowers/specs/2026-11-12-zip-connected-film-refinement.md`다.

- 실제 marker 월드 좌표의 WebGL 투영과 SVG getScreenCTM으로 A/B/C/K/V/X를 데이터에 연결한다. 초기 GPU 준비·resize·context loss·scroll beat의 DOM 이동도 같은 draw/task에서 갱신한다. 읽기 전용 API와 구독 해제를 사용하며 상시 RAF loop는 없다.
- 건물 중심이 불투명 데이터 표면에 가려지거나 frustum 밖이면 연결선을 숨긴다. 화면 가장자리에 가짜 좌표를 붙이지 않는다. 비교 대상·결측 자료의 의미도 유지한다.
- A/K/V 월 환산 단가를 같은0 기준축으로 그린다. 표시1.70/3.41/2.54만/㎡, 원래 계산값 기준 bar 비율0.5/1/0.74709219858156이다. noJS에도 같은 정적 비율과 단위를 제공한다.
- 모바일의 공통 행 제목·A/B/C 열로7개 비교 사실을 유지한다. 44px native 장면 선택기와 현재 위치를 제공해 마지막 메뉴의 잘림을 없앴다. 처음 스크롤 안내와48px 마무리 직접 체험 버튼을 추가했다.
- 마무리 버튼은 장이 aria-hidden일 때 inert여서 부분 등장 중 Tab이 들어가지 않는다. 직접 체험의 close/ESC는 마지막 장의 위치와 버튼 focus를 복원한다.

검증:

- Node **49/49**, syntax·SVG 내보내기·diff 검사 통과. 새 투영/CTM/clip/lifecycle, 실제 가격축, 선 경로/가림, inactive CTA 검증을 추가했다. 독립 검토의 opaque-wrapper 가림 표식도 수정하고 미해결 사항 없음으로 확인했다.
- 실제 투영 API **17개**: WebGL 실제 marker 좌표, readonly/no draw, same-task callback, 초기화, resize, 화면 밖/숨은 표지, 실제 context loss, SVG CTM/DPR2, unsubscribe/destroy.
- 새 기능 실제 **20개**:6개 관련 장의 유효한 marker→데이터 선과 가림 배제, 같은 가격축/실제 길이, 움직이는 카드의 선 역방향 일치, 모바일 native 표와 모든 값,44px 선택기·마지막 장·현재 위치, 마무리 CTA/ESC/focus/scroll, inactive CTA, reduced의 정적 가격 비율.
- 기존 실제 전체 궤적 **14/14**, 선택 체험 **15/15** 회귀 통과.8개 장의 graphics·고정 canvas·경계 왕복·같은 진행값·방문자 state/query 독립과 공유/결측/빈 비교를 유지한다.
- root component fallback 실제 **10개**: fresh vendor 차단에서 선과 SVG CTM→stage 좌표 일치, 스크롤 없는 resize 갱신, 실제 context loss 뒤 같은 선 DOM의 SVG 좌표 갱신, reduced/lowheight 선 숨김, JS 차단의8개 일반 흐름·모바일 표·실제 가격 비율·비활성/숨은 선택기.
- 5개 화면 크기×8장, 총40개 hold를 한 묶음 검토/수정 후 확인했다. 모든 장의 도시 rect 동일, 정보/조작 겹침·가로 overflow 없음. CTA48px 표시5/5, 모바일 선택기44px3/3이다. 실제 전체32지점과 역방향3개 장을 새 영상으로 확인했다.
- 실제 연결선 수(가격/조건/기준/비교/환산/근거):1440px은1/1/3/3/3/1,768·390px은1/1/3/3/1/1,375·320px은1/1/3/3/0/1. 작은 두 화면의 환산 장에서는 실제 건물이 공식/차트에 가려져 선을 숨기며 값·축·단위는 유지한다.
- axe320px 비교 표 **47 passes/0 violations/1 incomplete**, 마무리 **42/0/1**. 남은 incomplete는 중첩 그래픽의 자동 배경 대비 판정이며 실제 읽기 표면을 확인했다. Impeccable 결과는 확정된 점수 보라색4개와 실제 내부 padding이 있는 wrapper2개에 대한 warning만 남았다.

검증은 실제 브라우저·WebGL/SVG·viewport 범위이며 실물 휴대폰 FPS·배터리나 의학적인 눈 피로 개선을 측정하지 않았다. 새 라이브러리·테마·실거래 데이터는 추가하지 않았다.

v2.3 공개 배포 확인:

- 소스 `2965f127022d5e2e7e3df4aaaf958091ff7f2448`, Actions https://github.com/YeByeol/ZipLanding/actions/runs/43179365177 — completed / success.
- https://yebyeol.github.io/ZipLanding/ 공개 새 기능 **20/20**, 전체8장 궤적 **14/14** 통과. 실제 연결선/가격 비율, 모바일 표·선택기, 마지막 버튼과 focus/scroll 복귀를 다시 확인했다.
- HTML·CSS·앱 모듈·Three·브랜드/그림/글꼴 자산 **22개 HTTP200/로컬 검증 소스와 바이트 일치**.

## v2.4 위쪽 absolute 구도와 실제 하단 잘림 수정

사용자가 동작 중 하단이 잘리는 느낌을 지적하고 absolute 레이어를 화면 위쪽에 배치하는 방향을 제안했다. 실제5개 viewport에서 HTML 하단 넘침은0이었지만 도시 픽셀은 canvas 경계에서 잘렸다.1366×768에서는 y593의 도시 픽셀580개가 y594에서0이 됐다. 실제 production geometry30,328개 정점의 조건 장 하단 초과량은1366에서514px,1440에서612px였다. 위치 이동만으로는 이 frustum 잘림을 해결할 수 없었다.

수정 설계는 `superpowers/specs/2026-11-12-zip-raised-safe-framing.md`다.

- 제목·도시·데이터의 absolute 구도를 위로 조정했다.5개 화면에서 도시 draw 영역 중심이34.6–47.6px 올라가고 높이는62.4–76.2px 커졌다. 제목 최대64px, 짧은 desktop에서는56px이다. 하단 메뉴·범례·고지·CTA에는 별도 safe-area 여백을 유지한다.
- Story 전용 `frame.fit`에서 실제 world bounds·billboard 반경·선택 lift를 보수적으로 포함하고, 현재 view-space의 전체 bounds를20CSSpx 여백 안에 맞춘다. off-axis projection과 실제 zoom을 같은 draw에서 적용한다. 일반 camera API와 직접 체험/manual 동작은 유지한다.
- 기존 큰 macro 확대는 완전한 모형의 점유율·시점·표지 변화로 조정했다. `viewZoom`은 실제 적용값이다. fit 생략 시 기존 centered frustum을 복원하고, 반복 draw/resize에 fitted projection이 누적되지 않는다.
- 조건 장의 세 수치는 panel이 등장할 때부터 읽힌다. beat는 강조선에 사용해 빈 반투명 카드가 먼저 덮이던 상태를 없앴다. 마무리의 넓은 night mask도 제거하고 Z→ZIP seal을 제목 아래로 옮겨320px에서 도시 전체가 드러난다.

검증:

- Node **53/53**, 전체 syntax·SVG 내보내기·diff 검사 통과. 실제 production builder를 사용하는53개 테스트 안의 **620개** hold/전환/aspect containment 사례에서 여백·near/far·billboard/lift를 확인했다.
- 실제 GPU/readPixels **36개**:8개 hold×4개 실제 canvas 크기와 fit 해제/복귀·resize/idempotence·experience 수동 zoom을 확인했다. DPR2 환경의 capped buffer1.5를 CSSpx로 변환해 여백을 검사했다. 조건 장의 실제 하단 여백은1440에서33.36px,1366에서30.67px,390에서53.33px,320에서30.67px이다.
- 실제 **이동 중 GPU42개**:1366×768·390×844의7개 경계마다 앞/중간/뒤3개 active blend를 그렸다. 각 지점에서1회 same-task paint, 현재 snapshot과 맞는 actual projection, nonzero pixels와 bounds containment를 확인했다. 최소 실제 픽셀 여백30CSSpx, 최소 보수적 투영 여백20.34CSSpx이다.
- 5개 화면×8개 hold40개와 중간/높이 변경19개, 총59개 layout 기록에 가로 넘침·읽기/조작 영역 겹침 없음. 모든 장의 도시 rect 동일, 마무리 CTA48px·모바일 선택기44px 유지.1366 중간 전환,1440높이1000→768,390높이844→740을 실제로 살폈다.
- 조건p=.24의 beat가0일 때도 세 수치의 own opacity1/transform none을 확인했다. closing correction 뒤320px에서 전체 도시가 seal과CTA 사이에 들어오는 화면을 확인했다. dense compact 가격 장의 데이터 표면에 의한 가림은 남지만 renderer의 절단이나 가짜 mask와 구분한다.
- 실제 전체 궤적 **14/14**, 선택 체험 **15/15**, 연결선·가격축·모바일 탐색·마무리 focus·reduced의 기존 새 기능 **20/20** 회귀 통과. 조건 강조선의 pseudo-element도 실제 motion 수집에 포함했다.
- 독립 검토에서 source·실제 이동 GPU 증거·최종320 closing/1366중간/1440장면을 확인하고 미해결 사항 없음으로 마쳤다. UI detector는 기존 의미 보라색과 내부 padding wrapper 경고만 남았다.

실제 물리 기기의 브라우저 UI·nonzero safe-area·FPS/배터리는 검증하지 않았다. synthetic viewport 변경을 실제 Safari/Chrome 주소 표시줄 검증으로 주장하지 않는다.

v2.4 공개 배포 확인:

- 소스 `0db41154c359341e160f6b1f618db3e6e5bd3aa3`, Actions https://github.com/YeByeol/ZipLanding/actions/runs/43185482557 — completed / success.
- https://yebyeol.github.io/ZipLanding/ 공개 전체 궤적 **14/14**, 연결선·가격축·탐색·마무리 기능 **20/20** 통과.1366×768 조건 중간p=.24의 세 수치 opacity1과320×640 마무리의 전체 도시도 실제 화면으로 다시 확인했다. browser errors0, overflow0.
- 새 framing module을 포함한 HTML·CSS·앱·Three·브랜드/그림/글꼴 **23개 HTTP200/로컬 배포 소스와 바이트 일치**.

## v3.0 큰 도시와 editorial HUD, 공통 부드러운 진행

사용자는 오브제를 작게 만드는 것이 아니라 큰 이동을 유지하면서 설명 텍스트·HUD·인터페이스를 전문가가 설계한 수준으로 재구성하도록 정정했다. 이어 모든 이동·전환·효과가 부드럽게 이어져야 한다고 명시했다. 따라서 v2.4의 전체 모형 fit을 현재 소개의 연출 기준에서 제외했다. 위 v2.4 검증은 그 소스에 대한 과거 기록이다.

설계: `superpowers/specs/2026-11-12-zip-editorial-hud.md`.

- 공식 Apple PROLED XDR·Vision Pro, Linear, Nothing 제품 화면을 실제 브라우저로 조사했다. 큰 제품 오브제와 절제된 설명 위계, 명확한 숫자·단위·식별 관계를 참고했고 자산은 복제하지 않았다. Taste v2 One motif(seed1250306957), 기존 palette/type 유지. ZIP의 Z와 같은 도시의 다른 단면을 읽는 행위를 구도의 근거로 삼았다.
- 누적 film CSS를 `styles/film.css`로 교체했다. 왼쪽 읽기 영역·큰 핵심 가격·조건 측정값·중요도 막대·독립 점수 표시·완전한 semantic 비교표·같은0축 단가 그래프·결측/계획 표시·마무리 행동을8개 다른 구성으로 설계했다. 작은 화면에서는 중요도를3열로 재구성하고 범례와 native 선택기를 같은 탐색 영역에 둔다.
- 실제 canvas는 장면 전체를 채우며 위치·buffer를 장마다 변경하지 않는다. authored zoom은 desktop1.22→3.4, phone1.403→3.91로 복원했다. 대상 건물 높이 변화는 약2.81배다. off-axis projection은 확대를 취소하지 않고 관심 위치를 desktop오른쪽/mobile중앙으로 배치한다. 의도적인 화면 가장자리 crop과 과거 작은 canvas 내부의 갑작스런 절단을 구분한다.
-90ms 공통 clock이 카메라·DOM 문구/opacity·점수·막대·색·연결선을 같은 snapshot으로 갱신한다. 전환 half-window는.045이며 quintic 보간을 유지한다. 정지 시 정확한 target으로 수렴하고 idle RAF는0이다. 초기·명시적 장면 선택·움직임 줄이기·낮은 화면·hidden 전환은 즉시 적용한다.
- 공통 clock이 마지막 native scroll 이후 장 경계를 넘을 때 헤더 메뉴가 이전 장에 머무르는 실제 오류를 재현했다. logical phase 변경 뒤 기존 motion scheduler를 한 번 호출해 메뉴를 동기화했다. navigation 규칙이나 별도 animation loop를 만들지 않았다.
- 표지의 실제 CSS 반경을 readonly projection API로 제공한다. 선은 실제 원 바깥에서 시작하고, 가려진/화면 밖/읽기 차폐 영역의 출발점은 숨긴다. 추가 ring을 없애 표지 글자 위의 중복 원과 공중에 뜬 표시를 제거했다. 비교표·그래프의 실제 식별 열과 일반 placard의 가까운 가장자리에 각각 연결한다.
- `styles/demo-polish.css`는 실제 체험창 내부에만 적용한다. Desktop은 도시와 중요도/선택 조작을 함께 보고, mobile은 같은 내용을 한 열로 읽는다. 외부 dialog는 overflow:clip, 내부 body만 scroll해 닫기 헤더가 밀려나지 않게 한다. 수동 camera·선택·저장·빈 상태·공유 URL은 기존 동작을 유지한다.

검증 결과:

- Node **63/63**, 전체 syntax·SVG export·diff 검사 통과. 실제 production geometry/전환 경계의 카메라 연속성, 공통 clock 수렴/역전/정리, phase callback과 batched refresh를 포함한다.
- 실제 cinematic engine **21/21**:8개 desktop/phone pose, 동기 draw, 역방향·빠른 seek, fit 생략, 수동 경험 유지. 실제 radius **3/3**: DPR2 CSSpx projection/readonly paint/SVG circle bbox 일치.
- 실제 공통 clock **6/6**:91개 frame(55개 이동 frame)의 DOM alpha·score·bar·legend와 GPU camera가 같은 filmProgress에 일치, 정확한 정지·idle RAF0·native 선택기 즉시 적용·reduced bypass. 헤더 동기화는 cold browser에서 단 한 번의 scroll 이후 추가 입력 없이 criteria/aria-current 일치로 별도 재확인했다.
- 실제 전체 궤적 **14/14**:8개 hold의 그래픽 변화,7개 경계의 작은 역방향 반복, 같은 최종 진행값의 물리 상태 동일성, 고정 canvas/buffer, 실제 계산 필드, 시연/방문자 상태 분리. 필터가 정확히 정지한 뒤 읽고, 이전 QA의.035 상수를 현재 TRANSITION_WINDOW로 대체했다.
- 실제 선택 체험 **15/15**: 키보드 중요도, X 누락, empty recovery, native 내부 이동, 공유 fallback, dialog focus trap/복귀, 정확한 영화 위치 복귀와 deep link 유지.
-1440×1000·1366×768·768×1024·390×844·320×640의8개 hold **40개**를 실제 화면으로 확인했다. 읽기 텍스트/조작부의 stage 밖 잘림과 document 가로 overflow는0이다. 짧은 desktop 비교표와 copy 간격을 추가 확보했다. 별도 체험창1440·390·320에서는 모든 측정 조작부44px 이상, 외부 dialog scrollTop0을 확인했다.
- 실제 fallback **10/10**: SVG 연결 좌표/차폐 판정, scroll 없는 resize, lowheight/reduced 링크 숨김, 실제 WebGL context loss 후 같은 DOM의 갱신, script 차단 시8개 일반 흐름과 전체 비교 사실/단가 비율/비활성 선택기 유지. 설명 영역에 가려진 SVG A의 선이 없음을 정상 기대값으로 판정하고, K/V/X의 보이는 실제 투영은 별도 확인했다.
- 독립 시각 검토가 발견한 phone 공중 ring·desktop 점 단위 이탈·closing 문구 대비를 수정했다. 새 cold browser의320 criteria/closing·1366 criteria에서 남은 중대 시각 문제 없음으로 마쳤다. 독립 통합 검토에서도 자산 복사/참조·ID/ARIA 연결·상태 분리·대체 표시의 새 blocker가 없었다.
- Taste source lint **0 FAIL /0 WARN**. 실제 inspector **0 FAIL**, no-footage 경고1개: 사용자가 요청한 실제3D motion이 주 시각 자산이므로 별도 stock film을 넣지 않았다. few-pictures는 같은 사용자 의도에 따른 예외이며, pinned-over-picture는 전체 canvas rect와 읽기 레이어의 교차를 검출하는 한계로 예외 처리했다. 실제 차폐·대비·겹침은40개 장면 화면과 독립 검토로 확인했다. 이 예외를 inspector의 무조건 통과로 숨기지 않는다.

내부 시각 재검토는 구도·타이포·정보 위계·역방향 동작을 중심으로 진행했다. 외부 수상/공인 디자인 평점이나 물리 기기 FPS·배터리·실제 Safari 주소 표시줄/nonzero safe-area 검증을 주장하지 않는다. 외부 사진·영상·새 글꼴·새 런타임 의존성은 추가하지 않았다.

공개 화면의 최종 검토에서 큰 도시가 하단 chapter 탐색 뒤를 지날 때 일부 링크 대비가 약해지는 부분을 추가 발견했다. 탐색 영역 자체에만 night 배경을 적용했다. canvas나 카메라·scroll clock·본문 구성은 바꾸지 않았으며, 작은 실제 조작 영역의 대비를 확보하는 수정이다.

v3.0 공개 배포 확인:

- 주 구현 소스 `9574c8c7f5f3263b2f322e5fd6df1c55a945d910`, Actions https://github.com/YeByeol/ZipLanding/actions/runs/43225378046 — completed/success. 공개 전체 궤적 **14/14**를 다시 확인했다.
- 탐색 대비를 보강한 최종 소스 `9cf71342682339282346b915c92dcbcaa7f1d400`, Actions https://github.com/YeByeol/ZipLanding/actions/runs/43225950415 — completed/success. CI의63개 테스트·문법·export와 Pages upload/deploy가 통과했다.
- 최종 공개 HTML·기본/새 스타일·앱 모듈·Three·브랜드/그림/글꼴·라이선스 **31개 HTTP200/로컬 소스와 바이트 일치**.
- 공개 최종 UI **10/10**: 새 스타일과 clock, 실제80/74/65·80/10/10, 멈춘 뒤 header current, 탐색 배경 대비,320px 전체 비교표, 가려진 연결 출발점 억제, 마지막 CTA, 실제 체험창, Escape focus/scroll 복귀, script errors0. 실제 공개1440 criteria·320comparison/closing 화면도 시각 확인했다.

## v3.1 정보 패널의 구조·가독성 교체

사용자가 네 개의 확대 화면으로 가격·조건·비교·환산 정보의 시각적 문제를 다시 지적했다. v3.0의 잘림 검사와 기계적 통과는 정보 디자인의 적합성을 증명하지 못했다. 이번 변경은 큰 도시나 공통 scroll clock이 아니라 설명 UI 자체에 집중했다.

- 큰 흰색 면·104px 가격 숫자·사선 잘림·금색/보라 밑줄·표 줄무늬·흩어진 연산자 도해를 제거했다. 기존 ink/night/mint/Pretendard와 점수의 의미 보라는 유지했다. 여섯 정보 장이 같은14px 모서리·차분한 경계·장소/제목·수치·설명 역할을 공유한다.
- 가격은 월세와 단위의 baseline을 맞추고 보증금·면적을 동등한 보조 항목으로 묶었다. 중복 설명 문구를 없앴다. 조건은 왼쪽 이름/오른쪽 숫자·단위가 정렬되는 세 정의 행으로 바꿨다.
- 비교는 native table의7개 사실과 row/column association을 유지한다. `점수·점`, `월세·만` 대신 자연스러운 이름과 각 숫자 옆 단위를 사용한다. 비용과 장소 조건은 간격으로 구분한다. 작은 화면에서는 중복 제목만 생략하고 중요도와 모든 값은 그대로 남긴다.
- 환산은 결과1.70만 원/㎡→A/K/V 가로 비교→계산 근거 순서다. 모든 bar가 같은0원점에서 시작하고 실제 비율.5/1/.74709219858을 나타낸다. 월 환산 비용39.17만과 보증금 월환산4.17만은 기존 monthlyUnit(A)의 반올림 전 값에서 계산한다. 실제 월세 납부액이라고 표현하지 않는다. 연5%·12개월·관리비 제외·비교2곳·5곳 미만 백분율 요약 없음은 명시한다.
- 중요도와 결과 점수를 한 표면에 통합하고, 작은 화면에서도 `가격 제외`를 남긴다. 결측은 같은 정의 구조와 literal `자료 없음`으로, 미래 정보 계획은 `현재 미연결`로 분리한다.
- 비교·중요도·그래프의 긴 분기 연결선을 없앴다. 실제 도시 강조와 같은ID가 관계를 유지한다. 단일A/X 설명의 실제 투영 선3개만 조용히 남긴다. 카메라 크기·이동·smooth clock 코드는 변경하지 않았다.

확인:

- 계산 테스트 **64/64**, syntax·SVG export·diff 검사 통과. 새 회귀는 반올림된1.70×23=39.10을 거꾸로 사용하지 않고 실제39.17을 보존하는지 검증한다.
-1440×1000·1366×768·390×844·320×640에서 두 번의 묶음 시각 검토로8장씩 실제 화면을 대조했다. 확대된4패널도 별도로 읽었다. 짧은 화면의 표 밀도·메타정보·문구를 한 번에 수정하고, 남은320환산 copy overlap은 핵심 글자를 줄이지 않고 정적 그래프 간격을 조정해 고쳤다. 최종320환산의 copy/HUD 간격20.66px, 하단508px/640px, document overflow0이다.
- 실제 정보 UI **14/14**:6개 공통 표면,3개 실제 단일장소 선,desktop/320의 copy·UI 분리, 정의 구조와 모든 조건,7×3 cell units와 table association, 가로 그래프의 실제 zero-origin/비율,39.17/4.17/가정, X/미연결, compact가격 제외, native 체험창 focus/scroll 복귀, reduced의 완전한 값·비율, browser errors0을 확인했다.
- 독립 layout/type 검토는 숫자 위주의 서로 다른 네 문법이 원인이라고 지적했다. 교체 뒤 정보 순서와 단위 관계의 개선을 확인했고, 중복 메타정보를 정리했다. `64개 통과`를 디자인 품질의 근거로 삼지 않고 실제 확대 화면과 제품 맥락을 함께 검토했다.
- Impeccable detector의 경고는 기존 의미 보라4개와 기존 체험 native table wrapper1개다. 브랜드 의미색을 임의로 바꾸지 않았고, 실제 table cell padding과 새 HUD 여백을 직접 확인했다. 외부 글꼴·의존성·별도 테마는 추가하지 않았다.

물리 휴대폰 FPS/배터리 검증을 주장하지 않는다. 설계 근거는 `superpowers/specs/2026-11-12-zip-information-readability.md`에 기록했다.

v3.1 공개 배포 확인:

- 소스 `ce69561aff074529eac838ba0b3103409ef49141`, Actions https://github.com/YeByeol/ZipLanding/actions/runs/43234937318 — completed/success.64개 테스트·syntax·export·Pages 배포가 통과했다.
- 공개 HTML·CSS·앱·자산 **31개 HTTP200/로컬 소스와 정확한 바이트 일치**.
- 공개 정보 UI **14/14** 통과. 새 실제 표면·정의 행·전체 단위·수평 bar 원점/비율·환산 비용/가정·compact `가격 제외`·desktop/320 배치·체험창 focus/scroll·reduced·errors0을 다시 확인했다.
- 공개 script 차단에서도8개 일반 흐름,7개 비교 사실/21개 단위,39.17/4.17과 실제 bar 비율,overflow0을 확인했다. 새 가격·조건·비교·환산의 실제 공개 화면을 별도로 열어 보았다.

## v3.2 설명·정보 패널의 흐름과 하단 탐색 분리

새 사용자 화면에서 비교 패널이 설명을 덮는 현상을 재현했다. 이전 검사에 없던1440×900/860에서는 copy/HUD 간격이 각각−10.25px/−46.64px였다.850px 이하만 다르게 배치한 기존 breakpoint와 독립된 absolute top/bottom 기준이 원인이었다. 하단 진행선도 탐색 행과 같은 높이를 사용했다. 과거 화면 검사를 이 높이 구간의 통과로 확장하지 않는다.

- Stage를 읽기 영역과 실제 높이를 확보하는 dock의 두 grid 행으로 교체했다. 장 안에서는 설명→정보 패널이24px 이상 간격의 normal flex 흐름을 따른다. 큰 도시는 full-stage로 유지하며 카메라·공통 clock·8장 연출·계산은 그대로다.
- 이전·장면 선택·다음을 중앙의44px native 조작부로 모았다. 좁은 화면의 고지와 범례는 별도 행이다. 중복 하단 진행선과8개 링크 행을 없애고 상단 진행선 하나만 남겼다.
- 긴 내용은 읽기 영역 안에서 스크롤한다. 현재 enhanced 패널만 키보드 진입이 가능하며, 다시 나타나기 전 읽기 위치를 복원한다. hidden 상태에서 scrollTop=0이 무시되는 실제 브라우저 동작을 재현하고, opacity0으로 먼저 unhide한 같은 task에서 reset해 고쳤다.
- 내부 스크롤 때 실제 연결선 끝점을 갱신하고 읽기 영역 밖에서는 숨긴다. 별도 RAF나 camera draw를 추가하지 않으며 destroy에서 listener/paint 구독을 해제한다. noJS/낮은 화면의 일반 문서 흐름과 semantic table은 유지한다.

현재 로컬 확인:

- Node **68/68**, 전체 syntax·diff 검사 통과. 탐색 경계/ARIA/focus, 읽기 reset/lifecycle, inner-scroll listener 정리를 회귀로 포함한다.
- 독립 실제 브라우저 **64개 hold**:1440×900·1440×860·1440×850·1366×820·1280×720·1000×800·390×740·320×640에서8장 모두를 확인했다. 설명/HUD·HUD/dock·탐색/범례/고지 교차0, 가로 넘침0, 최소 간격24px, 조작부44px 이상, 진행선1개다. 전체 화면과 주요 비교/환산/마무리의 원본 크기 캡처도 직접 읽었다.
- 독립 검토에서 본문 밖 trailing padding만19px/8px 스크롤되는 두 곳을 발견해 padding을 정리했다. 최종 소스의1440×900·1440×860·1280×720·1000×800·390×740·320×640에서 **48개 hold**를 재확인했다. 설명/HUD 최소 간격24px, 문서 가로 넘침0이다. 이는 최초64개 검사와 같은 묶음이라고 세지 않는다.
- 실제 탐색 **10/10**: bootstrap 경계 비활성화, Enter 이전/다음, native 선택기·동적 접근성 이름, 마우스 이동, 마지막 경계와 focus, 체험 query/입력/선택 보존, 마무리 dialog Escape 복귀, reduced instant 경로,375×667의44px 조작부를 확인했다. browser errors0.
- 실제 긴 읽기 영역 검사는 QA에서 reading row를220px로 제한했다. 처음 화면 밖인 가격 endpoint는 숨김→내부202px 스크롤에서 실제 중앙 y87.65625와 선 끝이 일치→끝292px에서 다시 숨김을 확인했다. PageDown은 읽기 영역154px만 이동하고 window1332px는 유지했다. 별도로 다른 장을 거쳐 돌아올 때 읽기 위치260→0을 실제 브라우저로 확인했다.
- Impeccable 검사에는 기존 의미 보라4개와 체험 table wrapper1개의 경고가 남는다. 기존 브랜드·실제 cell 여백의 알려진 범위이며 새 테마·글꼴·의존성은 추가하지 않았다.

설계 근거는 `superpowers/specs/2026-11-13-zip-flow-layout.md`, 로컬 캡처/측정은 `qa/flow/`, 독립 확인은 `qa/overlap/accept/`, 탐색과 reset은 `qa/navigation-dock/`에 있다. QA 디렉터리는 배포 아티팩트에 포함하지 않는다. 실물 휴대폰·Safari 주소 표시줄·nonzero safe-area·FPS 검증을 주장하지 않는다.

최종 추가 확인에서1280×720 환산의 panel scrollHeight/clientHeight는576/576px,1000×800 비교는633/633px로 padding만 남던 스크롤도0이었다. 글자 크기만 두 배로 바꾼 비교 장의 QA 시뮬레이션에서는 Tab→읽기 영역→End로 마지막1995/2001/2007 행까지 접근했다. 이는 실제 browser zoom 검증이 아니며 시뮬레이션의 일부 열 간격은 좁았다. 독립 최종 코드 검토에서 새 기능·접근성 차단 사항은 찾지 못했다.

v3.2 공개 배포 확인:

- 배포 소스 `0120869b15788c424a16f35bef38bff87eb266ad`, Actions https://github.com/YeByeol/ZipLanding/actions/runs/43256196532 — completed/success.68개 테스트·syntax·SVG export와 Pages upload/deploy가 통과했다.
- https://yebyeol.github.io/ZipLanding/ HTML·CSS·앱·자산 **31개 HTTP200/배포 소스와 바이트 일치**.
- 공개1440×900·1440×860·320×640의8장 **24개 hold**에서 설명/HUD·HUD/dock·탐색/고지/범례의 교차0, 문서 가로 넘침0, 내부 강제 스크롤0,44px 이상 조작부와 full-stage 도시를 확인했다. 상단 진행선 하나만 표시되며, 공개 비교·환산의 원본 캡처도 직접 읽었다. 낮은800×500에서는8개 일반 흐름과 숨겨진 film 탐색을 확인했다. 이 묶음의 실제 최소 copy/HUD 간격은34.27px이다.
- 공개 탐색 **10/10**: 이전/다음/native 선택기·Enter·경계 비활성화와 focus·현재 장의 접근성 이름·체험 state/query 보존·dialog Escape 복귀·reduced 동작·375×667 조작부가 통과했다. 실제 browser errors0.
- 공개 script 차단에서도8개 일반 문서 흐름,7개 비교 사실/21개 단위,39.17/4.17·실제 bar 비율과 가로 넘침0을 확인했다. 결과와 캡처는 `qa/flow/public/`에 있으며 검증 전용 브라우저는 닫았다.
