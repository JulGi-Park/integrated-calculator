# 계산박스 AdSense Final Freeze Gate — 2026-08-24

## A. Git

- Base SHA: `e67ca94475aebf5683553a6c8cfb43d3f10e308e`
- Branch: `codex/average-price-final-freeze-260824`
- Implementation SHA: `a850db0525f488f55aebfdef15aeb2c44fd1cd56`
- Merge/final main SHA: 이 문서를 포함하는 최종 커밋 이후 확정되므로 작업 종료 보고서의 Freeze 기준점에 기록한다.

## B. Production

- 대상: `https://gyesanbox.kr`
- Cloudflare deployment ID, source SHA, KST 반영 시각은 최종 main 배포 후 작업 종료 보고서의 Freeze 기준점에 기록한다.
- 문서가 자기 자신을 포함하는 Git SHA와 이후 생성되는 Cloudflare 배포 ID를 미리 포함할 수 없으므로, 이 문서와 최종 보고서를 한 세트의 감사 기록으로 사용한다.

## C. Average Price

### 기존 기능

- 현재 보유 수량과 평균단가
- 추가매수 수량과 단가
- 선택 현재가
- 새 평균단가, 총 투입원금, 현재가 기준 예상 손익

### 신규 기능

- 추가매수 전후의 수량·평균단가·총 투입원금 비교
- 평균단가 변화액과 기존 평단 대비 변화율
- 현재가에서 기존·신규 평균매입단가까지 필요한 가격 변화율
- 사용자 입력 순서를 유지하는 시나리오 A·B 비교
- 결과 의미, 적용 공식, 영향 입력, 실제 자료 확인사항, 차이 원인 안내

### 공식

```text
새 평균단가 = (기존 총매입금액 + 추가매입금액) ÷ (기존 수량 + 추가수량)
평균단가 변화율 = (새 평균단가 - 기존 평균단가) ÷ 기존 평균단가 × 100
현재가에서 평균단가까지 필요한 가격 변화율 = (평균단가 - 현재가) ÷ 현재가 × 100
```

### 시나리오

- A는 기존 기본 입력이다.
- B는 사용자가 수량과 단가를 모두 입력했을 때만 계산한다.
- 추천값을 만들지 않고 A·B 입력 순서를 유지한다.
- 추가 투입금, 새 평균단가, 평단 변화율, 총 투입원금과 현재가 기준 변화율을 비교한다.

### 결과 해석 및 투자 조언 차단

- 평균단가가 낮아지는 경우·높아지는 경우·같은 경우를 모두 구분한다.
- 총 투입원금 증가를 평균단가 변화와 함께 표시한다.
- 회복 가능성, 수익 확률, 최적 조건, 매수 권유를 제공하지 않는다.
- 수수료, 세금, 환율과 실제 체결 가격 차이를 포함하지 않았음을 표시한다.

### 최종 가치 등급

- `/calculators/average-price/`: A

## D. 전체 가치 등급

- A: 16
- B: 5
- C: 0

## E. Search regression

- `물타기`: 물타기 계산기 노출
- `평단`: 물타기 계산기 노출
- `평균단가`: 물타기 계산기 노출
- `퇴사`, `대출 한도`, `알바`, `전세`: 기존 결과 유지
- 검색 URL, query, hash 신규 생성 없음

## F. Crawler

`ADSENSE_CRAWLER_LOG_NOT_AVAILABLE`

- 저장소와 현재 접근 가능한 Cloudflare Pages 배포 정보에는 요청별 User-Agent, URL, timestamp, HTTP status를 보존한 과거 접근 로그가 없다.
- `Mediapartners-Google`, `Google-Display-Ads-Bot` 자연 접근 이력을 확인할 수 없었다.
- fake bot 요청, User-Agent 위조, 인위적 광고 요청은 수행하지 않았다.
- crawler 확인 불가는 승인 또는 Freeze 차단 조건으로 사용하지 않는다.

## G. SEO

- Public: 30
- Indexable: 30
- Sitemap: 30
- Calculators: 21
- Canonical: `https://gyesanbox.kr/calculators/average-price/`
- Broken internal links: 0
- Duplicate metadata: 0
- Search Console: URL 등록됨, 페이지 색인 생성됨, 가져오기 성공, 색인 허용, 자기 canonical
- Search Console 최근 crawl: 2026-08-17 12:52:34 KST, Googlebot 스마트폰

## H. AdSense

- `/` 및 검수된 계산기 상세: ADS_ALLOWED
- `/calculators/`, 방법론·정책·404: ADS_BLOCKED
- SPA: HOME → AVERAGE_PRICE 1, AVERAGE_PRICE → CALCULATORS 0, CALCULATORS → AVERAGE_PRICE 1, AVERAGE_PRICE → METHODOLOGY 0
- 광고 위치·설정 변경, 광고 클릭, AdSense 재신청: 수행하지 않음

## I. Tests

- `npm ci`: 397 packages, vulnerabilities 0
- lint: PASS
- typecheck: PASS
- tests: 986/986 PASS
- production build: PASS, static routes 36
- publisher audit: PASS
- similarity audit: 최고 0.89%, 35자 이상 3개 계산기 반복 문장 0
- local browser desktop/mobile: PASS
- 390×844: document 375px, 가로 page overflow 없음, 비교표는 297px 컨테이너 내부 520px 가로 스크롤
- Search regression and AdSense SPA: PASS

## J. Final Freeze 상태

- 조건: C 0, P0 0, P1 0, 신규 URL 0, 광고 경계 정상, Production 검증 PASS
- Freeze 이후 허용 수정: P0 버그, 계산 오류, 정책상 잘못된 수치, broken page, security 문제, 실제 기능 장애
- Freeze 이후 금지: 신규 계산기, URL/광고 구조 변경, 대규모 콘텐츠·홈·방법론·검색 개편
- AdSense 재신청은 이 작업에서 수행하지 않는다.
