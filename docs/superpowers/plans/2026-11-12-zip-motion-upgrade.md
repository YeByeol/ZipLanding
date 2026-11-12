# ZIP Motion Upgrade Implementation Plan

> **For agentic workers:** Use subagent-driven-development or executing-plans. This is an authorized continuation of the approved landing design; implement and deploy without another approval gate.

**Goal:** 실제 3D 도시, 직접 조작, 자연스러운 스크롤 연출을 기존 비교 기능과 연결해 Pages에 반영한다.

**Architecture:** 기존 HTML·상태·SVG 대체 화면을 재사용. `scene3d.mjs`가 로컬 Three.js로 점진적으로 바꾸고 `motion.mjs`가 스크롤과 등장을 조정한다. 동일 색 함수·데이터를 사용한다.

**Spec:** `docs/superpowers/specs/2026-11-12-zip-motion-upgrade.md`.

**Global Constraints:** 원래 제품 컨셉·가상 데이터 표시 유지. 스크롤 가로채기 없음. 사용자 조작 우선. reduced motion·그래픽 대체·동일 비교 계산. 외부 CDN 없음. 기존 공개 주소에 배포.

**Review Focus:** 터치에서 수직 스크롤을 막지 않음; 수동 시점을 자동 스크롤이 덮지 않음; context loss에서도 비교 가능; 화면 밖과 숨긴 탭에서 렌더 중단; Pages 하위 경로와 vendor 포함.

- [x] Task 1: 카메라·진행·드래그 순수 모델과 테스트를 RED→GREEN으로 구현. `scripts/scene-model.mjs`, `tests/scene-model.test.mjs`.
- [x] Task 2: 실제 WebGL 도시와 SVG 대체, 재질 보간·선택·회전·reset·정리 구현. `scripts/scene3d.mjs`; `city.mjs`의 `colorFor` 재사용.
- [x] Task 3: root가 시점 버튼·sticky navigation·스크롤 진행·등장과 연결. `index.html`, `styles.css`, `scripts/main.mjs`, `scripts/motion.mjs`. `setProgress(p)`, `rotate(delta)`, `resetView()`는 3D owner의 메서드.
- [x] Task 4: 독립 검토·브라우저·접근성·반응형·3D 대체 검증, workflow에 vendor 포함, 같은 공개 URL로 배포하고 실제 동작 확인.
