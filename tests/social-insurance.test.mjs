import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { metadata } from "../app/calculators/social-insurance/page.tsx";
import {
  calculateSocialInsurance,
  validateSocialInsuranceInput,
} from "../lib/calculators/social-insurance/calculate.ts";
import { calculateSalaryTakeHome } from "../lib/calculators/salary-take-home/salary-take-home.ts";
import {
  SOCIAL_INSURANCE_POLICY_2026,
} from "../lib/calculators/social-insurance/constants.ts";
import {
  socialInsuranceFaqJsonLd,
  socialInsuranceFaqs,
  socialInsuranceExamples,
  socialInsuranceCriteria,
  socialInsuranceSources,
} from "../components/calculators/socialInsuranceContentData.ts";
import { buildSocialInsuranceResultText } from "../components/calculators/socialInsuranceClientUtils.ts";

const baseInput = {
  monthlySalary: 3_000_000,
  nonTaxableAmount: 200_000,
};

function assertSuccess(response) {
  assert.equal(response.success, true);
  return response.data;
}

function assertHasError(response, field, code) {
  assert.equal(response.success, false);
  assert.ok(
    response.errors.some(
      (error) => error.field === field && error.code === code,
    ),
    `${field} 필드에 ${code} 오류가 있어야 합니다.`,
  );
}

test("2026년 7월 10일 기준 공식 상수와 계산식이 기록되어 있다", () => {
  assert.equal(SOCIAL_INSURANCE_POLICY_2026.verifiedAt, "2026-07-10");
  assert.equal(SOCIAL_INSURANCE_POLICY_2026.nationalPension.totalRate, 0.095);
  assert.equal(SOCIAL_INSURANCE_POLICY_2026.nationalPension.employeeRate, 0.0475);
  assert.equal(
    SOCIAL_INSURANCE_POLICY_2026.nationalPension.standardMonthlyIncomeMinimum,
    410_000,
  );
  assert.equal(
    SOCIAL_INSURANCE_POLICY_2026.nationalPension.standardMonthlyIncomeMaximum,
    6_590_000,
  );
  assert.equal(SOCIAL_INSURANCE_POLICY_2026.healthInsurance.employeeRate, 0.03595);
  assert.equal(
    SOCIAL_INSURANCE_POLICY_2026.longTermCareInsurance.healthInsuranceRate,
    0.1314,
  );
  assert.equal(
    SOCIAL_INSURANCE_POLICY_2026.employmentInsurance
      .unemploymentBenefitEmployeeRate,
    0.009,
  );
});

test("보험료율 기준 설명은 계산 상수의 부동소수점 오차 없이 표시한다", () => {
  const criteria = socialInsuranceCriteria.map(({ description }) => description).join(" ");

  assert.doesNotMatch(criteria, /13\.139999999999999%/);
  assert.doesNotMatch(criteria, /0\.8999999999999999%/);
  assert.match(criteria, /장기요양보험료.*13\.14%/);
  assert.match(criteria, /실업급여 계정 근로자 부담률 0\.9%/);
  assert.match(criteria, /근로자 부담률 4\.75%/);
  assert.match(criteria, /총 보험료율 7\.19% 중 근로자 부담분 3\.595%/);
});

test("월 급여 300만원·비과세 20만원의 4대보험 공제액을 계산한다", () => {
  const data = assertSuccess(calculateSocialInsurance(baseInput));

  assert.deepEqual(data, {
    monthlySalary: 3_000_000,
    nonTaxableAmount: 200_000,
    taxableMonthlyPay: 2_800_000,
    pensionBase: 2_800_000,
    pensionBaseStatus: "within",
    employeePension: 133_000,
    employeeHealthInsurance: 100_660,
    employeeLongTermCare: 13_227,
    employeeEmploymentInsurance: 25_200,
    totalEmployeeContribution: 272_087,
    afterContributionAmount: 2_727_913,
    policyYear: 2026,
    policyVerifiedAt: "2026-07-10",
  });
});

