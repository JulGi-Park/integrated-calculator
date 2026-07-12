import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { calculateParentalLeaveWithSpecialPolicy } from "../lib/calculators/parental-leave/parentalLeaveSpecialRules.ts";
import {
  PARENTAL_LEAVE_POLICY_2026,
  PARENTAL_LEAVE_SPECIAL_SOURCE_NAMES,
  PARENTS_TOGETHER_SIX_PLUS_SIX_POLICY_2026,
  SINGLE_PARENT_POLICY_2026,
} from "../lib/calculators/parental-leave/parentalLeavePolicy.ts";

function assertSuccess(response) {
  assert.equal(response.success, true);
  return response.data;
}

const sixPlusSixBase = {
  specialPolicy: "parentsTogetherSixPlusSix",
  childAgeMonths: 18,
  partnerUsedParentalLeave: true,
  partnerLeaveMonths: 6,
  sameChild: true,
};

test("6+6 특례는 고임금 6개월의 월별 상한과 총액을 계산한다", () => {
  const data = assertSuccess(
    calculateParentalLeaveWithSpecialPolicy({
      monthlyOrdinaryWage: 5_000_000,
      leaveMonths: 6,
      ...sixPlusSixBase,
    }),
  );

  assert.equal(data.appliedPolicy, "parentsTogetherSixPlusSix");
  assert.equal(data.requestedPolicy, "parentsTogetherSixPlusSix");
  assert.equal(data.isApplicable, true);
  assert.deepEqual(
    data.monthlyResults.map((item) => item.estimatedAmount),
    [2_500_000, 2_500_000, 3_000_000, 3_500_000, 4_000_000, 4_500_000],
  );
  assert.equal(data.totalEstimatedAmount, 20_000_000);
  assert.deepEqual(data.sourceNames, [...PARENTAL_LEAVE_SPECIAL_SOURCE_NAMES]);
  assert.equal(data.policyDate, "2026-07-01");
});

test("6+6 특례는 중간 임금과 저임금 하한을 계산한다", () => {
  const mid = assertSuccess(
    calculateParentalLeaveWithSpecialPolicy({
      monthlyOrdinaryWage: 2_000_000,
      leaveMonths: 6,
      ...sixPlusSixBase,
    }),
  );
  const low = assertSuccess(
    calculateParentalLeaveWithSpecialPolicy({
      monthlyOrdinaryWage: 500_000,
      leaveMonths: 6,
      ...sixPlusSixBase,
    }),
  );

  assert.ok(mid.monthlyResults.every((item) => item.estimatedAmount === 2_000_000));
  assert.equal(mid.totalEstimatedAmount, 12_000_000);
  assert.ok(mid.monthlyResults.every((item) => !item.capApplied));
  assert.ok(low.monthlyResults.every((item) => item.estimatedAmount === 700_000));
  assert.equal(low.totalEstimatedAmount, 4_200_000);
});

test("6+6 특례 경계값은 18개월까지 적용하고 7개월차는 일반 기준으로 계산한다", () => {
  const data = assertSuccess(
    calculateParentalLeaveWithSpecialPolicy({
      monthlyOrdinaryWage: 5_000_000,
      leaveMonths: 7,
      ...sixPlusSixBase,
      childAgeMonths: 18,
    }),
  );

  assert.equal(data.monthlyResults[0].upperLimit, 2_500_000);
  assert.equal(data.monthlyResults[1].upperLimit, 2_500_000);
  assert.equal(data.monthlyResults[2].upperLimit, 3_000_000);
  assert.equal(data.monthlyResults[5].upperLimit, 4_500_000);
  assert.equal(data.monthlyResults[6].estimatedAmount, 1_600_000);
  assert.equal(data.monthlyResults[6].appliedPolicy, "general");
  assert.equal(data.totalEstimatedAmount, 21_600_000);
  assert.equal(data.fallbackPolicy, "general");
  assert.match(data.warnings.join(" "), /일반 육아휴직급여/);
});

