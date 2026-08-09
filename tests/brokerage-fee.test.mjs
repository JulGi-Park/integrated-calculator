import assert from "node:assert/strict";
import test from "node:test";
import {
  BROKERAGE_FEE_MAX_INPUT,
  calculateBrokerageFee,
} from "../lib/calculators/brokerage-fee/brokerage-fee.ts";

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

test("주택 매매 4,000만원은 0.6% 계산값 24만원을 적용한다", () => {
  const data = assertSuccess(
    calculateBrokerageFee({
      transactionType: "sale",
      transactionAmount: 40_000_000,
    }),
  );

  assert.equal(data.maxRatePercent, 0.6);
  assert.equal(data.baseFee, 240_000);
  assert.equal(data.limitAmount, 250_000);
});

test("주택 매매 1억 8,000만원은 80만원 한도액을 적용한다", () => {
  const data = assertSuccess(
    calculateBrokerageFee({
      transactionType: "sale",
      transactionAmount: 180_000_000,
    }),
  );

  assert.equal(data.maxRatePercent, 0.5);
  assert.equal(data.baseFee, 800_000);
  assert.equal(data.limitAmount, 800_000);
});

test("주택 매매 2억원 이상 9억원 미만은 0.4%와 한도 없음 구간이다", () => {
  const data = assertSuccess(
    calculateBrokerageFee({
      transactionType: "sale",
      transactionAmount: 500_000_000,
    }),
  );

  assert.equal(data.maxRatePercent, 0.4);
  assert.equal(data.limitAmount, null);
  assert.equal(data.baseFee, 2_000_000);
});

test("주택 매매 15억원 이상은 0.7%를 적용한다", () => {
  const data = assertSuccess(
    calculateBrokerageFee({
      transactionType: "sale",
      transactionAmount: 1_500_000_000,
    }),
  );

  assert.equal(data.maxRatePercent, 0.7);
  assert.equal(data.baseFee, 10_500_000);
});

for (const [amount, ratePercent] of [
  [50_000_000, 0.5],
  [200_000_000, 0.4],
  [900_000_000, 0.5],
  [1_200_000_000, 0.6],
]) {
  test(`주택 매매 ${amount.toLocaleString("ko-KR")}원 경계는 ${ratePercent}% 구간을 적용한다`, () => {
    const data = assertSuccess(
      calculateBrokerageFee({ transactionType: "sale", transactionAmount: amount }),
    );

    assert.equal(data.maxRatePercent, ratePercent);
  });
}

test("주택 전세 5천만원 미만은 0.5%와 20만원 한도액을 적용한다", () => {
  const data = assertSuccess(
    calculateBrokerageFee({
      transactionType: "jeonse",
      jeonseDeposit: 49_000_000,
    }),
  );

  assert.equal(data.maxRatePercent, 0.5);
  assert.equal(data.limitAmount, 200_000);
  assert.equal(data.baseFee, 200_000);
});

test("주택 전세 1억원 이상 6억원 미만은 0.3%와 한도 없음 구간이다", () => {
  const data = assertSuccess(
    calculateBrokerageFee({
      transactionType: "jeonse",
      jeonseDeposit: 300_000_000,
    }),
  );

  assert.equal(data.maxRatePercent, 0.3);
  assert.equal(data.limitAmount, null);
  assert.equal(data.baseFee, 900_000);
});

for (const [deposit, ratePercent] of [
  [50_000_000, 0.4],
  [100_000_000, 0.3],
  [600_000_000, 0.4],
  [1_200_000_000, 0.5],
  [1_500_000_000, 0.6],
]) {
  test(`주택 임대차 ${deposit.toLocaleString("ko-KR")}원 경계는 ${ratePercent}% 구간을 적용한다`, () => {
    const data = assertSuccess(
      calculateBrokerageFee({ transactionType: "jeonse", jeonseDeposit: deposit }),
    );

    assert.equal(data.maxRatePercent, ratePercent);
  });
}

test("월세 보증금 1,000만원 월세 40만원은 5천만원 이상 구간을 적용한다", () => {
  const data = assertSuccess(
    calculateBrokerageFee({
      transactionType: "monthlyRent",
      monthlyRentDeposit: 10_000_000,
      monthlyRent: 400_000,
    }),
  );

  assert.equal(data.firstMonthlyRentConvertedAmount, 50_000_000);
  assert.equal(data.monthlyRentRecalculated, false);
  assert.equal(data.appliedTransactionAmount, 50_000_000);
  assert.equal(data.maxRatePercent, 0.4);
  assert.equal(data.limitAmount, 300_000);
  assert.equal(data.baseFee, 200_000);
});

