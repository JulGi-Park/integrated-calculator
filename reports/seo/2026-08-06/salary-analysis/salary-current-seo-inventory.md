# 연봉 실수령액 계산기 현재 SEO 인벤토리

- 분석 URL: `https://gyesanbox.kr/calculators/salary/`
- 소스-공개 페이지 확인일: 2026-08-06
- 공개 렌더링 URL: `https://gyesanbox.kr/calculators/salary/`
- 소스와 공개 렌더링의 title, description, canonical, H1, FAQ 및 JSON-LD 유형: 일치

## 실제 파일과 역할

| 파일 | 역할 |
|---|---|
| `app/calculators/salary/page.tsx` | 페이지 조합, metadata, canonical, Open Graph, Twitter, H1/도입부 |
| `components/calculators/SalaryTakeHomeCalculator.tsx` | 입력 폼·결과 UI. 연봉, 월 비과세액, 공제대상 가족 수, 자녀 수 입력 |
| `components/calculators/SalaryTakeHomeContent.tsx` | 안내 본문, 결과 해석, 기준소득월액 설명, FAQ·관련 계산기 영역 |
| `components/calculators/salaryTakeHomeContentData.ts` | 계산 기준, FAQ, 공식 출처, WebApplication/BreadcrumbList/FAQPage JSON-LD |
| `lib/seo/publicCalculatorSeo.ts` | 공유 title·description 및 지원 검색어 정의 |
| `lib/calculators/salary-take-home/policy.ts` | 2026년 계산 정책과 확인일·국민연금 기준소득월액 범위 |

## 메타데이터

- title: `2026 연봉 실수령액 계산기 | 월급·비과세액·공제 후 금액`
- meta description: `연봉을 월급으로 환산하고 월 비과세액과 가족·자녀 수를 입력해 소득세와 사회보험료를 뺀 예상 월·연 실수령액과 공제 내역을 확인하세요.`
- canonical: `https://gyesanbox.kr/calculators/salary/`
- Open Graph title: `연봉 실수령액 계산기 | 월급·비과세액·공제 후 금액`
- Open Graph description: 연봉→월급 환산, 월 비과세액·가족·자녀 수 입력, 세금·사회보험료 공제 후 월·연 실수령액 확인
- Twitter title/description: Open Graph와 동일한 내용
- 적용 연도: 2026. 정책 파일의 확인일은 2026-07-11이며 국민연금 기준소득월액 적용 기간도 명시되어 있음.

## 화면 콘텐츠

- H1: `연봉 실수령액 계산기`
- 첫 화면: 연봉을 월급으로 환산하고, 월 비과세액·가족·자녀 수를 입력해 월·연 실수령액과 공제 내역을 보는 계산기임을 설명. 계약상 월급과 기준소득월액이 다를 수 있다는 안내 포함.
- 입력 안내: 퇴직금을 제외한 세전 연봉, 매월 급여에 포함된 비과세액, 가족·자녀 수를 구분해 설명.
- 결과 해석: 월·연 실수령액, 공제 영향, 실제 급여명세서와 달라질 수 있는 원인을 안내.
- 기준소득월액: `기준소득월액과 실수령액은 왜 다른가요?` 전용 H2, 계약상 월급·과세 급여, 국민연금 기준소득월액, 건강보험·고용보험 보수 구분, 400만원/20만원 비과세 예시 포함.
- 2026년 계산 기준: 국민연금·건강보험·장기요양·고용보험·소득세·지방소득세의 계산 기준과 상·하한, 결과 해석을 제시.
- FAQ: 11개. 비과세액, 급여명세서 차이, 상여금·성과급 제외, 기준소득월액, 월급 공제액, 4대보험 계산기 차이, 국민연금 상한을 포함.
- 내부 링크: `2026 4대보험 계산기`, `주휴수당 계산기`, `퇴직금 계산기`, `실업급여 계산기`.

## 구조화 데이터

- WebApplication: 화면의 계산기명·입력값·예상 결과 설명과 일치.
- BreadcrumbList: 홈 → 계산기 → 연봉 실수령액 계산기 경로와 canonical URL을 사용.
- FAQPage: 화면에 표시되는 11개 FAQ와 같은 질문·답변 데이터에서 생성됨.
- 화면에 없는 질문이나 2027년 기준을 JSON-LD에만 넣은 항목: 없음.

## 렌더링 결론

브라우저에서 title, description, canonical, H1, 입력 라벨, 11개 FAQ, WebApplication/BreadcrumbList/FAQPage를 확인했다. 모바일 전용 화면을 별도로 계측하지는 않았지만, 첫 화면의 계산 목적과 핵심 입력 필드는 렌더링 DOM에서 즉시 확인된다.
