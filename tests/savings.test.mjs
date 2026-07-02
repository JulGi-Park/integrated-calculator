import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  calculateSavings,
  GENERAL_INCOME_TAX_RATE,
  GENERAL_TOTAL_TAX_RATE,
  LOCAL_INCOME_TAX_RATE_ON_INCOME_TAX,
  validateSavingsInput,
} from "../lib/calculators/savings/savings.ts";

const baseInput = {
  productType: "deposit",
  amount: 10_000_000,
  termMonths: 12,
  annualInterestRate: 4,
  taxType: "general",
  interestType: "simple",
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

test("예금의 원금, 세전 이자, 세금, 세후 만기 수령액을 계산한다", () => {
  const data = assertSuccess(calculateSavings(baseInput));

  assert.deepEqual(data, {
    productType: "deposit",
    principalTotal: 10_000_000,
    grossInterest: 400_000,
    incomeTax: 56_000,
    localIncomeTax: 5_600,
    totalTax: 61_600,
    netInterest: 338_400,
    maturityAmount: 10_338_400,
    appliedTaxRate: GENERAL_TOTAL_TAX_RATE,
    appliedIncomeTaxRate: GENERAL_INCOME_TAX_RATE,
    appliedLocalIncomeTaxRate: LOCAL_INCOME_TAX_RATE_ON_INCOME_TAX,
    termMonths: 12,
    annualInterestRate: 4,
    depositAmount: 10_000_000,
    monthlyPayment: undefined,
    interestType: "simple",
    taxType: "general",
    installmentInterestMonthSum: undefined,
    resultType: "savings",
    summaryMessageKey: "maturityAmountEstimated",
  });
});

test("정기적금은 기간 합산식을 반영해 세전 이자를 계산한다", () => {
  const data = assertSuccess(
    calculateSavings({
      ...baseInput,
      productType: "installment",
      amount: 300_000,
      termMonths: 12,
      annualInterestRate: 4,
    }),
  );

  assert.equal(data.principalTotal, 3_600_000);
  assert.equal(data.installmentInterestMonthSum, 78);
  assert.equal(data.grossInterest, 78_000);
  assert.equal(data.incomeTax, 10_920);
  assert.equal(data.localIncomeTax, 1_092);
  assert.equal(data.totalTax, 12_012);
  assert.equal(data.netInterest, 65_988);
  assert.equal(data.maturityAmount, 3_665_988);
  assert.equal(data.monthlyPayment, 300_000);
});

test("비과세는 세금을 0원으로 계산한다", () => {
  const data = assertSuccess(
    calculateSavings({ ...baseInput, taxType: "taxFree" }),
  );

  assert.equal(data.incomeTax, 0);
  assert.equal(data.localIncomeTax, 0);
  assert.equal(data.totalTax, 0);
  assert.equal(data.netInterest, 400_000);
  assert.equal(data.maturityAmount, 10_400_000);
  assert.equal(data.appliedTaxRate, 0);
});

test("기간 1개월 예금과 적금을 정상 계산한다", () => {
  const deposit = assertSuccess(
    calculateSavings({ ...baseInput, termMonths: 1 }),
  );
  const installment = assertSuccess(
    calculateSavings({
      ...baseInput,
      productType: "installment",
      amount: 100_000,
      termMonths: 1,
    }),
  );

  assert.equal(deposit.grossInterest, 33_333);
  assert.equal(installment.grossInterest, 333);
  assert.equal(installment.installmentInterestMonthSum, 1);
});

test("연 이율 0%는 이자를 0원으로 계산한다", () => {
  const data = assertSuccess(
    calculateSavings({ ...baseInput, annualInterestRate: 0 }),
  );

  assert.equal(data.grossInterest, 0);
  assert.equal(data.totalTax, 0);
  assert.equal(data.maturityAmount, data.principalTotal);
});

test("원 단위 반올림을 일관되게 적용한다", () => {
  const data = assertSuccess(
    calculateSavings({
      ...baseInput,
      amount: 123_456,
      termMonths: 7,
      annualInterestRate: 3.33,
    }),
  );

  assert.equal(data.grossInterest, 2398);
  assert.equal(data.incomeTax, 336);
  assert.equal(data.localIncomeTax, 34);
  assert.equal(data.totalTax, 370);
  assert.equal(data.netInterest, 2028);
});

test("금액 0원과 음수 금액을 거부한다", () => {
  assertHasError(
    calculateSavings({ ...baseInput, amount: 0 }),
    "amount",
    "MUST_BE_POSITIVE",
  );
  assertHasError(
    calculateSavings({ ...baseInput, amount: -1 }),
    "amount",
    "MUST_BE_POSITIVE",
  );
});

test("숫자가 아닌 값과 NaN, Infinity를 거부한다", () => {
  assertHasError(
    calculateSavings({ ...baseInput, amount: "1000" }),
    "amount",
    "INVALID_NUMBER",
  );

  for (const invalidValue of [Number.NaN, Infinity, -Infinity]) {
    assertHasError(
      calculateSavings({ ...baseInput, annualInterestRate: invalidValue }),
      "annualInterestRate",
      "INVALID_NUMBER",
    );
  }
});

test("기간 경계값을 검증한다", () => {
  assert.equal(validateSavingsInput({ ...baseInput, termMonths: 600 }).length, 0);
  assertHasError(
    calculateSavings({ ...baseInput, termMonths: 0 }),
    "termMonths",
    "MUST_BE_POSITIVE",
  );
  assertHasError(
    calculateSavings({ ...baseInput, termMonths: 12.5 }),
    "termMonths",
    "MUST_BE_INTEGER",
  );
  assertHasError(
    calculateSavings({ ...baseInput, termMonths: 601 }),
    "termMonths",
    "TERM_TOO_LARGE",
  );
});

test("연 이율 경계값을 검증한다", () => {
  assertHasError(
    calculateSavings({ ...baseInput, annualInterestRate: -0.01 }),
    "annualInterestRate",
    "MUST_BE_NON_NEGATIVE",
  );
  assertHasError(
    calculateSavings({ ...baseInput, annualInterestRate: 100 }),
    "annualInterestRate",
    "RATE_TOO_LARGE",
  );
});

test("지원하지 않는 상품, 과세, 이자 방식을 거부한다", () => {
  assertHasError(
    calculateSavings({ ...baseInput, productType: "free" }),
    "productType",
    "INVALID_PRODUCT_TYPE",
  );
  assertHasError(
    calculateSavings({ ...baseInput, taxType: "custom" }),
    "taxType",
    "INVALID_TAX_TYPE",
  );
  assertHasError(
    calculateSavings({ ...baseInput, interestType: "compound" }),
    "interestType",
    "INVALID_INTEREST_TYPE",
  );
});

test("계산 함수는 입력 객체를 변경하지 않는다", () => {
  const input = { ...baseInput };
  const snapshot = structuredClone(input);

  calculateSavings(input);

  assert.deepEqual(input, snapshot);
});

test("예금 적금 엔진은 React와 브라우저 API에 의존하지 않는다", () => {
  const source = readFileSync(
    new URL("../lib/calculators/savings/savings.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(
    source,
    /\b(?:React|window|document|navigator|localStorage)\b/,
  );
});
