# ZIP v2.3 — 같은 장소와 데이터를 눈으로 연결하기

기존 8장 스크롤 필름의 후속 개선이다. 사용자 요청은 “좀더 개선해줘”이며, 앞서 확정한 전체 본문의 모션그래픽·편안한 전환·GitHub Pages 공개 범위를 이어간다. 브랜드, 내용, 계산, 방문자 체험 상태는 유지한다.

## 실제 화면에서 확인한 개선점

- 넓은 종이 패널이 도시를 가리고, 건물과 수치가 같은 장소라는 관계가 약하다. A/X의 중심은 camera frustum 안에 있으므로 이를 카메라 오류로 단정하지 않는다.
- 320px의 비교 카드 세 개는 각각 약93px로 좁아 단위·연도가 갈라진다. 같은 화면의 마지막 장 링크도 nav 바깥에 가려진다.
- 가격 환산 뒤의 비교가 문장에만 있고 마지막 장의 직접 체험 행동은 상단 헤더에만 있다.

## 선택한 개선 방향

도시를 그대로 두고 실제 건물 표지와 설명을 연결한다. 더 큰 회전이나 추가 등장 효과를 쌓는 방식은 사용하지 않는다. 장면별 정보 표현을 분명히 하고, 비교·탐색·마무리의 사용성을 개선한다.

1. **실제 투영 연결선**: 가격/조건A, 기준·비교A/B/C, 가격 비교A/K/V, 결측X를 해당 데이터에 잇는다. 좌표는 실제 WebGL marker 또는 SVG CTM에서 얻으며 CSS로 건물 위치를 추측하지 않는다. 기존 scroll beat로 선이 완성되고 멈춘다.
2. **가격 비교 그래프**: A/K/V의 실제 월 환산 단가1.70/3.41/2.54만/㎡를 같은 축의 막대로 표현한다. 근거는 기존 monthlyUnit 함수다. 2곳의 비교 대상, 연5%가정·관리비 제외·퍼센트 평가 없음은 유지한다.
3. **모바일 비교 행렬**: 760px 이하에서는 공통 행 제목과 A/B/C 세 열로 조건을 읽는다. desktop의 카드 정렬 연출은 유지한다. 원래 가격·면적·경사·고도·준공·점수를 생략하지 않는다.
4. **보이는 탐색과 끝 행동**: 모바일의8개 숨은 가로 링크 대신44px 높이 native 장면 선택기와 현재 위치를 제공한다. 처음에는 스크롤 안내, 마지막에는 직접 체험 버튼을 장 안에 둔다. 닫기/ESC 시 위치와 opener focus 복원을 유지한다.

## 인터페이스와 동작

- renderer: `projectAnchors(ids)` → 도시 컨테이너 기준 CSSpx의 `{id,x,y,visible,renderer}` 배열. 읽기 전용이며 draw/RAF를 만들지 않는다. 실제 render 뒤 marker 월드 좌표를 project한다. SVG는 getScreenCTM으로 얻는다. unknown/hidden/destroyed/zero-size/유효하지 않은 좌표는 visible:false, 화면 밖 좌표를 가장자리로 강제 고정하지 않는다.
- renderer: `onPaint(listener)`는 unsubscribe를 반환한다. 초기 GPU 준비·resize·context loss·실제 draw 뒤 연결선을 갱신한다. story만 이를 구독하며 콜백은 선만 갱신한다. renderer나 story 재진입 루프를 만들지 않는다.
- root: `#story-connections` SVG layer를 도시 위/데이터 아래에 둔다. `data-film-anchor="a|b|c|k|v|x"`가 종착점, `data-film-link-beat="1|2|3"`가 해당 선의 읽기 진행이다. `data-film-occluder`는 실제 불투명 데이터 표면이다. 표지가 표면에 가려지거나 frustum 밖이면 선을 숨긴다. panel opacity와 같은 scroll snapshot을 사용한다.
- `data-film-price-bar="a|k|v"`는 모델의 실제 ratio를 `--price-ratio`로 받는다. 값과 단위는 실제 텍스트이며 bar는 aria-hidden 장식이다. field unit-k/unit-v도 snapshot에서 제공한다.
- `#story-chapter-select`의 value는8 phase name과 같다. controller가 현재 값을 갱신하고 main의 change handler는 기존 scrollFilmTo를 사용한다. `#story-position`은01 /08과 같은 실제 순서를 표시한다. 접근성용 chapter links는 desktop에 유지한다.
- closing button은 기존 data-open-demo/data-needs-js/disabled 계약을 사용한다. 별도 체험의 입력/선택/공유가 film을 바꾸지 않는다.

## 품질과 검증

기존 canvas client/buffer 크기, camera poses, 순수 timeline/색/숫자 동기화, 읽기 정지, 히스테리시스, 같은 진행값의 역방향 일치를 유지한다. 선 갱신은 기존 draw/scroll task 안에서만 한다. noJS·낮은 화면은 일반 문서/완성 그래픽, reduced에서는 연결선 이동을 숨기고 동일 ID와 값으로 관계를 읽는다. 새 라이브러리·상시 loop·실거래 주장·두 번째 테마는 없다.

검증은 투영/CTM/clip/초기화/resize/context loss, 가격축의 실제 비율, 모바일 행렬/선택기/마지막 CTA, 기존42개 회귀와 실제 전체 forward/reverse/seek, 5개 화면 크기, keyboard/modal 복귀를 포함한다. 공개 후 파일 바이트와 전체 동작을 확인한다. 실물 휴대폰 FPS나 의학적인 눈 피로 개선을 주장하지 않는다.
