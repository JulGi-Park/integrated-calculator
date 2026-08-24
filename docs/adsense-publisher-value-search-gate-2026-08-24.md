# 계산박스 Publisher Value + Search Gate 감사

- 감사 기준일: 2026-08-24
- 판정: READY (AdSense 승인 보장이 아니며 재신청은 수행하지 않음)

## A. Git

- base SHA: `ab4021d39e6eb9e0bf9c65c2d217731fccf07940`
- branch: `codex/publisher-value-search-260824`
- audited implementation SHA: `ded9e2b`
- main SHA at audit start: `ab4021d39e6eb9e0bf9c65c2d217731fccf07940`
- origin/main SHA at audit start: `ab4021d39e6eb9e0bf9c65c2d217731fccf07940`
- 최종 문서 커밋과 main 병합 SHA는 배포 후 최종 보고서의 Git 항목을 기준으로 한다.

## B. 계산기 가치 등급

등급은 승인 점수가 아니라 계산 결과 이후의 판단 정보, 변동 요인, 오해 방지, 실제 자료 검증 동선을 수동 평가한 기록이다.

### A — 계산 + 판단 가치 강함 (15)

- 대출 이자, 전세 vs 월세, 연봉 실수령액, 4대보험, 판매자 마진
- 주휴수당, 퇴직금, 실업급여, 육아휴직급여, 예금·적금
- 부동산 중개보수, 연장·야간·휴일근로수당, 청년미래적금, DSR, 근로·자녀장려금

### B — 계산 정확하지만 판단 가치 보강 여지 있음 (5)

- 부가세, ROAS, 카드 할부, 자동차 유지비, 국비지원 자격증 취득비용

### C — 범용 계산기와 차별성 보강 필요 (1)

- 물타기·평단가

## C. Flagship 계산기

선정: 연봉 실수령액, 4대보험, 대출 이자, DSR, 예금·적금, 퇴직금, 실업급여, 근로·자녀장려금.

선정 근거는 Search Console 노출 경험, 급여·보험·대출·지원금의 YMYL 중요도, 계산박스의 대표 분야, 경계 규칙과 실제 자료 확인 필요성이다. 각 결과 객체의 현재 계산값을 사용해 다음 정보를 결과 가까이에 추가했다.

- 결과 의미와 사용자가 다음에 판단할 내용
- 이번 계산에 실제 적용된 조건·상한·하한·세금·상환 방식
- 결과를 크게 바꾸는 입력값
- 급여명세서, 보험 고지, 상품 약관, 고용24, 홈택스 등 주제별 확인 자료
- 절사·반올림, 신고 기준, 심사, 상품 우대 조건 등 실제값과 차이가 나는 구체적 이유

계산식을 판단 UI에서 다시 구현하지 않았고 기존 엔진 결과 필드에만 연결했다.

## D. 검색 기능

- 검색 대상: title, description, category, aliases, user intents, 선택적 입출력 요약
- 데이터 원본: `lib/calculatorRegistry.ts`의 21개 Registry
- 정렬: 제목 정확 일치, 제목 부분 일치, alias, intent, category, description 순
- aliases/intents: 월급, 보험, 퇴사, 알바, 대출 한도, 적금, 전세 등 실제 제공 계산기 의도만 등록
- URL 상태: React local state만 사용하며 query, hash, pathname, history를 변경하지 않음
- 광고 상태: `/calculators/`는 검색 상태와 관계없이 ADS_BLOCKED 유지
- analytics: `calculator_search`, `calculator_search_select`; raw 검색어는 전송하지 않고 결과 수, 분류, 사전 정의 ID, 선택 계산기 ID만 전송
- 접근성: 명시적 label, `role=search`, live result count, clear/전체 보기 버튼, IME composition 처리
- 결과 없음: 0개 상태, 설명, 전체 계산기 보기 제공; 404나 검색 URL을 만들지 않음
- 모바일: 390×844에서 검색창·카드 가로 overflow 0, 한글 검색과 clear 버튼 정상

## E. Homepage / Methodology

- 홈페이지: 변경 없음. 서비스 목적, 공식 기준, 계산식 공개, 결과 한계와 운영 원칙이 이미 첫 화면과 신뢰 영역에서 설명됨.
- 방법론: 변경 없음. 자료 선정, 코드 반영, 경계 테스트, 정책 변경 관리, 기관 결과 차이 원인에 이미 답함.
- 변경 이력: 2026-08-24 검색 및 8개 핵심 결과 판단 안내를 사용자 의미 단위의 변경으로 추가. 정책 기준일을 임의 갱신하지 않음.

## F. Boilerplate

- 변경 전 Production 최고 5-word shingle 유사도: 0.89%
- 변경 후 최고: 0.89% (`labor-pay` ↔ `vat-profit`)
- 35자 이상 동일 문장 3개 이상 반복: 변경 전 0, 변경 후 0
- 공통 컴포넌트의 섹션 제목만 공유하고 의미·규칙·확인 자료·차이 원인은 8개 계산기별로 작성했다.

## G. AdSense

- ADS_ALLOWED: `/`와 공개 계산기 21개
- ADS_BLOCKED: `/calculators/`, 신뢰·정책 페이지 7개, 404/error/loading/navigation-only 및 그 밖의 미허용 경로
- 기본 정책: 명시 allowlist 외 전부 차단
- 브라우저 SPA: HOME→CALCULATORS 차단, CALCULATORS→SALARY 허용, SALARY→CALCULATORS 차단, CALCULATORS→HOME 허용, LOAN→METHODOLOGY 차단 확인
- 신규 광고 위치나 광고 slot은 추가하지 않음

## H. SEO

- public/indexable/sitemap: 30/30/30 유지
- calculators: 21 유지
- 신규 검색 URL: 0
- canonical/metadata: 기존 운영 절대 URL 유지
- broken internal links: 0
- duplicate metadata: 0
- Cloudflare 정적 산출물 검증: PASS

## I. 테스트

- `npm ci`: PASS, 397 packages, vulnerabilities 0
- lint: PASS (error 0, warning 0)
- typecheck: PASS
- unit/integration/UI: 977/977 PASS
- production build: PASS, 36 static pages generated
- publisher audit: PASS (30 indexable, 21 calculators, broken links 0, duplicate metadata 0)
- similarity audit: PASS/수동 진단 완료 (최고 0.89%, 반복 문장 0)
- 브라우저: 검색 주요·결과 없음·초기화·클릭·모바일 PASS, Flagship 8개 실계산 PASS, SPA 광고 경계 PASS
- YMYL: 기존 건강보험 상·하한/장기요양 연쇄, 연봉·보험 일치, 주휴 39.99/40/40.01 경계 테스트 유지

## J. 남은 위험

- P0: NONE
- P1: NONE
- P2: 물타기 계산기의 범용성 대비 판단 가치 추가 여지. 승인 보장과 무관하며 신규 URL이나 장문 콘텐츠로 보완하지 않는다.
- AdSense crawler 반영 시차와 최종 정책 평가는 외부 요인이며 이번 작업에서 재신청하지 않는다.
