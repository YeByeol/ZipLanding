# ZIP 전체 본문을 하나의 스크롤 모션그래픽으로

사용자 추가 교정: 상단만3D이고 그 아래를 직접 조작·정적 설명으로 남기면 요구를 충족하지 않는다. **처음부터 끝까지 조작 없이 보는 모션그래픽 같은 소개**가 핵심이다. 기존 제작·배포 승인 안에서 전면 구성한다. cf4517b의 편안한 전환은 내부 기반이며 아직 공개하지 않았다.

## 페이지의 약속

한 sticky stage와 같은3D 도시로 모든 핵심 내용을 설명한다.8개 장 모두 scroll-authored graphics/camera/data motion이 있고 별도 조작 없이 의미를 완결한다. 기존 슬라이더·선택·담기·비교·공유는 **선택적으로 여는 직접 체험 dialog**로 옮긴다. 정적인 체험/근거 section이 본문 이야기를 끊지 않는다. 실제 출시나 실거래 데이터로 오해시키지 않는다.

## 여덟 장의 이야기

|Phase|이야기와 실제 값|움직임의 역할|
|---|---|---|
|discover|당신의 기준으로. 도시를 새롭게. 직접 만든24개 가상 장소.|Z의 선/도시가 하나의 무대를 만들고 wide city에서A를 발견한다.|
|price|A 월35만·보증금1,000만·23㎡. 가격표만으로 장소는 설명되지 않는다.|같은A 표지를 따라 가격의 세 요소가 선과 함께 조립된다.|
|conditions|A 경사1%·고도90m·1995년.|카메라가 가까워지고 지형색으로 넘어간다. 조건 세 층의 강조가 순차적으로 완성되고 멈춘다.|
|criteria|시연 중요도 균등→경사80%/고도10%/연식10%. A/B/C 약37/45/52→80/74/65. 가격 제외.|막대·실제 계산 점수·도시 색이 같은 진행값으로 바뀐다. 방문자가 슬라이더를 만질 필요가 없다.|
|comparison|같은A/B/C의 점수·월세·면적·조건. 보편적인 우승 장소는 주장하지 않는다.|같은ID의 세 paper 데이터 카드가 정렬되고 점수→가격→조건의 읽기 강조를 넘긴다.|
|value|A `(35+1,000×5%÷12)÷23=1.70만/㎡`. 연5%가정·관리비 제외. 현재시연 기준±5점 비교2곳.|공식이 실제 숫자에서 조립되고 비교 가능한 건물이 강조된다. 두 곳의 가격을 보여주며5개 미만이므로% 요약은 표시하지 않는다.|
|evidence|X의 세 조건/점수 자료 없음. 신고계약·추정지형·묶인건물은 계획 중인 정보이며 현재연결 아님.|같은 도시의X로 초점을 옮기고 결측 빗금·자료 없음이 차례로 드러난다. 단서를 선으로 묶고 한계를 분명히 읽는다.|
|closing|이제, 당신의 기준으로. ZIP. 직접 기준 바꿔보기.|처음의wide city로 돌아오며Z선을 완성한다. 조작 없이 이야기를 마친 뒤 선택 체험을 제공한다.|

night/paper/mint/ink와 가격청록·점수보라는 유지한다. 실사/새 테마/새 모션 라이브러리 없이 모형·데이터·글자의 동작으로 설명한다. 그림의 client rect는 모든 장에서 동일하다. 큰 배경 밝기를 교체하거나 도시를 깜빡여 전환하지 않는다.

## Motion과 상태 계약