test("월 급여 250만원·비과세 0원의 예시 결과를 계산한다", () => {
  const data = assertSuccess(
    calculateSocialInsurance({
      monthlySalary: 2_500_000,
      nonTaxableAmount: 0,
    }),
  );

  assert.equal(data.employeePension, 118_750);
  assert.equal(data.employeeHealthInsurance, 89_875);
  assert.equal(data.employeeLongTermCare, 11_810);
  assert.equal(data.employeeEmploymentInsurance, 22_500);
  assert.equal(data.totalEmployeeContribution, 242_935);
  assert.equal(data.afterContributionAmount, 2_257_065);
});

test("국민연금 하한과 상한을 적용한다", () => {
  const minimum = assertSuccess(
    calculateSocialInsurance({
      monthlySalary: 300_000,
      nonTaxableAmount: 0,
    }),
  );
  const maximum = assertSuccess(
    calculateSocialInsurance({
      monthlySalary: 8_000_000,
      nonTaxableAmount: 0,
    }),
  );

  assert.equal(minimum.pensionBase, 410_000);
  assert.equal(minimum.pensionBaseStatus, "minimum");
  assert.equal(minimum.employeePension, 19_470);
  assert.equal(maximum.pensionBase, 6_590_000);
  assert.equal(maximum.pensionBaseStatus, "maximum");
  assert.equal(maximum.employeePension, 313_020);
});

test("국민연금 기준소득월액은 1,000원 미만, 근로자 부담액은 10원 미만을 절사한다", () => {
  const cases = [
    [409_999, 410_000, 19_470],
    [410_000, 410_000, 19_470],
    [410_999, 410_000, 19_470],
    [411_000, 411_000, 19_520],
    [6_000_000, 6_000_000, 285_000],
    [6_000_999, 6_000_000, 285_000],
    [6_370_000, 6_370_000, 302_570],
    [6_370_001, 6_370_000, 302_570],
    [6_370_999, 6_370_000, 302_570],
    [6_371_000, 6_371_000, 302_620],
    [6_500_000, 6_500_000, 308_750],
    [6_590_000, 6_590_000, 313_020],
    [6_590_001, 6_590_000, 313_020],
    [7_000_000, 6_590_000, 313_020],
  ];

  for (const [monthlySalary, pensionBase, employeePension] of cases) {
    const data = assertSuccess(
      calculateSocialInsurance({ monthlySalary, nonTaxableAmount: 0 }),
    );
    assert.equal(data.pensionBase, pensionBase, `${monthlySalary}원 기준소득월액`);
    assert.equal(data.employeePension, employeePension, `${monthlySalary}원 근로자 부담액`);
  }
});

test("국민연금 절사 변경은 다른 근로자 부담 보험료를 바꾸지 않고 총액·복사 출력에 반영한다", () => {
  const input = { monthlySalary: 6_590_000, nonTaxableAmount: 0 };
  const data = assertSuccess(calculateSocialInsurance(input));

  assert.equal(data.employeePension, 313_020);
  assert.equal(data.employeeHealthInsurance, 236_911);
  assert.equal(data.employeeLongTermCare, 31_130);
  assert.equal(data.employeeEmploymentInsurance, 59_310);
  assert.equal(data.totalEmployeeContribution, 640_371);
  assert.equal(data.afterContributionAmount, 5_949_629);
  assert.match(buildSocialInsuranceResultText(input, data), /국민연금: 313,020원/);
  assert.match(buildSocialInsuranceResultText(input, data), /총 공제액: 640,371원/);
});

test("국민연금 절사 기준 설명과 계산기 결과 영역은 같은 근로자 부담 결과를 사용한다", async () => {
  const source = await readFile(
    "components/calculators/SocialInsuranceCalculator.tsx",
    "utf8",
  );
  const pensionCriterion = socialInsuranceCriteria.find(
    ({ title }) => title === "국민연금",
  );

  assert.match(pensionCriterion.description, /1,000원 미만을 버린 뒤/);
  assert.match(pensionCriterion.description, /10원 미만을 버립니다/);
  assert.match(source, /<dt>국민연금<\/dt>\s*<dd>\{formatWon\(result\.employeePension\)\}<\/dd>/);
  assert.match(source, /<strong>\{formatWon\(result\.totalEmployeeContribution\)\}<\/strong>/);
});

