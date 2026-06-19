import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateMonthlyIncomeTax,
  calculateSalaryTakeHome,
  validateSalaryTakeHomeInput,
} from "../lib/calculators/salary-take-home/salary-take-home.ts";
import {
  SALARY_TAKE_HOME_INPUT_METADATA,
  SALARY_TAKE_HOME_POLICY_2026,
} from "../lib/calculators/salary-take-home/policy.ts";
import { MONTHLY_INCOME_TAX_TABLE_2026 } from "../lib/calculators/salary-take-home/income-tax-table.ts";

const baseInput = {
  annualSalary: 36_000_000,
  monthlyNonTaxableAmount: 0,
  dependentCount: 1,
  childCount: 0,
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

test("공식 간이세액표 646개 구간이 77만원부터 1천만원까지 연속된다", () => {
  assert.equal(MONTHLY_INCOME_TAX_TABLE_2026.length, 646);
  assert.equal(MONTHLY_INCOME_TAX_TABLE_2026[0][0], 770);
  assert.equal(MONTHLY_INCOME_TAX_TABLE_2026.at(-1)[1], 10_000);

  for (let index = 1; index < MONTHLY_INCOME_TAX_TABLE_2026.length; index += 1) {
    assert.equal(
      MONTHLY_INCOME_TAX_TABLE_2026[index - 1][1],
      MONTHLY_INCOME_TAX_TABLE_2026[index][0],
    );
  }
});

test("공식 고정 사례 1: 월 과세급여 300만원·가족 1명의 전체 결과", () => {
  const data = assertSuccess(calculateSalaryTakeHome(baseInput));

  assert.deepEqual(data, {
    monthlyGrossSalary: 3_000_000,
    monthlyTaxableSalary: 3_000_000,
    nationalPension: 142_500,
    healthInsurance: 107_850,
    longTermCareInsurance: 14_172,
    employmentInsurance: 27_000,
    incomeTax: 74_350,
    localIncomeTax: 7_430,
    totalMonthlyDeductions: 373_302,
    estimatedMonthlyTakeHome: 2_626_698,
    estimatedAnnualTakeHome: 31_520_376,
    policyYear: 2026,
    policyVerifiedAt: "2026-06-19",
  });
});

test("공식 고정 사례 2: 비과세 20만원·가족 3명·자녀 1명", () => {
  const data = assertSuccess(
    calculateSalaryTakeHome({
      annualSalary: 60_000_000,
      monthlyNonTaxableAmount: 200_000,
      dependentCount: 3,
      childCount: 1,
    }),
  );

  assert.deepEqual(data, {
    monthlyGrossSalary: 5_000_000,
    monthlyTaxableSalary: 4_800_000,
    nationalPension: 228_000,
    healthInsurance: 172_560,
    longTermCareInsurance: 22_675,
    employmentInsurance: 43_200,
    incomeTax: 191_220,
    localIncomeTax: 19_120,
    totalMonthlyDeductions: 676_775,
    estimatedMonthlyTakeHome: 4_323_225,
    estimatedAnnualTakeHome: 51_878_700,
    policyYear: 2026,
    policyVerifiedAt: "2026-06-19",
  });
});

test("공식 고정 사례 3: 월 과세급여 1천만원·가족 2명·자녀 2명", () => {
  const data = assertSuccess(
    calculateSalaryTakeHome({
      annualSalary: 120_000_000,
      monthlyNonTaxableAmount: 0,
      dependentCount: 2,
      childCount: 2,
    }),
  );

  assert.deepEqual(data, {
    monthlyGrossSalary: 10_000_000,
    monthlyTaxableSalary: 10_000_000,
    nationalPension: 302_570,
    healthInsurance: 359_500,
    longTermCareInsurance: 47_240,
    employmentInsurance: 90_000,
    incomeTax: 1_385_740,
    localIncomeTax: 138_570,
    totalMonthlyDeductions: 2_323_620,
    estimatedMonthlyTakeHome: 7_676_380,
    estimatedAnnualTakeHome: 92_116_560,
    policyYear: 2026,
    policyVerifiedAt: "2026-06-19",
  });
});

test("비과세액 0원을 허용한다", () => {
  const data = assertSuccess(calculateSalaryTakeHome(baseInput));

  assert.equal(data.monthlyTaxableSalary, data.monthlyGrossSalary);
});

test("비과세액은 월 과세급여와 보험료를 낮춘다", () => {
  const withoutNonTax = assertSuccess(calculateSalaryTakeHome(baseInput));
  const withNonTax = assertSuccess(
    calculateSalaryTakeHome({
      ...baseInput,
      monthlyNonTaxableAmount: 200_000,
    }),
  );

  assert.equal(withNonTax.monthlyTaxableSalary, 2_800_000);
  assert.ok(withNonTax.healthInsurance < withoutNonTax.healthInsurance);
  assert.ok(withNonTax.incomeTax < withoutNonTax.incomeTax);
});

test("국민연금 기준소득월액 하한 40만원을 적용한다", () => {
  const data = assertSuccess(
    calculateSalaryTakeHome({
      ...baseInput,
      annualSalary: 1_200_000,
    }),
  );

  assert.equal(data.monthlyTaxableSalary, 100_000);
  assert.equal(data.nationalPension, 19_000);
});

test("국민연금 기준소득월액 상한 637만원을 적용한다", () => {
  const data = assertSuccess(
    calculateSalaryTakeHome({
      ...baseInput,
      annualSalary: 120_000_000,
    }),
  );

  assert.equal(data.nationalPension, 302_570);
});

test("공제대상가족 수가 늘면 간이세액표 소득세가 감소한다", () => {
  const oneDependent = calculateMonthlyIncomeTax(3_000_000, 1, 0);
  const threeDependents = calculateMonthlyIncomeTax(3_000_000, 3, 0);

  assert.equal(oneDependent, 74_350);
  assert.equal(threeDependents, 31_940);
  assert.ok(threeDependents < oneDependent);
});

test("자녀 수에 따라 공식 자녀 공제액을 차감한다", () => {
  const noChildren = calculateMonthlyIncomeTax(5_000_000, 3, 0);
  const oneChild = calculateMonthlyIncomeTax(5_000_000, 3, 1);
  const twoChildren = calculateMonthlyIncomeTax(5_000_000, 3, 2);

  assert.equal(noChildren, 237_850);
  assert.equal(oneChild, 217_020);
  assert.equal(twoChildren, 192_020);
});

test("저소득 구간의 소득세와 지방소득세는 0원이다", () => {
  const data = assertSuccess(
    calculateSalaryTakeHome({
      ...baseInput,
      annualSalary: 12_000_000,
    }),
  );

  assert.equal(data.incomeTax, 0);
  assert.equal(data.localIncomeTax, 0);
});

test("월 과세급여 1천만원 초과 고연봉 산식을 적용한다", () => {
  assert.equal(calculateMonthlyIncomeTax(14_000_000, 1, 0), 2_904_400);
  assert.equal(calculateMonthlyIncomeTax(28_000_000, 1, 0), 8_118_000);
  assert.equal(calculateMonthlyIncomeTax(100_000_000, 1, 0), 38_392_000);
});

test("연봉이 12로 나누어떨어지지 않으면 월 급여의 원 미만을 버린다", () => {
  const data = assertSuccess(
    calculateSalaryTakeHome({
      ...baseInput,
      annualSalary: 36_000_001,
    }),
  );

  assert.equal(data.monthlyGrossSalary, 3_000_000);
});

test("월 비과세액이 월 급여보다 크면 거부한다", () => {
  assertHasError(
    calculateSalaryTakeHome({
      ...baseInput,
      monthlyNonTaxableAmount: 3_000_001,
    }),
    "monthlyNonTaxableAmount",
    "NON_TAXABLE_EXCEEDS_MONTHLY_SALARY",
  );
});

test("빈 연봉과 숫자가 아닌 연봉을 구분해 거부한다", () => {
  assertHasError(
    calculateSalaryTakeHome({ ...baseInput, annualSalary: "" }),
    "annualSalary",
    "REQUIRED",
  );
  assertHasError(
    calculateSalaryTakeHome({ ...baseInput, annualSalary: "36000000" }),
    "annualSalary",
    "INVALID_NUMBER",
  );
});

test("0원·음수 연봉과 음수 비과세액을 거부한다", () => {
  assertHasError(
    calculateSalaryTakeHome({ ...baseInput, annualSalary: 0 }),
    "annualSalary",
    "MUST_BE_POSITIVE",
  );
  assertHasError(
    calculateSalaryTakeHome({ ...baseInput, annualSalary: -1 }),
    "annualSalary",
    "MUST_BE_POSITIVE",
  );
  assertHasError(
    calculateSalaryTakeHome({
      ...baseInput,
      monthlyNonTaxableAmount: -1,
    }),
    "monthlyNonTaxableAmount",
    "MUST_BE_NON_NEGATIVE",
  );
});

test("0명 이하 가족 수와 가족 수보다 많은 자녀 수를 거부한다", () => {
  assertHasError(
    calculateSalaryTakeHome({ ...baseInput, dependentCount: 0 }),
    "dependentCount",
    "MUST_BE_POSITIVE",
  );
  assertHasError(
    calculateSalaryTakeHome({
      ...baseInput,
      dependentCount: 2,
      childCount: 3,
    }),
    "childCount",
    "CHILD_COUNT_EXCEEDS_DEPENDENT_COUNT",
  );
});

test("소수 가족 수와 자녀 수를 거부한다", () => {
  assertHasError(
    calculateSalaryTakeHome({ ...baseInput, dependentCount: 1.5 }),
    "dependentCount",
    "MUST_BE_INTEGER",
  );
  assertHasError(
    calculateSalaryTakeHome({ ...baseInput, childCount: 0.5 }),
    "childCount",
    "MUST_BE_INTEGER",
  );

  const errors = validateSalaryTakeHomeInput({
    ...baseInput,
    dependentCount: 1.5,
  });
  assert.ok(
    errors.some(
      (error) =>
        error.field === "dependentCount" &&
        error.code === "MUST_BE_INTEGER",
    ),
  );
});

for (const invalidValue of [Number.NaN, Infinity, -Infinity]) {
  test(`${String(invalidValue)} 연봉을 거부한다`, () => {
    assertHasError(
      calculateSalaryTakeHome({
        ...baseInput,
        annualSalary: invalidValue,
      }),
      "annualSalary",
      "INVALID_NUMBER",
    );
  });
}

test("안전 정수 범위를 벗어난 값과 서비스 최대 연봉 초과를 거부한다", () => {
  assertHasError(
    calculateSalaryTakeHome({
      ...baseInput,
      annualSalary: Number.MAX_SAFE_INTEGER + 1,
    }),
    "annualSalary",
    "MUST_BE_SAFE_INTEGER",
  );
  assertHasError(
    calculateSalaryTakeHome({
      ...baseInput,
      annualSalary:
        SALARY_TAKE_HOME_POLICY_2026.maximumAnnualSalary + 1,
    }),
    "annualSalary",
    "ANNUAL_SALARY_EXCEEDS_LIMIT",
  );
});

test("모든 공제액 합계가 개별 공제 합과 일치한다", () => {
  const data = assertSuccess(calculateSalaryTakeHome(baseInput));
  const expected =
    data.nationalPension +
    data.healthInsurance +
    data.longTermCareInsurance +
    data.employmentInsurance +
    data.incomeTax +
    data.localIncomeTax;

  assert.equal(data.totalMonthlyDeductions, expected);
});

test("월·연간 예상 실수령액 계산이 일치한다", () => {
  const data = assertSuccess(calculateSalaryTakeHome(baseInput));

  assert.equal(
    data.estimatedMonthlyTakeHome,
    data.monthlyGrossSalary - data.totalMonthlyDeductions,
  );
  assert.equal(
    data.estimatedAnnualTakeHome,
    data.estimatedMonthlyTakeHome * 12,
  );
});

test("극저소득과 최대 허용 연봉에서도 실수령액이 음수가 아니다", () => {
  for (const annualSalary of [
    1,
    SALARY_TAKE_HOME_POLICY_2026.maximumAnnualSalary,
  ]) {
    const data = assertSuccess(
      calculateSalaryTakeHome({
        ...baseInput,
        annualSalary,
      }),
    );

    assert.ok(data.estimatedMonthlyTakeHome >= 0);
    assert.ok(data.estimatedAnnualTakeHome >= 0);
  }
});

test("공제대상가족 입력 설명은 본인을 포함한다고 명시한다", () => {
  assert.equal(SALARY_TAKE_HOME_INPUT_METADATA.dependentCount.includesSelf, true);
  assert.match(
    SALARY_TAKE_HOME_INPUT_METADATA.dependentCount.description,
    /본인/,
  );
});

test("계산 결과에 정책 연도와 기준일을 포함한다", () => {
  const data = assertSuccess(calculateSalaryTakeHome(baseInput));

  assert.equal(data.policyYear, 2026);
  assert.equal(data.policyVerifiedAt, "2026-06-19");
});

test("계산 함수는 입력 객체를 변경하지 않는다", () => {
  const input = { ...baseInput };
  const snapshot = structuredClone(input);

  calculateSalaryTakeHome(input);

  assert.deepEqual(input, snapshot);
});
