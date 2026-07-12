import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  calculateParentalLeaveBenefit,
  PARENTAL_LEAVE_POLICY_2026,
  validateParentalLeaveInput,
} from "../lib/calculators/parental-leave/parentalLeave.ts";
import { calculateParentalLeaveWithSpecialPolicy } from "../lib/calculators/parental-leave/parentalLeaveSpecialRules.ts";

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

test("월 통상임금 300만원, 1개월은 250만원 상한을 적용한다", () => {
  const data = assertSuccess(
    calculateParentalLeaveBenefit({
      monthlyOrdinaryWage: 3_000_000,
      leaveMonths: 1,
    }),
  );

  assert.equal(data.monthlyBenefits[0].estimatedAmount, 2_500_000);
  assert.equal(data.monthlyBenefits[0].capApplied, true);
  assert.equal(data.totalEstimatedAmount, 2_500_000);
});

test("월 통상임금 300만원 경계 개월별 총액을 계산한다", () => {
  const cases = [
    [3, 7_500_000],
    [4, 9_500_000],
    [6, 13_500_000],
    [7, 15_100_000],
    [12, 23_100_000],
  ];

  for (const [leaveMonths, expectedTotal] of cases) {
    const data = assertSuccess(
      calculateParentalLeaveBenefit({
        monthlyOrdinaryWage: 3_000_000,
        leaveMonths,
      }),
    );

    assert.equal(data.totalEstimatedAmount, expectedTotal);
  }
});

test("특례 확장 진입점의 일반 계산 fallback도 1차 일반 계산 결과를 유지한다", () => {
  const cases = [
    [1, 2_500_000],
    [3, 7_500_000],
    [4, 9_500_000],
    [6, 13_500_000],
    [7, 15_100_000],
    [12, 23_100_000],
  ];

  for (const [leaveMonths, expectedTotal] of cases) {
    const data = assertSuccess(
      calculateParentalLeaveWithSpecialPolicy({
        monthlyOrdinaryWage: 3_000_000,
        leaveMonths,
      }),
    );

    assert.equal(data.appliedPolicy, "general");
    assert.equal(data.totalEstimatedAmount, expectedTotal);
  }
});

test("월 통상임금 300만원, 12개월은 각 구간의 상한액을 적용한다", () => {
  const data = assertSuccess(
    calculateParentalLeaveBenefit({
      monthlyOrdinaryWage: 3_000_000,
      leaveMonths: 12,
    }),
  );

  assert.deepEqual(
    data.monthlyBenefits.map((item) => item.estimatedAmount),
    [
      2_500_000,
      2_500_000,
      2_500_000,
      2_000_000,
      2_000_000,
      2_000_000,
      1_600_000,
      1_600_000,
      1_600_000,
      1_600_000,
      1_600_000,
      1_600_000,
    ],
  );
  assert.equal(data.monthlyBenefits[6].rate, 0.8);
  assert.equal(data.monthlyBenefits[6].bandLabel, "7~12개월: 통상임금 80%, 상한 160만원");
});

test("월 통상임금 150만원, 12개월은 7개월차부터 120만원을 적용한다", () => {
  const data = assertSuccess(
    calculateParentalLeaveBenefit({
      monthlyOrdinaryWage: 1_500_000,
      leaveMonths: 12,
    }),
  );

  assert.equal(data.monthlyBenefits[0].estimatedAmount, 1_500_000);
  assert.equal(data.monthlyBenefits[5].estimatedAmount, 1_500_000);
  assert.equal(data.monthlyBenefits[6].estimatedAmount, 1_200_000);
  assert.equal(data.totalEstimatedAmount, 16_200_000);
});

test("월 통상임금 50만원, 12개월은 모든 월에 70만원 하한을 적용한다", () => {
  const data = assertSuccess(
    calculateParentalLeaveBenefit({
      monthlyOrdinaryWage: 500_000,
      leaveMonths: 12,
    }),
  );

  assert.equal(data.totalEstimatedAmount, 8_400_000);
  assert.ok(data.monthlyBenefits.every((item) => item.estimatedAmount === 700_000));
  assert.ok(data.monthlyBenefits.every((item) => item.floorApplied));
});