- PHASES=`discover,price,conditions,criteria,comparison,value,evidence,closing`.8waypoint의 간격은140svh, sticky stage는 viewport-header. 전체는약1080svh. 경계(i+.5)/7 양옆.035의 smootherstep 전환, logical metadata만±.006 hysteresis. reading pose는각장center에 고정된다.
- 장 안의 선그리기·카드정렬·조건강조·공식조립·중요도 자동시연은 해당 장의local progress에서 계산하고 완료 뒤 읽기 정지를 둔다. 뒤로 스크롤하면 동일한 물리 frame으로 되감긴다. 별도 시간축/자동루프/휠가로채기/강제스크롤 없음.
- 일반 제목은 같은 자리에 fade-through. 도시·배경은 계속 남는다. 주요 그래픽의 움직임은 의미별로 작고 연속적이며 글자 자체가 흔들리거나 빠르게 이동하지 않는다. CSS opacity/transform에 독립적인 transition을 겹치지 않는다.
- story가 쓰는 시연weights/selected A→X/비교A,B,C는 방문자demo state와 독립적이다. scroll이 방문자query/weights/selected/saved/mode를 바꾸지 않는다. 수치·색은 기존demo.mjs 함수로 계산한다. 실제 체험을 바꾸고 닫아도 film은 같은이야기로 복귀한다.
- story setPresentation은 기존 same-task exact draw를 유지하며 frame.weights/selected/highlightIds를 story 전용으로 적용할 수 있다. experience/manual guard와 기존 damping은 유지한다. SVG fallback도 같은 snapshot으로 재색칠하며 결측 빗금 보간·자원정리·contextloss경로 보존.
- camera poses: discover wide(zoom1.05,yaw.72,pitch.68); price(1.2,.68,.7,A주변중심); conditions(2.6,.62,.80,A); criteria(1.05,.72,.76,중앙); comparison(1,.62,.72,중앙); value(1.05,.56,.92,중앙); evidence(1.9,.62,.8,X); closing(1.05,.72,.68,중앙). from/to camera targets는해당장(A/X/중앙)을 별도로계산한다.

## DOM 공용 계약

- 기존 #platform/#story-stage/#story-city, [data-story-step/panel/link] 유지하되8개로 확장. #story-discover..#story-closing. 공통 #story-caption/#story-legend, 영구H1, film disclosure, nav/선택체험CTA 유지.
- 각panel에controller가 --beat-1/2/3(0..1)를 쓴다. CSS는 해당장선/강조/카드의transform/opacity를 이에 연결한다. noJS/reduced/low-height에서는모두1. `data-film-weight=slope/elevation/age` 실제막대transform, `[data-film-field]`는동일snapshot의숫자/설명이다.
- fields: rent/deposit/area/slope/elevation/year, score-a/b/c, weight-slope/elevation/age, unit/peer-count/peer-summary, x-slope/x-elevation/x-year/x-score. 기본정적HTML값도정확히입력한다. 시연weights는균등→80/10/10으로본문에명시한다. 필수정보를가짜CSScounter로만쓰지않는다.
- #demo-dialog + [data-open-demo] + #close-demo. 기존 #experience/#comparison/모든실제입력/요약/공유ID는dialog안에보존. 독립.modal body가스크롤한다. showModal/ESC/close가focus와film scroll위치를복원한다. modal내앵커는modal만이동시킨다. HTMLscrollbar-gutter로폭흔들림을방지한다.
- native nav는스토리장목적지로이동. 직접체험은버튼명으로구분한다. noJS/height<=620은8개장일반흐름+정적도시·완성그래픽과정확한값. reduced는stationarycamera와완성그래픽으로모든장정보를읽는다.

## 수용 조건

8개 장 각각에 실제scroll-linked 의미동작이있고, 본문은직접조작없이끝까지내용이완결된다. 하단을정적documentation으로대체하지않는다. 전체forward/reverse/fastseek/jitter에서canvas invariant·state불변·동일진행값동일snapshot. 자동weights/점수/가격불변·두peer/%없음·Xmissing검증. native modalkeyboard/focus/scroll복원·실제조작·SVG/JSoff/reduced/lowheight·320/375/390/768/1440겹침·contrast검증. 실제연속영상과다섯화면크기로검증후기존Pages에배포하고공개파일·동작을읽어확인한다. 실물폰FPS나의학적인눈피로를주장하지않는다.
