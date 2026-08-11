import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { metadata } from "../app/calculators/card-installment/page.tsx";
import {
  calculateCardInstallment,
  calculateCardInstallmentFromUnknown,
} from "../lib/calculators/card-installment/calculate.ts";
import {
  CARD_INSTALLMENT_LIMITS,
  validateCardInstallmentInput,
} from "../lib/calculators/card-installment/validation.ts";

test("카드 할부 계산기는 전용 Open Graph와 Twitter 이미지를 사용한다", async () => {
  const image = "https://gyesanbox.kr/og/card-installment.png";
  const png = await readFile("public/og/card-installment.png");

  assert.equal(metadata.alternates.canonical, "https://gyesanbox.kr/calculators/card-installment/");
  assert.equal(metadata.openGraph.url, "https://gyesanbox.kr/calculators/card-installment/");
  assert.deepEqual(metadata.openGraph.images, [
    { url: image, width: 1200, height: 630, alt: metadata.title },
  ]);
  assert.equal(metadata.twitter.card, "summary_large_image");
  assert.deepEqual(metadata.twitter.images, [image]);
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
});

const baseInput = {
  purchaseAmount: 1_200_000,
  installmentMonths: 12,
  annualFeeRatePercent: 12,
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

function assertScheduleInvariants(result, purchaseAmount, installmentMonths) {
  assert.equal(result.schedule.length, installmentMonths);
  assert.equal(result.schedule[0].installmentNumber, 1);
  assert.equal(result.schedule.at(-1).installmentNumber, installmentMonths);
  assert.equal(result.schedule.at(-1).closingBalance, 0);

  const principalSum = result.schedule.reduce(
    (sum, item) => sum + item.principalPayment,
    0,
  );
  const feeSum = result.schedule.reduce((sum, item) => sum + item.fee, 0);
  const paymentSum = result.schedule.reduce(
    (sum, item) => sum + item.monthlyPayment,
    0,
  );

  assert.equal(principalSum, purchaseAmount);
  assert.equal(feeSum, result.totalFee);
  assert.equal(paymentSum, result.totalPayment);
  assert.equal(result.totalPayment, purchaseAmount + result.totalFee);
  assert.equal(result.extraCostComparedWithLumpSum, result.totalFee);

  for (let index = 0; index < result.schedule.length; index += 1) {
    const item = result.schedule[index];
    assert.equal(item.monthlyPayment, item.principalPayment + item.fee);
    assert.equal(item.closingBalance, item.openingBalance - item.principalPayment);
    assert.ok(Number.isSafeInteger(item.openingBalance));
    assert.ok(Number.isSafeInteger(item.principalPayment));
    assert.ok(Number.isSafeInteger(item.fee));
    assert.ok(Number.isSafeInteger(item.monthlyPayment));
    assert.ok(Number.isSafeInteger(item.closingBalance));
    assert.ok(Number.isFinite(item.openingBalance));
    assert.ok(Number.isFinite(item.fee));
    if (index > 0) {
      assert.equal(result.schedule[index - 1].closingBalance, item.openingBalance);
    }
  }
}

test("대표 케이스: 120만원·12개월·연 12% 할부 수수료를 계산한다", () => {
  const result = assertSuccess(calculateCardInstallmentFromUnknown(baseInput));

  assert.deepEqual(
    result.schedule.map((item) => item.fee),
    [
      12_000,
      11_000,
      10_000,
      9_000,
      8_000,
      7_000,
      6_000,
      5_000,
      4_000,
      3_000,
      2_000,
      1_000,
    ],
  );
  assert.equal(result.monthlyFeeRate, 0.01);
  assert.equal(result.baseMonthlyPrincipal, 100_000);
  assert.equal(result.totalFee, 78_000);
  assert.equal(result.totalPayment, 1_278_000);
  assertScheduleInvariants(result, 1_200_000, 12);
});

test("무이자 0% 할부는 수수료와 추가 부담액이 0원이다", () => {
  const result = assertSuccess(
    calculateCardInstallmentFromUnknown({
      ...baseInput,
      annualFeeRatePercent: 0,
    }),
  );

  assert.equal(result.totalFee, 0);
  assert.equal(result.totalPayment, 1_200_000);
  assert.equal(result.extraCostComparedWithLumpSum, 0);
  assert.deepEqual(
    result.schedule.map((item) => item.fee),
    Array.from({ length: 12 }, () => 0),
  );
});

test("100만원·10개월·연 15%의 월별 반올림 수수료를 계산한다", () => {
  const result = calculateCardInstallment({
    purchaseAmount: 1_000_000,
    installmentMonths: 10,
    annualFeeRatePercent: 15,
  });

  assert.deepEqual(
    result.schedule.map((item) => item.fee),
    [12_500, 11_250, 10_000, 8_750, 7_500, 6_250, 5_000, 3_750, 2_500, 1_250],
  );
  assert.equal(result.totalFee, 68_750);
  assert.equal(result.totalPayment, 1_068_750);
  assertScheduleInvariants(result, 1_000_000, 10);
});

test("마지막 회차 원금을 보정해 원금 합계를 맞춘다", () => {
  const result = calculateCardInstallment({
    purchaseAmount: 1_000_000,
    installmentMonths: 3,
    annualFeeRatePercent: 12,
  });

  assert.deepEqual(
    result.schedule.map((item) => item.principalPayment),
    [333_333, 333_333, 333_334],
  );
  assert.equal(
    result.schedule.reduce((sum, item) => sum + item.principalPayment, 0),
    1_000_000,
  );
  assert.equal(result.schedule.at(-1).closingBalance, 0);
});

test("빈 값과 숫자가 아닌 값을 구조화 오류로 반환한다", () => {
  for (const field of [
    "purchaseAmount",
    "installmentMonths",
    "annualFeeRatePercent",
  ]) {
    assertHasError(
      calculateCardInstallmentFromUnknown({ ...baseInput, [field]: "" }),
      field,
      "REQUIRED",
    );
    assertHasError(
      calculateCardInstallmentFromUnknown({ ...baseInput, [field]: "1" }),
      field,
      "INVALID_NUMBER",
    );
  }
});

test("NaN과 Infinity를 모든 입력 필드에서 거부한다", () => {
  for (const field of [
    "purchaseAmount",
    "installmentMonths",
    "annualFeeRatePercent",
  ]) {
    for (const value of [Number.NaN, Infinity, -Infinity]) {
      assertHasError(
        calculateCardInstallmentFromUnknown({ ...baseInput, [field]: value }),
        field,
        "INVALID_NUMBER",
      );
    }
  }
});

test("구매금액 0원·음수·소수·안전 정수 초과를 거부한다", () => {
  assertHasError(
    calculateCardInstallmentFromUnknown({ ...baseInput, purchaseAmount: 0 }),
    "purchaseAmount",
    "MUST_BE_POSITIVE",
  );
  assertHasError(
    calculateCardInstallmentFromUnknown({ ...baseInput, purchaseAmount: -1 }),
    "purchaseAmount",
    "MUST_BE_POSITIVE",
  );
  assertHasError(
    calculateCardInstallmentFromUnknown({ ...baseInput, purchaseAmount: 1.5 }),
    "purchaseAmount",
    "MUST_BE_INTEGER",
  );
  assertHasError(
    calculateCardInstallmentFromUnknown({
      ...baseInput,
      purchaseAmount: Number.MAX_SAFE_INTEGER + 1,
    }),
    "purchaseAmount",
    "MUST_BE_SAFE_INTEGER",
  );
});

test("입력 상한 경계를 허용하고 초과를 거부한다", () => {
  assert.equal(
    validateCardInstallmentInput({
      purchaseAmount: CARD_INSTALLMENT_LIMITS.maximumPurchaseAmount,
      installmentMonths: CARD_INSTALLMENT_LIMITS.maximumInstallmentMonths,
      annualFeeRatePercent: CARD_INSTALLMENT_LIMITS.maximumAnnualFeeRatePercent,
    }).length,
    0,
  );
  assertHasError(
    calculateCardInstallmentFromUnknown({
      ...baseInput,
      purchaseAmount: CARD_INSTALLMENT_LIMITS.maximumPurchaseAmount + 1,
    }),
    "purchaseAmount",
    "AMOUNT_EXCEEDS_LIMIT",
  );
  assertHasError(
    calculateCardInstallmentFromUnknown({
      ...baseInput,
      installmentMonths: CARD_INSTALLMENT_LIMITS.maximumInstallmentMonths + 1,
    }),
    "installmentMonths",
    "MONTHS_EXCEEDS_LIMIT",
  );
  assertHasError(
    calculateCardInstallmentFromUnknown({
      ...baseInput,
      annualFeeRatePercent:
        CARD_INSTALLMENT_LIMITS.maximumAnnualFeeRatePercent + 0.1,
    }),
    "annualFeeRatePercent",
    "RATE_EXCEEDS_LIMIT",
  );
});

test("할부 개월 수 1 미만·소수·안전 정수 초과를 거부한다", () => {
  assertHasError(
    calculateCardInstallmentFromUnknown({ ...baseInput, installmentMonths: 0 }),
    "installmentMonths",
    "MUST_BE_POSITIVE",
  );
  assertHasError(
    calculateCardInstallmentFromUnknown({ ...baseInput, installmentMonths: 1.5 }),
    "installmentMonths",
    "MUST_BE_INTEGER",
  );
  assertHasError(
    calculateCardInstallmentFromUnknown({
      ...baseInput,
      installmentMonths: Number.MAX_SAFE_INTEGER + 1,
    }),
    "installmentMonths",
    "MUST_BE_SAFE_INTEGER",
  );
});

test("수수료율 음수는 거부하고 0%는 허용한다", () => {
  assertHasError(
    calculateCardInstallmentFromUnknown({
      ...baseInput,
      annualFeeRatePercent: -0.01,
    }),
    "annualFeeRatePercent",
    "MUST_BE_NON_NEGATIVE",
  );
  assert.equal(
    validateCardInstallmentInput({
      ...baseInput,
      annualFeeRatePercent: 0,
    }).length,
    0,
  );
});
