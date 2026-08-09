import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateRoas,
  validateRoasInput,
} from "../lib/calculators/roas/roas.ts";

const baseInput = {
  adCost: 100_000,
  adRevenue: 500_000,
  productCost: 250_000,
  otherCost: 50_000,
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

test("광고비 100,000원과 광고 매출 500,000원은 ROAS 500%를 반환한다", () => {
  const data = assertSuccess(calculateRoas(baseInput));

  assert.equal(data.roasRate, 500);
});

test("광고 매출 0원은 ROAS 0%와 계산 불가 비율을 반환한다", () => {
  const data = assertSuccess(
    calculateRoas({
      adCost: 100_000,
      adRevenue: 0,
      productCost: 0,
      otherCost: 0,
    }),
  );

  assert.equal(data.roasRate, 0);
  assert.equal(data.adCostShareRate, null);
  assert.equal(data.contributionMarginRate, null);
  assert.equal(data.breakEvenRoasRate, null);
});

test("광고비 0원은 계산 불가 오류를 반환한다", () => {
  assertHasError(calculateRoas({ ...baseInput, adCost: 0 }), "adCost", "MUST_BE_POSITIVE");
});

test("광고비 음수는 오류를 반환한다", () => {
  assertHasError(
    calculateRoas({ ...baseInput, adCost: -1 }),
    "adCost",
    "MUST_BE_NON_NEGATIVE",
  );
});

test("광고 매출 음수는 오류를 반환한다", () => {
  assertHasError(
    calculateRoas({ ...baseInput, adRevenue: -1 }),
    "adRevenue",
    "MUST_BE_NON_NEGATIVE",
  );
});

test("상품 원가 음수는 오류를 반환한다", () => {
  assertHasError(
    calculateRoas({ ...baseInput, productCost: -1 }),
    "productCost",
    "MUST_BE_NON_NEGATIVE",
  );
});

test("기타 비용 음수는 오류를 반환한다", () => {
  assertHasError(
    calculateRoas({ ...baseInput, otherCost: -1 }),
    "otherCost",
    "MUST_BE_NON_NEGATIVE",
  );
});

test("광고 후 순이익을 계산한다", () => {
  const data = assertSuccess(calculateRoas(baseInput));

  assert.equal(data.netProfitAfterAd, 100_000);
});

test("공헌이익률 40%와 손익분기 ROAS 250%를 계산한다", () => {
  const data = assertSuccess(calculateRoas(baseInput));

  assert.equal(data.contributionProfitBeforeAd, 200_000);
  assert.equal(data.contributionMarginRate, 40);
  assert.equal(data.breakEvenRoasRate, 250);
});

test("공헌이익률 0 이하이면 손익분기 ROAS를 계산하지 않는다", () => {
  const data = assertSuccess(
    calculateRoas({
      adCost: 100_000,
      adRevenue: 300_000,
      productCost: 300_000,
      otherCost: 0,
    }),
  );

  assert.equal(data.contributionMarginRate, 0);
  assert.equal(data.breakEvenRoasRate, null);
});

test("목표 ROAS 400%, 실제 ROAS 500%는 목표 달성이다", () => {
  const data = assertSuccess(calculateRoas({ ...baseInput, targetRoas: 400 }));

  assert.equal(data.targetStatus, "ACHIEVED");
});

test("목표 ROAS 600%, 실제 ROAS 500%는 목표 미달이다", () => {
  const data = assertSuccess(calculateRoas({ ...baseInput, targetRoas: 600 }));

  assert.equal(data.targetStatus, "MISSED");
});

test("선택 입력값이 비어 있으면 0으로 처리할 수 있다", () => {
  const data = assertSuccess(
    calculateRoas({
      adCost: 100_000,
      adRevenue: 500_000,
      productCost: undefined,
      otherCost: undefined,
    }),
  );

  assert.equal(data.netProfitAfterAd, 400_000);
  assert.equal(data.contributionMarginRate, 100);
  assert.equal(data.breakEvenRoasRate, 100);
});

test("필수값 누락과 숫자가 아닌 값을 검증한다", () => {
  const errors = validateRoasInput({
    adCost: undefined,
    adRevenue: "500000",
    productCost: Number.NaN,
    otherCost: Infinity,
    targetRoas: 0,
  });

  assert.ok(errors.some((error) => error.field === "adCost" && error.code === "REQUIRED"));
  assert.ok(
    errors.some(
      (error) => error.field === "adRevenue" && error.code === "INVALID_NUMBER",
    ),
  );
  assert.ok(
    errors.some(
      (error) => error.field === "productCost" && error.code === "INVALID_NUMBER",
    ),
  );
  assert.ok(
    errors.some(
      (error) => error.field === "otherCost" && error.code === "INVALID_NUMBER",
    ),
  );
  assert.ok(
    errors.some(
      (error) => error.field === "targetRoas" && error.code === "MUST_BE_POSITIVE",
    ),
  );
});
