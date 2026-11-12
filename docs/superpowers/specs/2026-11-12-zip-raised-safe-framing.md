# ZIP v2.4 — 위쪽 중심의 absolute 구도와 잘리지 않는 도시

사용자가 동작 중 하단이 잘리는 느낌을 지적했고, absolute 레이어를 활용해 화면 위쪽에 더 세련되게 배치하는 방향을 제안했다. 기존 제작·배포 범위에서 이를 구현한다.8장 이야기·브랜드·데이터·선택 체험은 유지한다.

## 재현한 원인

- 실제5개 viewport의 HTML 수치·메뉴·CTA는 화면 안에 있었다. 그러나 도시 픽셀은 canvas 하단에서 갑자기0이 되었다.1366×768에서는 y593→594,1440×900은 y692→693이 절단선이다.
- 실제 production mesh 정점을 투영하면 조건 장의 하단 초과량이1440에서612px,1366에서514px,390에서433px였다. 도시 일부가 실제 frustum 밖에 있다.
- 높이만 키우거나 위로 옮겨도 현재 고정 vertical frustum과 큰 확대값 때문에 잘림 비율이 남는다.
- 조건 장의 중간 전환에서 바깥 paper는 보이지만 내부 세 수치가 beat0이라 비어 보였다.

## 결정

1. 제목·도시·수치의 시각 중심을 위로 올린 absolute 구성으로 바꾼다. desktop 제목은 최대 약64px로 조정하고 여백을 다시 배분한다. 도시에는 더 높은 **장별 동일 draw 영역**을 배정한다. 하단 메뉴·범례·가상 예시 고지·CTA의 안전 영역과 safe-area inset을 확보한다.320/375에서 이미 밀집한 콘텐츠는 일괄 위로 밀지 않는다.
2. Story에만 전체 도시 bounds fit을 적용한다. 원래의 과도한 macro zoom보다 **온전한 도시와 적당한 점유율·시점·선택 표지의 변화**를 우선한다. 화면 밖 물체를 단순 mask로 감추는 방식은 사용하지 않는다.
3. 조건 수치는 panel이 보일 때부터 읽히게 하고 beat는 선·강조에 쓴다. 빈 반투명 카드가 먼저 덮는 상태를 없앤다.

## renderer 계약

- filmSnapshot.frame에 `fit:{padding:20,occupancy}`를 추가한다. occupancy는8장 `[.84,.9,1,.9,.88,.94,.97,.84]`의 같은 timeline from/to/blend로 계산한다. reduced/complete는 첫 occupancy로 고정한다. 기존 nominal zoom은 non-fit API의 호환과 이야기 의도로만 남는다.
- `setPresentation`은 fit을 명시한 story에서만 off-axis orthographic fit을 적용한다. experience/manual 시점·줌·damping은 바꾸지 않는다. fit 없는 API는 기존 동작이다.
- 실제 world geometry bounds를 build 뒤 보수적으로 캐시한다. billboard 반경·selected lift를 포함한다. frame마다 camera view-space의 bounds8점을 투영하여 aspect와 pixel padding 안에 들어오는 실제 zoom과 projection center를 계산한다. zoom·projection·target을 같은 draw에서 적용하며 `viewZoom`은 WebGL에 실제 적용한 값이다.
- 초기화·resize·역방향·fast seek·context loss에서 맞는 프레임과 연결선 좌표를 유지한다. 새 RAF loop는 없다. SVG/noJS는 원래의 전체 그림을 유지한다.

## 수용 조건

before/after의 실제 geometry와 pixel 경계를 비교한다.8장 hold뿐 아니라 전환21샘플씩,4개 이상 aspect에서 전체 모델이 padding 안에 드는지 검사한다. 실제 WebGL readPixels 또는 대응 투영으로 하단 절단이 없어졌음을 확인한다. 새 absolute 구도는5개 크기와 중간 frame·작은 높이에서 내용/조작 겹침·가로 넘침이 없어야 한다. 조건 수치의 전환 중 가독성, 모든8장 motion, 연결선, reduced/lowheight/SVG, 직접 체험/마무리 focus 복귀를 검증한다. 기존49개 검사의 의미를 유지하고 actual zoom 검증은 새 fit 계약으로 갱신한다. 실제 공개 후 파일과 동작을 다시 읽어 확인한다.