test("6+6 특례는 자녀 월령 19개월, 배우자 미사용, 다른 자녀를 적용 불가로 처리한다", () => {
  const data = assertSuccess(
    calculateParentalLeaveWithSpecialPolicy({
      monthlyOrdinaryWage: 3_000_000,
      leaveMonths: 6,
      ...sixPlusSixBase,
      childAgeMonths: 19,
      partnerUsedParentalLeave: false,
      sameChild: false,
    }),
  );

  assert.equal(data.isApplicable, false);
  assert.equal(data.appliedPolicy, "general");
  assert.equal(data.fallbackPolicy, "general");
  assert.ok(data.reasons.includes("childAgeMonthsOver18"));
  assert.ok(data.reasons.includes("partnerLeaveNotUsed"));
  assert.ok(data.reasons.includes("notSameChild"));
  assert.equal(data.totalEstimatedAmount, 13_500_000);
});

test("6+6 특례는 입력 부족 상태를 구조화하고 특례 추정 계산을 하지 않는다", () => {
  const data = assertSuccess(
    calculateParentalLeaveWithSpecialPolicy({
      monthlyOrdinaryWage: 3_000_000,
      leaveMonths: 6,
      specialPolicy: "parentsTogetherSixPlusSix",
      partnerUsedParentalLeave: "unknown",
    }),
  );

  assert.equal(data.isApplicable, false);
  assert.equal(data.appliedPolicy, "general");
  assert.ok(data.reasons.includes("insufficientInputs"));
  assert.ok(data.missingInputs.includes("childAgeMonths"));
  assert.ok(data.missingInputs.includes("partnerLeaveMonths"));
  assert.ok(data.missingInputs.includes("partnerUsedParentalLeave"));
  assert.ok(data.missingInputs.includes("sameChild"));
  assert.ok(data.monthlyResults.every((item) => item.appliedPolicy === "general"));
});

test("6+6 특례는 배우자 사용 개월 수만큼만 특례를 적용한다", () => {
  const data = assertSuccess(
    calculateParentalLeaveWithSpecialPolicy({
      monthlyOrdinaryWage: 5_000_000,
      leaveMonths: 6,
      ...sixPlusSixBase,
      partnerLeaveMonths: 3,
    }),
  );

  assert.deepEqual(
    data.monthlyResults.map((item) => item.appliedPolicy),
    [
      "parentsTogetherSixPlusSix",
      "parentsTogetherSixPlusSix",
      "parentsTogetherSixPlusSix",
      "general",
      "general",
      "general",
    ],
  );
  assert.equal(data.totalEstimatedAmount, 14_000_000);
});

test("한부모 특례는 1~3개월 상한 300만원을 적용한다", () => {
  const data = assertSuccess(
    calculateParentalLeaveWithSpecialPolicy({
      monthlyOrdinaryWage: 4_000_000,
      leaveMonths: 3,
      specialPolicy: "singleParent",
      isSingleParent: true,
    }),
  );

  assert.equal(data.appliedPolicy, "singleParent");
  assert.equal(data.isApplicable, true);
  assert.deepEqual(
    data.monthlyResults.map((item) => item.estimatedAmount),
    [3_000_000, 3_000_000, 3_000_000],
  );
  assert.equal(data.totalEstimatedAmount, 9_000_000);
});

test("한부모 특례는 중간 임금과 저임금 하한을 계산한다", () => {
  const mid = assertSuccess(
    calculateParentalLeaveWithSpecialPolicy({
      monthlyOrdinaryWage: 2_000_000,
      leaveMonths: 3,
      specialPolicy: "singleParent",
      isSingleParent: true,
    }),
  );
  const low = assertSuccess(
    calculateParentalLeaveWithSpecialPolicy({
      monthlyOrdinaryWage: 500_000,
      leaveMonths: 3,
      specialPolicy: "singleParent",
      isSingleParent: true,
    }),
  );

  assert.ok(mid.monthlyResults.every((item) => item.estimatedAmount === 2_000_000));
  assert.equal(mid.totalEstimatedAmount, 6_000_000);
  assert.ok(low.monthlyResults.every((item) => item.estimatedAmount === 700_000));
  assert.equal(low.totalEstimatedAmount, 2_100_000);
});

