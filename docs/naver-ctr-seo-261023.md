# 계산박스 네이버 CTR·SEO 최적화 — 2026-10-23

작업 ID: `GYESANBOX-NAVER-CTR-SEO-261023-001`
사이트: <https://gyesanbox.kr/>
분석 기준 SHA: `dbda7ee560438b3e94be70044e48517551cf8906`
Naver Search Advisor 최근 보고 갱신: 노출·클릭 `2026-10-22`, 사이트 진단 `2026-10-21`, 수집 진단 `2026-10-23`

## 결과 요약

최근 30일 보고의 사이트 합계는 화면 반올림 값 기준 약 350 클릭, 33,000 노출, CTR 1.1%였다. 클릭은 이전 기간 대비 46.7% 감소, 노출은 33.3% 감소, CTR은 0.3%p 감소로 표시됐다. 반면 최근 90일은 약 1,400 클릭, 108,000 노출, CTR 1.3%였고 이전 기간보다 클릭·노출이 크게 늘었다. 사이트 전체가 검색에서 빠졌다는 증거는 없으며, 최근 30일의 노출 구성 변화와 일부 대량 노출 키워드의 낮은 CTR을 우선 관찰할 필요가 있다.

검색 수요가 확인되고 실제 도구 기능과 제목의 설명이 어긋나 클릭 전에 기대를 잘못 만들 수 있는 두 URL만 메타데이터를 구체화했다.

| 우선순위 | 검색어 근거 | 대상 | 조치 |
|---|---|---|---|
| P1 | `할부계산기` 3,047회 노출/CTR 0.2%; `카드할부계산기` 1,664회/1.9%; 카드 할부 URL 8,856회 노출/CTR 1.0% | `/calculators/card-installment/` | 사용자가 수수료율을 입력하는 계산기라는 점과 카드사별 실제 요율·부분 무이자 미반영을 제목/설명에서 명확히 안내 |
| P1 | `청년미래적금 계산기` 1,520회 노출/CTR 0.1%; 대상 URL 2,307회 노출/CTR 0.3% | `/calculators/youth-future-savings/` | 2026 기준, 3년·월 50만원 상한 및 6%/12% 기여금 참고값, 자격 자동판정이 아님을 설명 |

추가 변경은 하지 않았다. `/calculators/labor-pay/`, `/calculators/salary/`, `/calculators/unemployment/` 등은 노출/클릭 기회가 있지만 현재 제목·설명과 페이지 기능이 검색의도에 대체로 부합했다. SERP 순위가 안정적으로 측정되지 않았고 화면에서 실측된 URL별 검색어 연결도 제한적이어서 메타 교체 근거가 충분하지 않았다. 3~5개 목표는 최소 변경 원칙에 따라 두 건으로 제한했다.

배포일 기준 CTR 상승이나 순위 상승은 주장하지 않는다. Naver 데이터 갱신 후 14일·28일 구간으로 다시 비교한다.

## 기준선 및 범위

- 시작 Git/main/origin/main 및 Production Source: `dbda7ee560438b3e94be70044e48517551cf8906`
- 시작 tracked 작업트리 clean. 원본 저장소의 기존 untracked 7개를 그대로 보존했다.
- Cloudflare Pages `integrated-calculator`, 성공 deployment `07d09951-94ce-4be3-b804-99d647f1d539`, Source SHA `dbda7ee560438b3e94be70044e48517551cf8906`, `commit_dirty=false`.
- 작업 브랜치: `codex/naver-ctr-seo-261023-001` (main의 기준 SHA에서 분리).
- 영향 범위는 계산기 두 페이지의 `title`/`description`과 각 페이지의 메타 회귀 테스트다. 계산식, 화면 본문, H1, 링크, 광고, Worker, D1, gate 설정은 변경하지 않았다.
- 기존 사용자 페이지 주소는 바뀌지 않았다. 주소가 변경된 페이지: 없음.

## Search Advisor 보고 범위 및 한계

