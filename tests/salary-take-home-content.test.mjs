import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { metadata } from "../app/calculators/salary/page.tsx";
import { serializeJsonLd } from "../components/common/JsonLdScripts.tsx";
import {
  salaryTakeHomeBreadcrumbJsonLd,
  salaryTakeHomeCalculationCriteria,
  salaryTakeHomeExampleInput,
  salaryTakeHomeExampleInputItems,
  salaryTakeHomeExampleResultItems,
  salaryTakeHomeExclusions,
  salaryTakeHomeFaqJsonLd,
  salaryTakeHomeFaqs,
  salaryTakeHomeSources,
  salaryTakeHomeWebApplicationJsonLd,
} from "../components/calculators/salaryTakeHomeContentData.ts";
import { calculateSalaryTakeHome } from "../lib/calculators/salary-take-home/salary-take-home.ts";
import { SALARY_TAKE_HOME_POLICY_2026 } from "../lib/calculators/salary-take-home/policy.ts";

const pageSource = await readFile(
  "app/calculators/salary/page.tsx",
  "utf8",
);
const contentSource = await readFile(
  "components/calculators/SalaryTakeHomeContent.tsx",
  "utf8",
);
const dataSource = await readFile(
  "components/calculators/salaryTakeHomeContentData.ts",
  "utf8",
);

test("연봉 계산기 전용 SEO 메타데이터를 대표 URL 기준으로 설정한다", () => {
  const expectedTitle =
    "2026 연봉 실수령액 계산기 | 월급·4대보험·소득세 계산";
  const expectedDescription =
    "연봉과 비과세액, 공제대상 가족 수를 입력해 2026년 국민연금·건강보험·고용보험·소득세를 반영한 월급 실수령액을 계산합니다.";
  const expectedOgTitle = "연봉 실수령액 계산기 - 세금 공제 후 실제 월급 확인";
  const expectedOgDescription =
    "연봉을 입력하면 국민연금, 건강보험, 고용보험, 소득세 등을 반영해 예상 월 실수령액을 확인할 수 있습니다.";
  const expectedOgImage = "https://gyesanbox.kr/og/salary.png";

  assert.equal(metadata.title, expectedTitle);
  assert.equal(metadata.description, expectedDescription);
  assert.deepEqual(metadata.robots, { index: true, follow: true });
  assert.equal(metadata.openGraph.title, expectedOgTitle);
  assert.equal(metadata.openGraph.description, expectedOgDescription);
  assert.equal(metadata.openGraph.type, "website");
  assert.equal(metadata.openGraph.url, "https://gyesanbox.kr/calculators/salary/");
  assert.deepEqual(metadata.openGraph.images, [
    {
      url: expectedOgImage,
      width: 1200,
      height: 630,
      alt: expectedOgTitle,
    },
  ]);
  assert.equal(metadata.twitter.card, "summary_large_image");
  assert.equal(metadata.twitter.title, expectedOgTitle);
  assert.equal(metadata.twitter.description, expectedOgDescription);
  assert.deepEqual(metadata.twitter.images, [expectedOgImage]);
  assert.deepEqual(metadata.alternates, {
    canonical: "https://gyesanbox.kr/calculators/salary/",
  });

  const metadataText = JSON.stringify(metadata);
  assert.doesNotMatch(
    metadataText,
    /localhost|127\.0\.0\.1|pages\.dev|example\.com|www\.gyesanbox\.kr/,
  );
});

test("페이지 상단은 H1 하나와 정책 연도·기준일·예상값 안내를 표시한다", () => {
  assert.equal((pageSource.match(/<h1/g) ?? []).length, 1);
  assert.match(pageSource, /연봉 실수령액 계산기/);
  assert.match(pageSource, /적용 정책:/);
  assert.match(pageSource, /기준 확인일:/);
  assert.match(pageSource, /예상값입니다/);
});

test("실제 엔진과 일치하는 11개 계산 기준을 정적으로 표시한다", () => {
  assert.equal(salaryTakeHomeCalculationCriteria.length, 11);
  assert.match(contentSource, /salaryTakeHomeCalculationCriteria\.map/);

  for (const { title, description } of salaryTakeHomeCalculationCriteria) {
    assert.ok(title.length > 0);
    assert.ok(description.length > 0);
  }

  for (const title of [
    "월 급여",
    "월 과세 급여",
    "국민연금",
    "건강보험",
    "장기요양보험",
    "고용보험",
    "근로소득세",
    "지방소득세",
    "월 공제 합계",
    "월 예상 실수령액",
    "연간 예상 실수령액",
  ]) {
    assert.ok(
      salaryTakeHomeCalculationCriteria.some((item) => item.title === title),
    );
  }
});