test("한부모 특례 경계값은 4개월차 이후 일반 기준으로 계산한다", () => {
  const cases = [
    [1, 3_000_000],
    [3, 9_000_000],
    [4, 11_000_000],
    [6, 15_000_000],
    [7, 16_600_000],
    [12, 24_600_000],
  ];

  for (const [leaveMonths, expectedTotal] of cases) {
    const data = assertSuccess(
      calculateParentalLeaveWithSpecialPolicy({
        monthlyOrdinaryWage: 4_000_000,
        leaveMonths,
        specialPolicy: "singleParent",
        isSingleParent: true,
      }),
    );

    assert.equal(data.totalEstimatedAmount, expectedTotal);
  }
});

test("한부모 특례는 false, unknown, missing 상태를 구조화한다", () => {
  const notSingle = assertSuccess(
    calculateParentalLeaveWithSpecialPolicy({
      monthlyOrdinaryWage: 4_000_000,
      leaveMonths: 3,
      specialPolicy: "singleParent",
      isSingleParent: false,
    }),
  );
  const unknown = assertSuccess(
    calculateParentalLeaveWithSpecialPolicy({
      monthlyOrdinaryWage: 4_000_000,
      leaveMonths: 3,
      specialPolicy: "singleParent",
      isSingleParent: "unknown",
    }),
  );
  const missing = assertSuccess(
    calculateParentalLeaveWithSpecialPolicy({
      monthlyOrdinaryWage: 4_000_000,
      leaveMonths: 3,
      specialPolicy: "singleParent",
    }),
  );

  assert.equal(notSingle.appliedPolicy, "general");
  assert.ok(notSingle.reasons.includes("notSingleParent"));
  assert.equal(unknown.appliedPolicy, "general");
  assert.ok(unknown.reasons.includes("missingSingleParentStatus"));
  assert.ok(unknown.missingInputs.includes("isSingleParent"));
  assert.ok(missing.reasons.includes("missingSingleParentStatus"));
  assert.ok(missing.missingInputs.includes("isSingleParent"));
});

test("6+6과 한부모 특례 동시 선택은 자동으로 유리한 특례를 선택하지 않는다", () => {
  const data = assertSuccess(
    calculateParentalLeaveWithSpecialPolicy({
      monthlyOrdinaryWage: 5_000_000,
      leaveMonths: 6,
      selectedSpecialPolicies: ["parentsTogetherSixPlusSix", "singleParent"],
      childAgeMonths: 18,
      partnerUsedParentalLeave: true,
      partnerLeaveMonths: 6,
      sameChild: true,
      isSingleParent: true,
    }),
  );

  assert.equal(data.requestedPolicy, "multiple");
  assert.equal(data.appliedPolicy, "general");
  assert.equal(data.isApplicable, false);
  assert.ok(data.reasons.includes("multipleSpecialPoliciesSelected"));
  assert.ok(data.reasons.includes("centerReviewRequired"));
  assert.match(data.warnings.join(" "), /고용센터 확인/);
  assert.equal(data.totalEstimatedAmount, 13_500_000);
});

test("특례 정책 상수는 기준일과 공식 출처를 노출한다", () => {
  assert.equal(PARENTAL_LEAVE_POLICY_2026.basisDate, "2026-07-01");
  assert.equal(PARENTS_TOGETHER_SIX_PLUS_SIX_POLICY_2026.basisDate, "2026-07-01");
  assert.equal(SINGLE_PARENT_POLICY_2026.basisDate, "2026-07-01");
  assert.deepEqual(
    [...PARENTS_TOGETHER_SIX_PLUS_SIX_POLICY_2026.sourceNames],
    [...PARENTAL_LEAVE_SPECIAL_SOURCE_NAMES],
  );
  assert.match(PARENTAL_LEAVE_SPECIAL_SOURCE_NAMES.join(" "), /고용24/);
  assert.match(PARENTAL_LEAVE_SPECIAL_SOURCE_NAMES.join(" "), /제95조의3/);
});

test("특례 엔진은 React와 브라우저 API에 의존하지 않는다", () => {
  const source = readFileSync(
    new URL(
      "../lib/calculators/parental-leave/parentalLeaveSpecialRules.ts",
      import.meta.url,
    ),
    "utf8",
  );

  assert.doesNotMatch(
    source,
    /\b(?:React|window|document|navigator|localStorage)\b/,
  );
});