- 로그인된 기존 `gyesanbox.kr` 사이트 속성의 Naver Search Advisor를 읽기 전용으로 확인했다. 기간 메뉴는 최근 30일·90일 상대 기간으로 표시됐다. 화면상 정확한 달력 시작/끝 날짜는 제공되지 않아 임의로 만들지 않았다.
- 노출·클릭 보고의 최근 갱신일은 2026-10-22. 상위 검색어는 클릭 기준 Top 30이며 전체 검색어 목록이 아니다.
- 기기 표는 PC+Mobile 결합 값만 확인됐다. 기기별 값은 확인되지 않았다.
- 웹문서 보고 화면에서 최근 30일 26개, 최근 90일 27개 행만 표시됐다. 화면에 나오지 않은 4개/3개 URL을 보충하거나 합계로 추정하지 않았다.
- Naver Search Advisor의 URL 진단은 HTTP/크롤링 가능성·메타 추출 진단이며 실제 검색 노출이나 순위를 보장하지 않는다. 검색결과 화면은 시점·기기·사용자 상황별로 달라질 수 있어 순위를 기록하지 않았다.
- Search Advisor 보고의 사이트 합계와 개별 행의 합은 집계/반올림 차이로 같다고 가정하지 않는다.

### 사이트 합계

| 보고 기간 | 클릭 | 노출 | CTR | 이전 기간 대비(화면 표시) |
|---|---:|---:|---:|---|
| 최근 30일 | 약 350 (`3.5백`) | 약 33,000 (`3.3만`) | 1.1% | 클릭 -46.7%, 노출 -33.3%, CTR -0.3%p |
| 최근 90일 | 약 1,400 (`1.4천`) | 약 108,000 (`10.8만`) | 1.3% | 클릭 +10,769.2%, 노출 +15,855.8%, CTR -0.6%p |

화면에 표시된 반올림 단위를 유지했으며, 원시 정확값인 것처럼 환산해 해석하지 않는다.

## Naver 검색어 Top 30 — 최근 30일

상위 30개 클릭 검색어 보고. URL 연결은 별도 URL 보고나 검색결과 확인이 없으면 단정하지 않는다.

| # | 검색어 | 클릭 | 노출 | CTR |
|---:|---|---:|---:|---:|
| 1 | 카드할부계산기 | 31 | 1,664 | 1.9% |
| 2 | 국민연금 납부 계산기 | 15 | 185 | 8.1% |
| 3 | 국민연금 납부액 계산 | 11 | 568 | 1.9% |
| 4 | 할부 수수료 계산기 | 9 | 634 | 1.4% |
| 5 | 알바 주급 계산기 | 7 | 938 | 0.7% |
| 6 | 할부계산기 | 6 | 3,047 | 0.2% |
| 7 | 카드 수수료 계산기 | 3 | 112 | 2.7% |
| 8 | 예상 실업급여 계산 | 3 | 56 | 5.4% |
| 9 | 연봉별 국민연금 납부액 | 3 | 42 | 7.1% |
| 10 | 하루 4시간 실업급여 | 3 | 24 | 12.5% |
| 11 | 국민연금 월 납부액 계산 | 3 | 18 | 16.7% |
| 12 | 국민연금 납부액 계산기 | 3 | 10 | 30% |
| 13 | 계산박스 | 3 | 5 | 60% |
| 14 | 청년미래적금 계산기 | 2 | 1,520 | 0.1% |
| 15 | 야간수당 계산기 | 2 | 840 | 0.2% |
| 16 | 할부 계산기 | 2 | 450 | 0.4% |
| 17 | 카드 할부 계산기 | 2 | 96 | 2.1% |
| 18 | 실업급여 계산기 4시간 | 2 | 33 | 6.1% |
| 19 | 실업급여 구간 | 2 | 14 | 14.3% |
| 20 | 전세이자 월세비교 | 2 | 8 | 25% |
| 21 | 2026년도 실업급여평균액수 | 2 | 3 | 66.7% |
| 22 | 야간근로계산기 | 2 | 3 | 66.7% |
| 23 | 국민연금 월 납부계산기 | 2 | 3 | 66.7% |
| 24 | 대출이율계산 예시 | 2 | 2 | 100% |
| 25 | 육아휴직 통상임금 계산기 | 2 | 2 | 100% |
| 26 | 국민연금 월 납부액 계산기 | 2 | 2 | 100% |
| 27 | 국민연금 월납부액 계산 | 2 | 2 | 100% |
| 28 | 주급계산기 | 1 | 2,269 | 0% |
| 29 | 연봉계산기 2026 | 1 | 1,533 | 0.1% |
| 30 | 카드수수료 계산기 | 1 | 483 | 0.2% |

