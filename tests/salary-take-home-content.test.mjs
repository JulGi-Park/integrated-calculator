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
const policySource = await readFile(
  "lib/calculators/salary-take-home/policy.ts",
  "utf8",
);

test("연봉 계산기 전용 SEO 메타데이터를 대표 URL 기준으로 설정한다", () => {
  const expectedTitle =
    "2026 연봉 실수령액 계산기 | 월급·4대보험·세금 공제 후 예상액";
  const expectedDescription =
    "연봉을 입력하면 월급으로 환산하고 월 비과세액·가족·자녀 수를 반영해 4대보험과 소득세·지방소득세 공제 후 예상 월·연 실수령액을 확인하세요.";
  const expectedOgTitle =
    "2026 연봉 실수령액 계산기 | 월급·4대보험·세금 공제 후 예상액";
  const expectedOgDescription =
    "연봉을 입력하면 월급으로 환산하고 월 비과세액·가족·자녀 수를 반영해 4대보험과 소득세·지방소득세 공제 후 예상 월·연 실수령액을 확인하세요.";
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
  assert.equal((pageSource.match(/<CompactCalculatorHero\b/g) ?? []).length, 1);
  assert.match(pageSource, /2026 연봉 실수령액 계산기/);
  assert.match(pageSource, /4대보험과 소득세·지방소득세/);
  assert.match(pageSource, /기준소득월액은 다를 수/);
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
      policyVerifiedAt: "2026-07-11",
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

test("기준소득월액과 실수령액의 역할을 독립적으로 구분해 설명한다", () => {
  assert.match(contentSource, /기준소득월액과 실수령액은 왜 다른가요/);
  assert.match(contentSource, /계약상 월급과 과세 대상 급여/);
  assert.match(contentSource, /국민연금 기준소득월액/);
  assert.match(contentSource, /건강보험·고용보험의 보수/);
  assert.match(contentSource, /월 급여가 400만원/);
  assert.match(contentSource, /380만원은 국민연금 기준소득월액이나 실수령액이라는/);
  assert.doesNotMatch(contentSource, /기준소득월액에서 공제액을 바로 빼/);
});

test("공식 기관 출처와 확인일을 표시한다", () => {
  assert.equal(salaryTakeHomeSources.length, 7);
  assert.match(contentSource, /salaryTakeHomeSources\.map/);
  assert.match(contentSource, /target="_blank" rel="noopener noreferrer"/);

  assert.equal(
    salaryTakeHomeSources.find((source) => source.organization === "국세청")
      ?.href,
    "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7862&mi=6426",
  );

  assert.equal(
    salaryTakeHomeSources.find(
      (source) => source.organization === "국민건강보험공단",
    )?.href,
    "https://www.nhis.or.kr/static/html/wbdb/f/wbdbf0501.html",
  );
  assert.equal(
    salaryTakeHomeSources.find(
      (source) => source.organization === "고용노동부",
    )?.href,
    "https://www.moel.go.kr/info/astmgmt/employ/employList.do",
  );

  for (const source of salaryTakeHomeSources) {
    assert.match(
      source.href,
      /^https:\/\/(www\.)?(nps\.or\.kr|nhis\.or\.kr|law\.go\.kr|nts\.go\.kr|moel\.go\.kr)\//,
    );
    assert.ok(source.organization.length > 0);
    assert.ok(source.title.length > 0);
    assert.ok(source.criterion.length > 0);
  }
});

test("FAQ는 요구된 질문을 정확한 순서로 한 곳에서 관리한다", () => {
  const expectedQuestions = [
    "연봉에 퇴직금이 포함되나요?",
    "공제대상 가족 수에는 본인도 포함하나요?",
    "자녀 수는 어떤 기준으로 입력하나요?",
    "비과세액은 얼마를 입력해야 하나요?",
    "실제 급여명세서와 결과가 다른 이유는 무엇인가요?",
    "상여금과 성과급도 계산되나요?",
    "기준소득월액과 실제 월급은 왜 다른가요?",
    "월급 공제액에는 어떤 항목이 포함되나요?",
    "4대보험 계산기와 연봉 실수령액 계산기는 무엇이 다른가요?",
    "국민연금 상한을 넘는 연봉은 어떻게 계산되나요?",
    "현재 국민연금 기준소득월액 상·하한은 언제까지 적용되나요?",
  ];

  assert.deepEqual(
    salaryTakeHomeFaqs.map((faq) => faq.question),
    expectedQuestions,
  );
  assert.match(contentSource, /salaryTakeHomeFaqs\.map/);
  assert.match(contentSource, /<details/);
  assert.match(
    salaryTakeHomeFaqs.find(
      (faq) => faq.question === "기준소득월액과 실제 월급은 왜 다른가요?",
    )?.answer ?? "",
    /기준소득월액에서 공제액을 바로 빼서 실수령액을 구하는 구조가 아닙니다/,
  );
  assert.match(
    salaryTakeHomeFaqs.find(
      (faq) => faq.question === "비과세액은 얼마를 입력해야 하나요?",
    )?.answer ?? "",
    /모든 사회보험료와 세금의 기준이 같은 금액만큼 줄어든다고 단정할 수는 없습니다/,
  );
});

test("국민연금 정책값과 현재 적용 기간은 정책 모듈을 단일 출처로 사용한다", () => {
  assert.match(dataSource, /SALARY_TAKE_HOME_POLICY_2026/);
  assert.match(contentSource, /SALARY_TAKE_HOME_POLICY_2026/);
  assert.match(contentSource, /국민연금공단 최신 안내/);

  const faq = salaryTakeHomeFaqs.at(-1).answer;
  assert.match(faq, /2026년 7월 11일/);
  assert.match(faq, /2027년 6월 30일/);
  assert.equal(SALARY_TAKE_HOME_POLICY_2026.verifiedAt, "2026-07-11");
  assert.equal(SALARY_TAKE_HOME_POLICY_2026.nationalPension.ceilingEffectiveFrom, "2026-07-01");
  assert.equal(SALARY_TAKE_HOME_POLICY_2026.nationalPension.ceilingEffectiveTo, "2027-06-30");
  assert.equal(SALARY_TAKE_HOME_POLICY_2026.nationalPension.standardMonthlyIncomeMinimum, 410_000);
  assert.equal(SALARY_TAKE_HOME_POLICY_2026.nationalPension.standardMonthlyIncomeMaximum, 6_590_000);
});

test("만료된 국민연금 상한·기간·변경 예정 문구를 남기지 않는다", () => {
  const salaryPolicySources = [policySource, dataSource, contentSource];

  for (const source of salaryPolicySources) {
    assert.doesNotMatch(
      source,
      /6,370,000|637만원|2026-06-30|변경 예정|7월부터 변경/,
    );
  }
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
