import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { UNEMPLOYMENT_POLICY_2026 } from "../lib/calculators/unemployment/policy.ts";
import {
  calculateUnemploymentBenefit,
  getPrescribedBenefitDays,
  validateUnemploymentInput,
} from "../lib/calculators/unemployment/unemployment.ts";

const standardInput = {
  wageInputType: "monthlyWage",
  wageAmount: 3_300_000,
  insuredMonths: 36,
  ageGroup: "under50",
  leavingReason: "involuntary",
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

test("월급 기준 정상 입력은 예상 구직급여와 소정급여일수를 계산한다", () => {
  const data = assertSuccess(calculateUnemploymentBenefit(standardInput));

  assert.equal(data.estimatedAverageDailyWage, 110_000);
  assert.equal(data.baseDailyBenefit, 66_000);
  assert.equal(data.dailyBenefitAmount, 66_048);
  assert.equal(data.isLowerLimitApplied, true);
  assert.equal(data.isUpperLimitApplied, false);
  assert.equal(data.prescribedBenefitDays, 180);
  assert.equal(data.estimatedTotalBenefit, 11_888_640);
  assert.equal(data.eligibilityStatus, "possible");
  assert.match(data.eligibilityMessage, /수급 가능성 있음/);
});

test("1일 평균임금 직접 입력은 월급 추정 없이 계산한다", () => {
  const data = assertSuccess(
    calculateUnemploymentBenefit({
      ...standardInput,
      wageInputType: "averageDailyWage",
      wageAmount: 113_000,
      insuredMonths: 24,
    }),
  );

  assert.equal(data.estimatedAverageDailyWage, 113_000);
  assert.equal(data.baseDailyBenefit, 67_800);
  assert.equal(data.dailyBenefitAmount, 67_800);
  assert.equal(data.prescribedBenefitDays, 150);
});

test("상한액을 초과하면 오류가 아니라 상한액 적용 상태로 표시한다", () => {
  const data = assertSuccess(
    calculateUnemploymentBenefit({
      ...standardInput,
      wageInputType: "averageDailyWage",
      wageAmount: 200_000,
    }),
  );

  assert.equal(data.baseDailyBenefit, 120_000);
  assert.equal(data.dailyBenefitAmount, UNEMPLOYMENT_POLICY_2026.dailyBenefitUpperLimit);
  assert.equal(data.isUpperLimitApplied, true);
  assert.equal(data.isLowerLimitApplied, false);
});

test("하한액보다 낮으면 오류가 아니라 하한액 적용 상태로 표시한다", () => {
  const data = assertSuccess(
    calculateUnemploymentBenefit({
      ...standardInput,
      wageInputType: "averageDailyWage",
      wageAmount: 50_000,
    }),
  );

  assert.equal(data.baseDailyBenefit, 30_000);
  assert.equal(data.dailyBenefitAmount, UNEMPLOYMENT_POLICY_2026.dailyBenefitLowerLimit);
  assert.equal(data.isLowerLimitApplied, true);
});

test("가입기간과 나이 구간별 소정급여일수 경계를 계산한다", () => {
  assert.equal(getPrescribedBenefitDays(6, "under50"), 120);
  assert.equal(getPrescribedBenefitDays(11, "over50OrDisabled"), 120);
  assert.equal(getPrescribedBenefitDays(12, "under50"), 150);
  assert.equal(getPrescribedBenefitDays(12, "over50OrDisabled"), 180);
  assert.equal(getPrescribedBenefitDays(36, "under50"), 180);
  assert.equal(getPrescribedBenefitDays(36, "over50OrDisabled"), 210);
  assert.equal(getPrescribedBenefitDays(60, "under50"), 210);
  assert.equal(getPrescribedBenefitDays(60, "over50OrDisabled"), 240);
  assert.equal(getPrescribedBenefitDays(120, "under50"), 240);
  assert.equal(getPrescribedBenefitDays(120, "over50OrDisabled"), 270);
});

test("6개월 미만 가입기간은 계산 제한 오류로 처리한다", () => {
  assertHasError(
    calculateUnemploymentBenefit({ ...standardInput, insuredMonths: 5 }),
    "insuredMonths",
    "INSURED_MONTHS_UNDER_MINIMUM",
  );
});

test("빈 값, 숫자가 아닌 값, 음수와 범위 초과를 구조화 오류로 반환한다", () => {
  assertHasError(
    calculateUnemploymentBenefit({ ...standardInput, wageAmount: "" }),
    "wageAmount",
    "REQUIRED",
  );
  assertHasError(
    calculateUnemploymentBenefit({ ...standardInput, wageAmount: "3000000" }),
    "wageAmount",
    "INVALID_NUMBER",
  );
  assertHasError(
    calculateUnemploymentBenefit({ ...standardInput, wageAmount: -1 }),
    "wageAmount",
    "MUST_BE_POSITIVE",
  );
  assertHasError(
    calculateUnemploymentBenefit({
      ...standardInput,
      wageAmount: UNEMPLOYMENT_POLICY_2026.maximumMonthlyWage + 1,
    }),
    "wageAmount",
    "AMOUNT_EXCEEDS_LIMIT",
  );
  assertHasError(
    calculateUnemploymentBenefit({ ...standardInput, ageGroup: "" }),
    "ageGroup",
    "REQUIRED",
  );
  assertHasError(
    calculateUnemploymentBenefit({ ...standardInput, leavingReason: "other" }),
    "leavingReason",
    "INVALID_OPTION",
  );
});

test("퇴직 사유별 안내는 지급 가능 여부를 확정하지 않는다", () => {
  const voluntary = assertSuccess(
    calculateUnemploymentBenefit({
      ...standardInput,
      leavingReason: "voluntary",
    }),
  );
  const review = assertSuccess(
    calculateUnemploymentBenefit({
      ...standardInput,
      leavingReason: "voluntaryExceptionReview",
    }),
  );
  const unclear = assertSuccess(
    calculateUnemploymentBenefit({
      ...standardInput,
      leavingReason: "unclear",
    }),
  );

  assert.equal(voluntary.eligibilityStatus, "restricted");
  assert.match(voluntary.eligibilityMessage, /제한될 수 있습니다/);
  assert.equal(review.eligibilityStatus, "reviewRequired");
  assert.match(review.eligibilityMessage, /증빙 검토/);
  assert.equal(unclear.eligibilityStatus, "officialReviewRequired");
  assert.match(unclear.eligibilityMessage, /공식 절차/);
});

test("정책 상수는 기준일과 공식 재검증 필요 여부를 노출한다", () => {
  assert.equal(UNEMPLOYMENT_POLICY_2026.basisDate, "2026-06-25");
  assert.equal(UNEMPLOYMENT_POLICY_2026.needsOfficialVerification, true);
  assert.match(UNEMPLOYMENT_POLICY_2026.sourceNote, /공식 원문 재검증/);
});

test("검증 함수는 입력 객체를 변경하지 않는다", () => {
  const input = structuredClone(standardInput);
  const snapshot = structuredClone(input);

  validateUnemploymentInput(input);
  calculateUnemploymentBenefit(input);

  assert.deepEqual(input, snapshot);
});

test("결과는 JSON 직렬화 가능하고 NaN과 Infinity를 포함하지 않는다", () => {
  const data = assertSuccess(calculateUnemploymentBenefit(standardInput));
  const serialized = JSON.stringify(data);

  assert.doesNotThrow(() => JSON.parse(serialized));
  assert.doesNotMatch(serialized, /NaN|Infinity|BigInt/);
});

test("실업급여 엔진은 React와 브라우저 API에 의존하지 않는다", () => {
  const source = readFileSync(
    new URL(
      "../lib/calculators/unemployment/unemployment.ts",
      import.meta.url,
    ),
    "utf8",
  );

  assert.doesNotMatch(
    source,
    /\b(?:React|window|document|navigator|localStorage)\b/,
  );
});