test("고정 계산 예시는 확정 금액과 현재 엔진 결과가 모두 일치한다", () => {
  assert.deepEqual(salaryTakeHomeExampleInput, {
    annualSalary: 50_000_000,
    monthlyNonTaxableAmount: 200_000,
    dependentCount: 1,
    childCount: 0,
  });
  assert.deepEqual(salaryTakeHomeExampleInputItems, [
    { label: "연봉", value: "50,000,000원" },
    { label: "월 비과세액", value: "200,000원" },
    { label: "공제대상 가족 수", value: "1명" },
    { label: "간이세액표상 자녀 수", value: "0명" },
  ]);
  assert.deepEqual(salaryTakeHomeExampleResultItems, [
    { label: "월 급여", value: "4,166,666원" },
    { label: "월 비과세액", value: "200,000원" },
    { label: "월 과세 급여", value: "3,966,666원" },
    { label: "국민연금", value: "188,380원" },
    { label: "건강보험", value: "142,601원" },
    { label: "장기요양보험", value: "18,738원" },
    { label: "고용보험", value: "35,699원" },
    { label: "소득세", value: "190,620원" },
    { label: "지방소득세", value: "19,060원" },
    { label: "월 공제 합계", value: "595,098원" },
    { label: "월 예상 실수령액", value: "3,571,568원" },
    { label: "연간 예상 실수령액", value: "42,858,816원" },
  ]);

  assert.deepEqual(calculateSalaryTakeHome(salaryTakeHomeExampleInput), {
    success: true,
    data: {
      monthlyGrossSalary: 4_166_666,
      monthlyTaxableSalary: 3_966_666,
      nationalPension: 188_380,
      healthInsurance: 142_601,
      longTermCareInsurance: 18_738,
      employmentInsurance: 35_699,
      incomeTax: 190_620,
      localIncomeTax: 19_060,
      totalMonthlyDeductions: 595_098,
      estimatedMonthlyTakeHome: 3_571_568,
      estimatedAnnualTakeHome: 42_858_816,
      policyYear: 2026,
      policyVerifiedAt: "2026-06-19",
    },
  });

  assert.match(dataSource, /calculateSalaryTakeHome\(/);
  assert.match(dataSource, /if \(!salaryTakeHomeExampleResponse\.success\)/);
  assert.doesNotMatch(contentSource, /3,571,568|42,858,816|595,098/);
});

test("결과 해석·제외 항목·면책 문구를 제공한다", () => {
  for (const text of [
    "월 예상 실수령액",
    "연간 예상 실수령액",
    "저소득 구간",
    "기준소득월액 상한",
    "실제\\s+신고 보수월액",
  ]) {
    assert.match(contentSource, new RegExp(text));
  }

  assert.equal(salaryTakeHomeExclusions.length, 19);
  assert.match(contentSource, /salaryTakeHomeExclusions\.map/);
  assert.match(contentSource, /급여명세서, 세무 신고나 기관의/);
});

test("공식 기관 출처와 확인일을 표시한다", () => {
  assert.equal(salaryTakeHomeSources.length, 7);
  assert.match(contentSource, /salaryTakeHomeSources\.map/);
  assert.match(contentSource, /target="_blank" rel="noopener noreferrer"/);

  for (const source of salaryTakeHomeSources) {
    assert.match(
      source.href,
      /^https:\/\/(www\.)?(nps\.or\.kr|nhis\.or\.kr|law\.go\.kr|nts\.go\.kr)\//,
    );
    assert.ok(source.organization.length > 0);
    assert.ok(source.title.length > 0);
    assert.ok(source.criterion.length > 0);
  }
});

test("FAQ는 요구된 8개 질문을 정확한 순서로 한 곳에서 관리한다", () => {
  const expectedQuestions = [
    "연봉에 퇴직금이 포함되나요?",
    "공제대상 가족 수에는 본인도 포함하나요?",
    "자녀 수는 어떤 기준으로 입력하나요?",
    "비과세액은 얼마를 입력해야 하나요?",
    "실제 급여명세서와 결과가 다른 이유는 무엇인가요?",
    "상여금과 성과급도 계산되나요?",
    "국민연금 상한을 넘는 연봉은 어떻게 계산되나요?",
    "2026년 7월 국민연금 기준이 변경되면 자동 반영되나요?",
  ];

  assert.deepEqual(
    salaryTakeHomeFaqs.map((faq) => faq.question),
    expectedQuestions,
  );
  assert.match(contentSource, /salaryTakeHomeFaqs\.map/);
  assert.match(contentSource, /<details/);
});

test("국민연금 정책값과 7월 변경 안내는 정책 모듈을 단일 출처로 사용한다", () => {
  assert.match(dataSource, /SALARY_TAKE_HOME_POLICY_2026/);
  assert.match(contentSource, /SALARY_TAKE_HOME_POLICY_2026/);
  assert.match(contentSource, /2026년 7월 1일부터 기준이 변경될 예정/);
  assert.match(contentSource, /자동 반영되지 않습니다/);

  const faq = salaryTakeHomeFaqs.at(-1).answer;
  assert.match(faq, /자동 반영되지 않습니다/);
  assert.match(faq, /2026년 6월 19일/);
  assert.match(faq, /2026년 6월 30일/);
  assert.equal(SALARY_TAKE_HOME_POLICY_2026.verifiedAt, "2026-06-19");
});

test("관련 계산기는 구현된 내부 라우트만 활성 링크로 제공한다", () => {
  assert.match(contentSource, /href="\/calculators\/social-insurance\/"/);
  assert.match(contentSource, /href="\/calculators\/labor-pay\/"/);
  assert.match(contentSource, /href="\/calculators\/severance\/"/);
  assert.match(contentSource, /href="\/calculators\/unemployment\/"/);
  assert.doesNotMatch(
    contentSource,
    /href="(?:#|javascript:|\/calculators\/(?:retirement|coming-soon))/,
  );
});

test("WebApplication, BreadcrumbList와 FAQPage JSON-LD가 안전하다", () => {
  const items = [
    salaryTakeHomeWebApplicationJsonLd,
    salaryTakeHomeBreadcrumbJsonLd,
    salaryTakeHomeFaqJsonLd,
  ];

  assert.deepEqual(
    items.map((item) => item["@type"]),
    ["WebApplication", "BreadcrumbList", "FAQPage"],
  );
  assert.equal(
    salaryTakeHomeWebApplicationJsonLd.applicationCategory,
    "FinanceApplication",
  );
  assert.deepEqual(
    salaryTakeHomeBreadcrumbJsonLd.itemListElement.map((item) => item.name),
    ["홈", "계산기 목록", "연봉 실수령액 계산기"],
  );
  assert.deepEqual(
    salaryTakeHomeBreadcrumbJsonLd.itemListElement.map((item) => item.item),
    [
      "https://gyesanbox.kr/",
      "https://gyesanbox.kr/calculators/",
      "https://gyesanbox.kr/calculators/salary/",
    ],
  );

  for (const item of items) {
    const serialized = serializeJsonLd(item);
    assert.deepEqual(JSON.parse(serialized), item);
    assert.doesNotMatch(
      serialized,
      /aggregateRating|review|offers|NaN|Infinity|undefined|localhost|127\.0\.0\.1|pages\.dev|판매자 마진/,
    );
  }
});

test("화면 FAQ와 FAQPage JSON-LD의 질문·답변·순서가 일치한다", () => {
  assert.equal(
    salaryTakeHomeFaqJsonLd.mainEntity.length,
    salaryTakeHomeFaqs.length,
  );

  for (const [index, faq] of salaryTakeHomeFaqs.entries()) {
    assert.equal(salaryTakeHomeFaqJsonLd.mainEntity[index].name, faq.question);
    assert.equal(
      salaryTakeHomeFaqJsonLd.mainEntity[index].acceptedAnswer.text,
      faq.answer,
    );
  }
});

test("페이지는 공통 출력 컴포넌트로 JSON-LD 세 종류를 렌더링한다", () => {
  assert.match(pageSource, /<JsonLdScripts items=\{jsonLdItems\}/);
  assert.match(pageSource, /salaryTakeHomeWebApplicationJsonLd/);
  assert.match(pageSource, /salaryTakeHomeBreadcrumbJsonLd/);
  assert.match(pageSource, /salaryTakeHomeFaqJsonLd/);
  assert.match(pageSource, /<SalaryTakeHomeContent \/>/);
});