### Naver 검색어 Top 30 — 최근 90일

| # | 검색어 | 클릭 | 노출 | CTR |
|---:|---|---:|---:|---:|
| 1 | 카드할부계산기 | 45 | 3,037 | 1.5% |
| 2 | 국민연금 납부 계산기 | 38 | 606 | 6.3% |
| 3 | 실업급여 계산기 4시간 | 26 | 114 | 22.8% |
| 4 | 차량 유지비 계산기 | 21 | 198 | 10.6% |
| 5 | 할부 수수료 계산기 | 18 | 1,323 | 1.4% |
| 6 | 통상임금 퇴직금 계산 | 18 | 352 | 5.1% |
| 7 | 알바 주급 계산기 | 17 | 1,841 | 0.9% |
| 8 | 육아휴직 통상임금 계산법 | 15 | 475 | 3.2% |
| 9 | 연봉별 국민연금 납부액 | 15 | 113 | 13.3% |
| 10 | 예상퇴직금계산 | 15 | 22 | 68.2% |
| 11 | 국민연금 납부액 계산 | 13 | 1,006 | 1.3% |
| 12 | 야간수당 계산기 | 10 | 2,524 | 0.4% |
| 13 | 카드수수료 계산기 | 10 | 1,201 | 0.8% |
| 14 | 예상퇴직금 계산 | 10 | 526 | 1.9% |
| 15 | 실업급여 계산기 6시간 | 10 | 364 | 2.7% |
| 16 | 퇴직금계산기 통상임금 | 10 | 29 | 34.5% |
| 17 | 통상임금 퇴직금 계산기 | 10 | 26 | 38.5% |
| 18 | 국민연금 월 납부액 계산 | 9 | 38 | 23.7% |
| 19 | 카드 할부 수수료 계산기 | 8 | 228 | 3.5% |
| 20 | 국민연금 공제 계산기 | 8 | 8 | 100% |
| 21 | 육아휴직 통상임금 계산기 | 7 | 11 | 63.6% |
| 22 | 할부계산기 | 6 | 3,047 | 0.2% |
| 23 | 원금균등상환 계산식 | 6 | 332 | 1.8% |
| 24 | 퇴직금 계산기 통상임금 | 6 | 14 | 42.9% |
| 25 | 2026년 8월 주휴수당 | 6 | 9 | 66.7% |
| 26 | 공급가액세액계산기 | 6 | 7 | 85.7% |
| 27 | 연봉계산기 2026 | 5 | 6,009 | 0.1% |
| 28 | 주급 주휴수당 | 5 | 568 | 0.9% |
| 29 | 청년미래적금 계산 | 5 | 402 | 1.2% |
| 30 | 4대보험 금액 기준 | 5 | 17 | 29.4% |

## 웹문서 보고 행 — 최근 30일

검색결과 화면에서 실제 제공된 26개 행만 기록한다.