test("대표 기준소득월액의 국민연금 근로자 부담액은 연봉 계산기와 일치한다", () => {
  const monthlyIncomes = [410_000, 6_000_000, 6_370_000, 6_500_000, 6_590_000, 7_000_000];

  for (const monthlyIncome of monthlyIncomes) {
    const socialInsurance = assertSuccess(
      calculateSocialInsurance({ monthlySalary: monthlyIncome, nonTaxableAmount: 0 }),
    );
    const salaryTakeHome = assertSuccess(
      calculateSalaryTakeHome({
        annualSalary: monthlyIncome * 12,
        monthlyNonTaxableAmount: 0,
        dependentCount: 1,
        childCount: 0,
      }),
    );

    assert.equal(
      socialInsurance.employeePension,
      salaryTakeHome.nationalPension,
      `${monthlyIncome}원 국민연금 부담액`,
    );
  }
});

test("총 공제액과 공제 후 참고 금액이 개별 항목 합계와 일치한다", () => {
  const data = assertSuccess(calculateSocialInsurance(baseInput));
  const expected =
    data.employeePension +
    data.employeeHealthInsurance +
    data.employeeLongTermCare +
    data.employeeEmploymentInsurance;

  assert.equal(data.totalEmployeeContribution, expected);
  assert.equal(
    data.afterContributionAmount,
    data.monthlySalary - data.totalEmployeeContribution,
  );
});

test("빈 값, 숫자 아님, 0 이하, 음수, NaN, Infinity를 거부한다", () => {
  assertHasError(
    calculateSocialInsurance({ monthlySalary: "", nonTaxableAmount: 0 }),
    "monthlySalary",
    "REQUIRED",
  );
  assertHasError(
    calculateSocialInsurance({ monthlySalary: "3000000", nonTaxableAmount: 0 }),
    "monthlySalary",
    "INVALID_NUMBER",
  );
  assertHasError(
    calculateSocialInsurance({ monthlySalary: 0, nonTaxableAmount: 0 }),
    "monthlySalary",
    "MUST_BE_POSITIVE",
  );
  assertHasError(
    calculateSocialInsurance({ monthlySalary: -1, nonTaxableAmount: 0 }),
    "monthlySalary",
    "MUST_BE_POSITIVE",
  );
  assertHasError(
    calculateSocialInsurance({ monthlySalary: Number.NaN, nonTaxableAmount: 0 }),
    "monthlySalary",
    "INVALID_NUMBER",
  );
  assertHasError(
    calculateSocialInsurance({ monthlySalary: Infinity, nonTaxableAmount: 0 }),
    "monthlySalary",
    "INVALID_NUMBER",
  );
  assertHasError(
    calculateSocialInsurance({ monthlySalary: 3_000_000, nonTaxableAmount: -1 }),
    "nonTaxableAmount",
    "MUST_BE_NON_NEGATIVE",
  );
});

test("비과세 금액과 과도한 값을 검증한다", () => {
  assertHasError(
    calculateSocialInsurance({
      monthlySalary: 3_000_000,
      nonTaxableAmount: 3_000_001,
    }),
    "nonTaxableAmount",
    "NON_TAXABLE_EXCEEDS_MONTHLY_SALARY",
  );
  assertHasError(
    calculateSocialInsurance({
      monthlySalary: 3_000_000,
      nonTaxableAmount: 3_000_000,
    }),
    "nonTaxableAmount",
    "TAXABLE_PAY_MUST_BE_POSITIVE",
  );
  assertHasError(
    calculateSocialInsurance({
      monthlySalary: 1_000_000_001,
      nonTaxableAmount: 0,
    }),
    "monthlySalary",
    "AMOUNT_EXCEEDS_LIMIT",
  );
  assertHasError(
    calculateSocialInsurance({
      monthlySalary: Number.MAX_SAFE_INTEGER + 1,
      nonTaxableAmount: 0,
    }),
    "monthlySalary",
    "MUST_BE_SAFE_INTEGER",
  );

  const errors = validateSocialInsuranceInput({
    monthlySalary: 3_000_000.5,
    nonTaxableAmount: 0,
  });
  assert.ok(
    errors.some(
      (error) =>
        error.field === "monthlySalary" && error.code === "MUST_BE_INTEGER",
    ),
  );
});

