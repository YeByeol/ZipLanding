# ZIP

**도시를 보는 나만의 기준.**

장소의 조건을 사용자 중요도로 종합하고 비슷한 조건의 장소와 가격을 비교하는 지도 플랫폼, ZIP의 소개 페이지입니다.

공개 페이지: https://yebyeol.github.io/ZipLanding/

이 저장소는 서비스 컨셉을 소개하는 정적 웹사이트입니다. 도시 모형과 모든 체험 값은 직접 만든 가상 예시이며 실제 관악구 건물, 지역 가격, 현재 매물이나 완성된 서비스를 나타내지 않습니다.

## 로컬 실행

Node 22 이상과 Python 3을 사용합니다. 앱 의존성 설치는 필요하지 않습니다.

```sh
npm run dev
# http://127.0.0.1:4178
npm test
npm run check
```

ES modules를 사용하므로 로컬 HTTP 서버로 열어주세요. GitHub Pages에서는 그대로 동작합니다.

## 구성

- `index.html`, `styles.css`: 소개, 반응형 화면, 모션과 스크립트 없는 읽기 경로
- `scripts/demo.mjs`: 24개 가상 건물, 조건 점수, 가격 비교, 공유 URL 검증
- `scripts/city.mjs`: SVG 도시와 같은 DOM에서의 재색칠·선택 갱신
- `scripts/main.mjs`: 중요도·지도 선택·담기·비교·공유 연결
- `assets/`: SVG 브랜드·도시 장면, 공유 이미지, 로컬 글꼴
- `tests/`: Node 기본 테스트
- `docs/verification.md`: 실제 확인 범위와 제한

## 체험 계산

경사·고도·연식을 예시 집합의 순위로 바꾸고 중요도에 따라 가중 평균합니다. 가격은 점수에 포함하지 않으며, 자료 없는 조건은 빼고 다시 나눕니다. 중요도가 모두 0이면 동일 중요도를 적용합니다.

월 환산 단가 = `(월세 + 보증금 × 0.05 ÷ 12) ÷ 면적`. 연 5%는 체험용 가정이며 관리비는 제외합니다. 점수가 ±5점인 예시끼리 비교하며, 비교 대상이 5개 미만이면 퍼센트 요약을 표시하지 않습니다. 실제 지역의 저평가·고평가를 판단하는 계산이 아닙니다.

## 자산과 출처

로고와 도시 모형은 이 페이지를 위해 직접 만든 벡터 자산입니다. 실제 지역의 공공 건물 도형·거래 원자료·외부 사진은 포함하지 않습니다.

Pretendard Variable은 [Pretendard 공식 저장소](https://github.com/orioncactus/pretendard)에서 받아 로컬 제공합니다. SIL Open Font License 1.1 전문은 `assets/fonts/OFL.txt`에 포함되어 있습니다.

## 배포

`main`에 push하면 GitHub Actions가 테스트·문법 검사를 수행하고 HTML·CSS·scripts·assets만 Pages 아티팩트로 만듭니다. 개발 기록·테스트·문서·로컬 설정은 웹 아티팩트에 포함하지 않습니다. API, 계정, 서버 또는 인증키는 필요하지 않습니다.