| # | URL 경로 | 클릭 | 노출 | CTR |
|---:|---|---:|---:|---:|
| 1 | `/calculators/card-installment/` | 92 | 8,856 | 1.0% |
| 2 | `/calculators/social-insurance/` | 68 | 2,373 | 2.9% |
| 3 | `/calculators/unemployment/` | 43 | 3,028 | 1.4% |
| 4 | `/calculators/overtime-pay/` | 31 | 2,382 | 1.3% |
| 5 | `/calculators/savings/` | 19 | 2,064 | 0.9% |
| 6 | `/calculators/salary/` | 16 | 3,515 | 0.5% |
| 7 | `/calculators/labor-pay/` | 15 | 4,121 | 0.4% |
| 8 | `/calculators/loan/` | 12 | 910 | 1.3% |
| 9 | `/calculators/rent-vs-jeonse/` | 10 | 573 | 1.7% |
| 10 | `/calculators/youth-future-savings/` | 8 | 2,307 | 0.3% |
| 11 | `/calculators/severance/` | 8 | 965 | 0.8% |
| 12 | `/calculators/parental-leave/` | 6 | 255 | 2.4% |
| 13 | `/calculators/car-cost/` | 5 | 606 | 0.8% |
| 14 | `/calculators/training-certificate-cost/` | 4 | 233 | 1.7% |
| 15 | `/calculators/seller-margin/` | 3 | 260 | 1.2% |
| 16 | `/calculators/vat-profit/` | 3 | 148 | 2% |
| 17 | `/` | 3 | 45 | 6.7% |
| 18 | `/calculators/dsr/` | 2 | 132 | 1.5% |
| 19 | `/calculators/brokerage-fee/` | 0 | 55 | 0% |
| 20 | `/calculators/average-price/` | 0 | 39 | 0% |
| 21 | `/disclaimer/` | 0 | 7 | 0% |
| 22 | `/calculators/work-child-incentive/` | 0 | 6 | 0% |
| 23 | `/calculators/roas/` | 0 | 5 | 0% |
| 24 | `/methodology/` | 0 | 1 | 0% |
| 25 | `/calculators/` | 0 | 1 | 0% |
| 26 | `/updates/` | 0 | 1 | 0% |

## 웹문서 보고 행 — 최근 90일

검색결과 화면에서 실제 제공된 27개 행만 기록한다. seller-margin CTR은 화면 요약에서 확인되지 않아 기록하지 않았다.

| # | URL 경로 | 클릭 | 노출 | CTR |
|---:|---|---:|---:|---:|
| 1 | `/calculators/social-insurance/` | 233 | 7,538 | 3.1% |
| 2 | `/calculators/card-installment/` | 208 | 14,521 | 1.4% |
| 3 | `/calculators/unemployment/` | 200 | 12,441 | 1.6% |
| 4 | `/calculators/severance/` | 152 | 6,839 | 2.2% |
| 5 | `/calculators/salary/` | 91 | 13,223 | 0.7% |
| 6 | `/calculators/labor-pay/` | 90 | 16,850 | 0.5% |
| 7 | `/calculators/savings/` | 75 | 8,253 | 0.9% |
| 8 | `/calculators/overtime-pay/` | 70 | 5,649 | 1.2% |
| 9 | `/calculators/loan/` | 51 | 4,552 | 1.1% |
| 10 | `/calculators/car-cost/` | 50 | 1,849 | 2.7% |
| 11 | `/calculators/parental-leave/` | 48 | 1,942 | 2.5% |
| 12 | `/calculators/vat-profit/` | 40 | 2,426 | 1.6% |
| 13 | `/calculators/seller-margin/` | 31 | 1,956 | 미표시 |
| 14 | `/calculators/rent-vs-jeonse/` | 26 | 2,427 | 1.1% |
| 15 | `/calculators/youth-future-savings/` | 22 | 4,977 | 0.4% |
| 16 | `/calculators/dsr/` | 8 | 631 | 1.3% |
| 17 | `/calculators/training-certificate-cost/` | 6 | 391 | 1.5% |
| 18 | `/calculators/average-price/` | 5 | 668 | 0.7% |
| 19 | `/` | 4 | 69 | 5.8% |
| 20 | `/calculators/work-child-incentive/` | 3 | 514 | 0.6% |
| 21 | `/calculators/brokerage-fee/` | 0 | 92 | 0% |
| 22 | `/calculators/roas/` | 0 | 18 | 0% |
| 23 | `/disclaimer/` | 0 | 15 | 0% |
| 24 | `/methodology/` | 0 | 13 | 0% |
| 25 | `/updates/` | 0 | 3 | 0% |
| 26 | `/calculators/` | 0 | 2 | 0% |
| 27 | `/terms/` | 0 | 2 | 0% |

## SERP 의도·수정 전후

