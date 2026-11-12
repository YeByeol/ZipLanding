# ZIP v2.4 구현 계획

Spec: `../specs/2026-11-12-zip-raised-safe-framing.md`. 재현 증거는 `qa/crop/layout`, `qa/crop/scene`이다. User가 absolute 위쪽 구도를 제안했고 root가 진행을 수락했다.

## A — story 전용 geometry fit (engine agent)

소유: scene3d/scene-model 또는 새 scene-framing module, renderer/framing 관련 tests.

- [x] 기존 production geometry의 잘림 RED 보관, 순수 fit과 전체 bounds containment 검사.
- [x] frame.fit 명시 경로에서 cached geometry/view-space bounds, actual zoom/off-axis center/padding 적용. 일반 camera API·experience는 유지.
- [x] 실제 browser pixel/projection·resize·초기화·clip·같은 draw 알림·역방향 확인.

## B — 위쪽 absolute 구성 (layout agent)

소유: index.html/styles.css.

- [x] title/art/data cluster를 높이고 더 큰 invariant art 영역·하단 안전 영역 배분. compact에는 내용에 맞는 배치.
- [x] 조건 수치 즉시 읽기, beat는 강조만. 기존 필드·버튼·표·선 anchor/occluder·장면 선택기 보존.
- [x]5개 viewport의 전환/hold를 한 묶음 검토·수정 후 확인. 모형과 읽기 영역의 관계 검증.

## C — fit 의도·통합·공개 (root)

소유: film-model/tests/package/docs, 필요한 연결선 통합 수정.

- [x] 같은 timeline의 fit occupancy와 reduced 고정값, 핵심 RED→GREEN.
- [x] 기존 회귀·새 잘림/중간 수치·위쪽 구도·연결선/실제 선택 체험 검증과 독립 검토.
- [x] main/Pages 배포·Action 성공·공개 파일/동작 readback·receipt·정리. Source0db4115, Actions43185482557, 공개14+20개 검사 및23개 파일 byte-match.
