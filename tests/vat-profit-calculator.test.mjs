import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateVatProfit,
  MAX_VAT_AMOUNT,
  validateVatProfitInput,
} from "../lib/calculators/vat-profit/vatProfit.ts";

const baseInput = {
  amountMode: "supply",
  salesAmount: 1_000_000,
  purchaseVat: 30_000,
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

test("공급가액 기준으로 매출세액, 합계금액, 예상 납부세액을 계산한다", () => {
  const data = assertSuccess(calculateVatProfit(baseInput));

  assert.equal(data.supplyAmount, 1_000_000);
  assert.equal(data.outputVat, 100_000);
  assert.equal(data.totalAmount, 1_100_000);
  assert.equal(data.purchaseVat, 30_000);
  assert.equal(data.expectedPayableVat, 70_000);
});

test("합계금액 기준으로 공급가액과 매출세액을 역산한다", () => {
  const data = assertSuccess(
    calculateVatProfit({
      amountMode: "total",
      salesAmount: 1_100_000,
      purchaseVat: 30_000,
    }),
  );

  assert.equal(data.supplyAmount, 1_000_000);
  assert.equal(data.outputVat, 100_000);
  assert.equal(data.totalAmount, 1_100_000);
  assert.equal(data.expectedPayableVat, 70_000);
});

test("매입세액이 매출세액보다 크면 음수 예상 납부세액을 반환한다", () => {
  const data = assertSuccess(
    calculateVatProfit({ ...baseInput, purchaseVat: 120_000 }),
  );

  assert.equal(data.expectedPayableVat, -20_000);
});

test("합계금액 역산은 원 단위 반올림 후 합계와 일치한다", () => {
  const data = assertSuccess(
    calculateVatProfit({
      amountMode: "total",
      salesAmount: 10_000,
      purchaseVat: 0,
    }),
  );

  assert.equal(data.supplyAmount, 9_091);
  assert.equal(data.outputVat, 909);
  assert.equal(data.supplyAmount + data.outputVat, data.totalAmount);
});

test("잘못된 입력 기준은 오류 처리한다", () => {
  assertHasError(
    calculateVatProfit({ ...baseInput, amountMode: "gross" }),
    "amountMode",
    "INVALID_MODE",
  );
});

for (const salesAmount of [0, -1]) {
  test(`매출 금액 ${salesAmount} 입력은 오류 처리한다`, () => {
    assertHasError(
      calculateVatProfit({ ...baseInput, salesAmount }),
      "salesAmount",
      "MUST_BE_POSITIVE",
    );
  });
}

test("매입세액 음수는 오류 처리한다", () => {
  assertHasError(
    calculateVatProfit({ ...baseInput, purchaseVat: -1 }),
    "purchaseVat",
    "MUST_BE_NON_NEGATIVE",
  );
});

test("NaN과 Infinity를 거부한다", () => {
  assertHasError(
    calculateVatProfit({ ...baseInput, salesAmount: Number.NaN }),
    "salesAmount",
    "INVALID_NUMBER",
  );
  assertHasError(
    calculateVatProfit({ ...baseInput, purchaseVat: Number.POSITIVE_INFINITY }),
    "purchaseVat",
    "INVALID_NUMBER",
  );
});

test("필수값 누락은 REQUIRED 오류를 반환한다", () => {
  const errors = validateVatProfitInput({
    amountMode: "supply",
    purchaseVat: 0,
  });

  assert.ok(
    errors.some(
      (error) => error.field === "salesAmount" && error.code === "REQUIRED",
    ),
  );
});

test("지나치게 큰 금액은 오류 처리한다", () => {
  assertHasError(
    calculateVatProfit({ ...baseInput, salesAmount: MAX_VAT_AMOUNT + 1 }),
    "salesAmount",
    "AMOUNT_OUT_OF_RANGE",
  );
});

test("계산 함수는 실제 신고와 다른 항목을 경고한다", () => {
  const data = assertSuccess(calculateVatProfit(baseInput));

  assert.ok(data.warnings.some((warning) => warning.includes("간이과세")));
  assert.ok(data.formulas.some((formula) => formula.includes("예상 납부세액")));
});