test("월세 보증금 500만원 월세 30만원은 70배 재계산을 적용한다", () => {
  const data = assertSuccess(
    calculateBrokerageFee({
      transactionType: "monthlyRent",
      monthlyRentDeposit: 5_000_000,
      monthlyRent: 300_000,
    }),
  );

  assert.equal(data.firstMonthlyRentConvertedAmount, 35_000_000);
  assert.equal(data.monthlyRentRecalculated, true);
  assert.equal(data.finalMonthlyRentConvertedAmount, 26_000_000);
  assert.equal(data.appliedTransactionAmount, 26_000_000);
});

test("부가세 10% 포함 금액을 계산한다", () => {
  const data = assertSuccess(
    calculateBrokerageFee({
      transactionType: "sale",
      transactionAmount: 40_000_000,
    }),
  );

  assert.equal(data.vatAmount, 24_000);
  assert.equal(data.vatIncludedFee, 264_000);
});

test("협의요율 입력 시 협의보수를 계산한다", () => {
  const data = assertSuccess(
    calculateBrokerageFee({
      transactionType: "sale",
      transactionAmount: 500_000_000,
      negotiatedRatePercent: 0.3,
    }),
  );

  assert.equal(data.negotiatedFee, 1_500_000);
  assert.equal(data.negotiatedVatIncludedFee, 1_650_000);
});

test("협의요율이 상한요율을 초과하면 오류를 반환한다", () => {
  assertHasError(
    calculateBrokerageFee({
      transactionType: "sale",
      transactionAmount: 500_000_000,
      negotiatedRatePercent: 0.41,
    }),
    "negotiatedRatePercent",
    "RATE_EXCEEDS_MAX",
  );
});

test("거래금액 0 이하를 거부한다", () => {
  assertHasError(
    calculateBrokerageFee({ transactionType: "sale", transactionAmount: 0 }),
    "transactionAmount",
    "MUST_BE_POSITIVE",
  );
});

test("월세 음수와 보증금 음수를 거부한다", () => {
  assertHasError(
    calculateBrokerageFee({
      transactionType: "monthlyRent",
      monthlyRentDeposit: 0,
      monthlyRent: -1,
    }),
    "monthlyRent",
    "MUST_BE_NON_NEGATIVE",
  );
  assertHasError(
    calculateBrokerageFee({
      transactionType: "monthlyRent",
      monthlyRentDeposit: -1,
      monthlyRent: 0,
    }),
    "monthlyRentDeposit",
    "MUST_BE_NON_NEGATIVE",
  );
});

test("월세 보증금과 월세가 모두 0이면 오류를 반환한다", () => {
  assertHasError(
    calculateBrokerageFee({
      transactionType: "monthlyRent",
      monthlyRentDeposit: 0,
      monthlyRent: 0,
    }),
    "monthlyRent",
    "RENT_REQUIRES_VALUE",
  );
});

for (const invalidValue of ["100", null, undefined]) {
  test(`숫자가 아닌 거래금액 ${String(invalidValue)}을 거부한다`, () => {
    assertHasError(
      calculateBrokerageFee({
        transactionType: "sale",
        transactionAmount: invalidValue,
      }),
      "transactionAmount",
      "INVALID_NUMBER",
    );
  });
}

for (const invalidValue of [Number.NaN, Infinity, -Infinity]) {
  test(`${String(invalidValue)} 입력을 거부한다`, () => {
    assertHasError(
      calculateBrokerageFee({
        transactionType: "sale",
        transactionAmount: invalidValue,
      }),
      "transactionAmount",
      "INVALID_NUMBER",
    );
  });
}

test("과도하게 큰 값을 거부한다", () => {
  assertHasError(
    calculateBrokerageFee({
      transactionType: "sale",
      transactionAmount: BROKERAGE_FEE_MAX_INPUT + 1,
    }),
    "transactionAmount",
    "TOO_LARGE",
  );
});

test("지원하지 않는 거래유형을 거부한다", () => {
  assertHasError(
    calculateBrokerageFee({
      transactionType: "office",
      transactionAmount: 100_000_000,
    }),
    "transactionType",
    "INVALID_TRANSACTION_TYPE",
  );
});

test("계산 함수는 입력 객체를 변경하지 않는다", () => {
  const input = {
    transactionType: "monthlyRent",
    monthlyRentDeposit: 10_000_000,
    monthlyRent: 400_000,
  };
  const snapshot = structuredClone(input);

  calculateBrokerageFee(input);

  assert.deepEqual(input, snapshot);
});