Naver 검색결과를 조회해 카드 할부, 청년미래적금, 주급/주휴수당, 연봉 실수령액 결과 유형을 확인했다. 순위는 검색어별·사용자별로 바뀔 수 있어 수치화하지 않았다.

| URL | 기존 title | 새 title | 기존 description 요약 | 새 description |
|---|---|---|---|---|
| `/calculators/card-installment/` | 카드 할부 계산기 \| 월별 수수료·총 납부액 계산 | 카드 할부 계산기 \| 수수료율 직접 입력·총 납부액 | 사용자가 금액·개월·연 수수료율을 입력해 월별 수수료와 총액을 추정한다고 안내 | 구매금액·할부 기간·연 수수료율을 직접 넣어 월별 수수료/총액을 추정하고, 실제 카드사별 요율과 부분 무이자는 반영하지 않는다고 명시 |
| `/calculators/youth-future-savings/` | 청년미래적금 계산기 \| 정부기여금·만기 예상금액 | 2026 청년미래적금 계산기 \| 정부기여금·만기 예상금액 | 월 납입·연 이자율·정부기여금 유형, 한도/기간/비과세 기준을 안내 | 월 납입·예상 금리로 3년 만기 추정, 월 50만원 및 일반 6%/우대 12%를 참고값으로 명시하고 가입 자격은 판정하지 않는다고 설명 |

청년미래적금 문구는 금융위원회의 2026-09-16 2차 신청 안내에 공개된 현재 상품 기준을 사용했다. 발표 자료의 2027년 기여금 인상은 제안이며 현행 확정 조건으로 쓰지 않았다.

### 제외한 고노출 후보

- `/calculators/labor-pay/`: 최근 30일 4,121 노출, CTR 0.4%; `주급계산기` 2,269 노출/0%가 보였지만 URL-검색어의 정확한 귀속은 확인하지 못했다. 현재 페이지 제목은 2026 알바 주급·주휴수당, 시급·근무시간 기준을 이미 설명하고 Naver URL 검사도 정상 메타/접근으로 응답했다. 수정 전 근거가 불충분해 보류.
- `/calculators/salary/`: 최근 30일 3,515 노출/CTR 0.5%; 검색결과의 연봉계산 의도와 2026·세후 예상액 설명이 일치했고 입력 조건도 맞았다. 제목을 교체할 불일치 증거가 없어 보류.
- `/calculators/unemployment/`: 최근 30일 3,028 노출/CTR 1.4%; 실업급여 계산·시간 조건 검색과 현재 설명이 맞았다. 낮은 CTR만으로 메타 오류를 추정하지 않아 보류.
- `/calculators/overtime-pay/`: 2,382 노출/1.3%; 이 작업에서 URL 검사/SERP상 불일치 근거를 확보하지 못해 변경하지 않았다.

## 기술 SEO 및 Search Advisor 상태

- Production 검토한 URL 검사: `card-installment`, `labor-pay`, `salary`, `youth-future-savings` 모두 Naver URL 검사에서 `200-OK`, robots 허용, robots meta의 크롤링/색인 허용, title/description/OG 추출을 보였다. 이는 URL 검사 진단일 뿐 색인·노출 보장이 아니다.
- `/robots.txt`: HTTP 200, `/sitemap.xml` 및 `/sitemap-knowledge.xml` Sitemap 지시문을 각각 1회 제공. 검색 크롤러 접근을 막는 신규 규칙은 확인되지 않았다.
- `/sitemap.xml`: HTTP 200, 기존 공개 사이트 URL 30개.
- `/sitemap-knowledge.xml`: HTTP 200, 공개 질문 URL 228개.
- Naver 사이트 진단(최근 화면 갱신 2026-10-21, 90일 분류): 색인된 페이지 29, 수집 제한 0, 제외 0, SEO 오류 0. 크롤링 리포트(2026-10-23)는 숫자형 크롤링 상세가 화면에 노출되지 않았다.
- Naver Sitemap 표에는 `sitemap-knowledge.xml`(2026-10-08 13:57:24) 및 `sitemap.xml`(2026-08-09 13:16:58) 등록 기록이 보였지만 상태/가져온 URL 수 필드는 이 화면에서 확인되지 않았다.
- 검토한 Production 메타데이터는 페이지별 title/description, 자기 자신을 가리키는 canonical, 인덱스 허용 상태였다. 변경 범위 밖 전 페이지의 고유성/링크 감사를 완료했다고 주장하지 않는다.
- 네이버 URL 검사 가이드와 검색 콘텐츠 가이드에 따라 제목·설명은 실제 기능을 명확하게 설명하며 관련 없는 키워드/과장 표현을 넣지 않았다.

