# ZIP v2.3 구현 계획

Spec: `../specs/2026-11-12-zip-connected-film-refinement.md`. 확정된8장 구성의 후속 개선. 기존 same-frame renderer와 계산을 재사용한다.

## Task A — 투영 API (engine agent)

소유: scripts/scene3d.mjs, 필요시city.mjs, renderer/projection 관련 테스트. 다른 파일은 수정하지 않는다.

- [x] 투영/클리핑·SVG 좌표·lifecycle 검증을 먼저 추가한다.
- [x] projectAnchors/onPaint를 추가하고 actual draw/fallback/resize/async 준비 뒤 알림을 연결한다.
- [x] experience/manual 동작·guard·damping·자원 해제·context loss를 보존한다. 새 RAF loop 없음.

## Task B — 시각 구성과 탐색 (layout agent)

소유: index.html/styles.css. JS·tests는 수정하지 않는다.

- [x] 연결선 layer와 실제 anchor/occluder/beat 표식, 더 작은 장별 데이터 표면을 구성한다.
- [x] 가격 비교3개 bar, 모바일 비교 행렬, 모바일 native 장면 선택기/현재 위치, 첫 스크롤 안내/마지막 직접 체험 버튼.
- [x] 기존42개 검사에 필요한 ID·필드·의미·단위를 보존한다.5개 화면 크기에서 한 묶음 검토/수정 후 확인한다.

## Task C — 모델·연결선·통합·공개 (root)

소유: film-model/story/main 및 필요시story-connections 새 module, 관련 테스트/package/문서.

- [x] 실제 가격 비율과 필드, 투영 좌표→stage→데이터 연결을 기존 snapshot에 연결한다. 애니메이션 중 DOM 위치도 매 frame 반영하고 lifecycle 구독 해제.
- [x] 장면 선택기와 closing opener의 기존 native dialog 복귀를 연결한다.
- [x] 새 핵심 로직 검사, 기존42개 회귀,5width·전체 실제 motion/역방향/clip/초기화/resize/SVG/reduced/keyboard·독립 검토.
- [ ] source commit/main/Pages 공개, Actions 성공·공개 파일/동작 readback, receipt/branch/browser 정리.