test("비과세 금액 빈 값은 0원으로 계산한다", () => {
  const data = assertSuccess(
    calculateSocialInsurance({
      monthlySalary: 2_500_000,
      nonTaxableAmount: "",
    }),
  );

  assert.equal(data.nonTaxableAmount, 0);
  assert.equal(data.taxableMonthlyPay, 2_500_000);
});

test("본문 예시 결과는 계산 함수와 같은 값으로 생성된다", () => {
  assert.equal(socialInsuranceExamples.length, 4);
  assert.match(
    socialInsuranceExamples[0].resultItems
      .map(({ value }) => value)
      .join(" "),
    /272,087원/,
  );
});

test("FAQPage JSON-LD는 화면 FAQ와 1:1로 일치한다", () => {
  assert.equal(
    socialInsuranceFaqJsonLd.mainEntity.length,
    socialInsuranceFaqs.length,
  );

  for (const [index, faq] of socialInsuranceFaqs.entries()) {
    const jsonLdFaq = socialInsuranceFaqJsonLd.mainEntity[index];
    assert.equal(jsonLdFaq.name, faq.question);
    assert.equal(jsonLdFaq.acceptedAnswer.text, faq.answer);
  }
});

test("소셜 보험 계산기 페이지는 공개 메타데이터와 계산기 UI를 사용한다", async () => {
  const source = await readFile(
    "app/calculators/social-insurance/page.tsx",
    "utf8",
  );

  assert.doesNotMatch(
    source,
    /isSocialInsuranceCalculatorEnabled|notFound\(\)|index:\s*false/,
  );
  assert.match(source, /canonical/);
  assert.match(source, /index:\s*true/);
  assert.match(source, /<h1>2026 4대보험 계산기<\/h1>/);
  assert.equal(
    metadata.title,
    "4대보험 계산기 2026 - 국민연금·건강보험·고용보험 공제액 계산",
  );
  assert.deepEqual(metadata.robots, { index: true, follow: true });
  assert.deepEqual(metadata.alternates, {
    canonical: "https://gyesanbox.kr/calculators/social-insurance/",
  });
});

test("공식 출처와 외부 링크 보안 속성을 제공한다", async () => {
  const source = await readFile(
    "components/calculators/SocialInsuranceContent.tsx",
    "utf8",
  );

  assert.equal(socialInsuranceSources.length, 4);
  assert.match(source, /rel="noopener noreferrer"/);
  assert.deepEqual(
    socialInsuranceSources.map(({ organization }) => organization),
    ["국민연금공단", "국민건강보험공단", "고용노동부", "고용노동부"],
  );

  for (const officialSource of socialInsuranceSources) {
    assert.match(officialSource.href, /^https:\/\//);
    assert.ok(officialSource.criterion.length > 0);
  }
});

test("sitemap, 목록, 홈과 연봉 관련 계산기에 공개 4대보험 계산기를 노출한다", async () => {
  const files = [
    "app/sitemap.ts",
    "app/page.tsx",
    "app/calculators/page.tsx",
    "components/calculators/SalaryTakeHomeContent.tsx",
  ];
  const sources = await Promise.all(files.map((file) => readFile(file, "utf8")));

  for (const source of sources) {
    assert.match(source, /social-insurance|4대보험 계산기/);
  }
});

test("Cloudflare 검증은 social-insurance 산출물을 공개 산출물로 요구한다", async () => {
  const source = await readFile("scripts/verify-cloudflare-pages.mjs", "utf8");

  assert.match(source, /out\/calculators\/social-insurance/);
  assert.match(source, /2026 4대보험 계산기/);
});