## 코드 변경 및 검증

변경 파일:

1. `app/calculators/card-installment/page.tsx` — title/description만 수정.
2. `app/calculators/youth-future-savings/page.tsx` — title/description만 수정.
3. `tests/card-installment.test.mjs` — 실제 직접입력·무이자 조건 미반영 문구 회귀 확인.
4. `tests/youth-future-savings.test.mjs` — 2026 기준·기간·비율·자격 자동판정 제외 회귀 확인.

| 검증 | 결과 |
|---|---|
| 카드 할부 + 청년미래적금 관련 테스트 | 27/27 PASS |
| 전체 npm test 기준선 `dbda7ee` | 1,069 total / 1,059 pass / 10 fail |
| 전체 npm test 변경 브랜치 | 1,071 total / 1,061 pass / 10 fail (기준선과 실패 파일 동일; 추가 테스트 2개 통과) |
| 변경 파일 ESLint | PASS, 오류 0 |
| TypeScript | PASS |
| Next build / static export / Cloudflare Pages static verification / publisher audit | PASS; publisher audit: 30 indexable URL, 21 calculators, broken internal link 0, duplicate metadata 0 |
| `git diff --check` | PASS |

기준선에서 반복된 실패 10건은 변경 브랜치에도 그대로 재현됐다: 운영 source placeholder 문구 검색, 정적 route 검사에서 `/knowledge/` route 검출, 관련 질문 fixture 기대값, Knowledge Worker 보안 테스트 파일 7개. 변경 대상 두 페이지 테스트는 통과했고 새 실패는 없었다.

## Preview 검증 및 최종 운영 검증

### Preview