test("입력값 검증은 누락, 숫자 아님, 음수, 0, 소수, 범위 초과를 처리한다", () => {
  assertHasError(
    calculateParentalLeaveBenefit({ monthlyOrdinaryWage: "", leaveMonths: 1 }),
    "monthlyOrdinaryWage",
    "REQUIRED",
  );
  assertHasError(
    calculateParentalLeaveBenefit({ monthlyOrdinaryWage: "abc", leaveMonths: 1 }),
    "monthlyOrdinaryWage",
    "INVALID_NUMBER",
  );
  assertHasError(
    calculateParentalLeaveBenefit({ monthlyOrdinaryWage: -1, leaveMonths: 1 }),
    "monthlyOrdinaryWage",
    "MUST_BE_POSITIVE",
  );
  assertHasError(
    calculateParentalLeaveBenefit({ monthlyOrdinaryWage: 0, leaveMonths: 1 }),
    "monthlyOrdinaryWage",
    "MUST_BE_POSITIVE",
  );
  assertHasError(
    calculateParentalLeaveBenefit({
      monthlyOrdinaryWage: 1_000_000.5,
      leaveMonths: 1,
    }),
    "monthlyOrdinaryWage",
    "MUST_BE_INTEGER",
  );
  assertHasError(
    calculateParentalLeaveBenefit({
      monthlyOrdinaryWage: 1_000_000,
      leaveMonths: "",
    }),
    "leaveMonths",
    "REQUIRED",
  );
  assertHasError(
    calculateParentalLeaveBenefit({
      monthlyOrdinaryWage: 1_000_000,
      leaveMonths: "abc",
    }),
    "leaveMonths",
    "INVALID_NUMBER",
  );
  assertHasError(
    calculateParentalLeaveBenefit({
      monthlyOrdinaryWage: 1_000_000,
      leaveMonths: 0,
    }),
    "leaveMonths",
    "MONTHS_UNDER_MINIMUM",
  );
  assertHasError(
    calculateParentalLeaveBenefit({
      monthlyOrdinaryWage: 1_000_000,
      leaveMonths: 0.5,
    }),
    "leaveMonths",
    "MUST_BE_INTEGER",
  );
  assertHasError(
    calculateParentalLeaveBenefit({
      monthlyOrdinaryWage: 1_000_000,
      leaveMonths: 13,
    }),
    "leaveMonths",
    "MONTHS_EXCEEDS_LIMIT",
  );
});

test("정책 상수는 2026년 7월 1일 일반 육아휴직급여 기준을 노출한다", () => {
  assert.equal(PARENTAL_LEAVE_POLICY_2026.basisDate, "2026-07-01");
  assert.equal(PARENTAL_LEAVE_POLICY_2026.lowerLimit, 700_000);
  assert.equal(PARENTAL_LEAVE_POLICY_2026.bands[0].upperLimit, 2_500_000);
  assert.equal(PARENTAL_LEAVE_POLICY_2026.bands[1].upperLimit, 2_000_000);
  assert.equal(PARENTAL_LEAVE_POLICY_2026.bands[2].upperLimit, 1_600_000);
  assert.match(PARENTAL_LEAVE_POLICY_2026.sourceNote, /고용24/);
  assert.match(PARENTAL_LEAVE_POLICY_2026.sourceNote, /제95조/);
});

test("검증 함수는 입력 객체를 변경하지 않는다", () => {
  const input = { monthlyOrdinaryWage: 3_000_000, leaveMonths: 12 };
  const snapshot = structuredClone(input);

  validateParentalLeaveInput(input);
  calculateParentalLeaveBenefit(input);

  assert.deepEqual(input, snapshot);
});

test("육아휴직급여 엔진은 React와 브라우저 API에 의존하지 않는다", () => {
  const source = readFileSync(
    new URL(
      "../lib/calculators/parental-leave/parentalLeave.ts",
      import.meta.url,
    ),
    "utf8",
  );

  assert.doesNotMatch(
    source,
    /\b(?:React|window|document|navigator|localStorage)\b/,
  );
});