- Cloudflare Pages 최종 Preview deployment `a0182865-0937-4fa0-b408-71eb51a8066c`, commit `f85696b93e0e535272bc4bb6de75cc39babcd9d4`, `commit_dirty=false`, 배포 성공. UI/실측은 코드가 동일한 직전 Preview에서도 검증했다.
- [카드 할부 계산기 Preview](https://a0182865.integrated-calculator.pages.dev/calculators/card-installment/)와 [청년미래적금 계산기 Preview](https://a0182865.integrated-calculator.pages.dev/calculators/youth-future-savings/) 모두 HTTP 브라우저 렌더를 확인했다.
- 각 페이지의 초기 문서 title/description, Production canonical, H1이 정상이고 title/description이 초기 HTML에서 확인됐다. 계산기 화면/본문과 링크는 기존 그대로다.
- 모바일 overflow 실측: 두 URL 모두 1440×900에서 `scrollWidth=clientWidth=1425`(browser layout viewport 실제 폭 기준), 390×844에서 `390=390`, 360×800에서 `360=360`. 1440 desktop 기준 viewport 요청 폭은 1440px이며 실제 document client width 1425px(스크롤바 제외)였다.
- browser console error 0, `Runtime.exceptionThrown` 0.
- `2026 청년미래적금` 문구 기준은 금융위원회 2026-09-16 발표의 2026년 10월 7일 2차 모집 기준이다. 차기 2027년 인상 언급은 확정 기준으로 포함하지 않았다.

### 운영 반영

운영 반영은 사용자 지시서의 승인 범위에서 진행했다.

- main/origin/main은 ff-only 반영 후 `f85696b93e0e535272bc4bb6de75cc39babcd9d4`로 일치했다. 승격 전 main 대 branch ahead/behind는 `0/2`, merge-base는 `dbda7ee560438b3e94be70044e48517551cf8906`이었다.
- Cloudflare Pages Production deployment `abe59ffa-96df-4488-985c-818461b04098`는 success, Source SHA `f85696b93e0e535272bc4bb6de75cc39babcd9d4`, `commit_dirty=false`.
- Production에서 카드 할부·청년미래적금 페이지 모두 초기 HTML title/description, 자기 자신을 가리키는 Production canonical, 기존 H1을 확인했다. 두 URL 모두 HTTP 200.
- 운영 브라우저 폭 검사: 1440×900에서 각 페이지 `scrollWidth=clientWidth=1425`(수직 스크롤바 제외), 390×844에서 `390=390`, 360×800에서 `360=360`. 가로 overflow 없음.
- 두 페이지 browser console error 0, CDP `Runtime.exceptionThrown` 0.
- 회귀 URL GET 결과: `/`, `/calculators/labor-pay/`, `/knowledge/`, `/robots.txt`, `/sitemap.xml`, `/sitemap-knowledge.xml` 모두 HTTP 200.
- Knowledge Worker, D1, Pages env vars, binding, Access, ads, public/index/admin/import gate는 변경하지 않았다. D1 write/schema/migration 및 Worker 배포도 없었다.
- 방문자 페이지 주소는 변경하지 않았다.

| 항목 | 값 |
|---|---|
| 작업 브랜치 | `codex/naver-ctr-seo-261023-001` |
| Preview 검증 SHA | `49e365eb3268ad8a6992e6d349f22386c1deb40a` |
| Preview deployment | `a0182865-0937-4fa0-b408-71eb51a8066c` (success, clean) |
| Preview alias | `https://codex-naver-ctr-seo-261023-0.integrated-calculator.pages.dev` |
| Production code release SHA | `f85696b93e0e535272bc4bb6de75cc39babcd9d4` |
| Production deployment | `abe59ffa-96df-4488-985c-818461b04098` (success, clean) |
| Production Source / `commit_dirty` | `f85696b93e0e535272bc4bb6de75cc39babcd9d4` / `false` |
| Production runtime / 회귀 | 수정 URL·홈·대표 계산기·Knowledge·robots·sitemap PASS; console/pageerror 0 |
| 기존 URL 변경 | 없음 |
| Worker/D1/환경변수/gate 변경 | 0 |

## 14일·28일 성과 측정 기준

배포 후 Naver 리포트가 갱신된 뒤 동일 사이트 속성·PC+Mobile 결합·최근 30일 조건으로 확인한다. 개별 대상 URL의 클릭, 노출, CTR을 변경 전후로 비교하고, 구성 검색어가 달라졌는지 함께 기록한다. 기기별 세분 지표가 보고서에서 제공되지 않으면 결합 지표만 보고한다.

| 대상 | 변경 전 30일 클릭 | 변경 전 30일 노출 | 변경 전 CTR | 변경일 / SHA | 14일 검토 | 28일 검토 |
|---|---:|---:|---:|---|---|---|
| `/calculators/card-installment/` | 92 | 8,856 | 1.0% | 최종 배포 후 기록 | 대기 | 대기 |
| `/calculators/youth-future-savings/` | 8 | 2,307 | 0.3% | 최종 배포 후 기록 | 대기 | 대기 |

CTR의 증감은 percentage-point로 계산하며 노출수/검색어 구성이 달라지면 별도로 설명한다. 이번 배포 후 수치만으로 인과효과나 순위 상승을 단정하지 않는다.

## 공식 근거 및 참고

- [네이버 검색 콘텐츠 작성 가이드](https://searchadvisor.naver.com/guide/content-basic)
- [네이버 URL 검사 가이드](https://searchadvisor.naver.com/guide/url-inspection)
- [네이버 SEO 기본 안내](https://searchadvisor.naver.com/guide/seo-basic-intro)
- [금융위원회: 청년미래적금 2차 가입신청 안내 (2026-09-16)](https://www.fsc.go.kr/edu/news/87854)
- [금융위원회: 청년미래적금 상품 출시 안내 (2026-06-22)](https://www.fsc.go.kr/po010101/87158)
