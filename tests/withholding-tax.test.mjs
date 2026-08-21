import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateRequiredGrossAmount,
  calculateWithholdingTax,
  calculateWithholdingTaxFromUnknown,
  validateWithholdingTaxAmount,
} from "../lib/calculators/withholding-tax/withholdingTax.ts";

test("세전 100만원의 소득세·개인지방소득세·실수령액을 계산한다", () => {
  assert.deepEqual(calculateWithholdingTax(1_000_000), { grossAmount: 1_000_000, incomeTax: 30_000, localIncomeTax: 3_000, totalWithholdingTax: 33_000, netAmount: 967_000 });
});

test("세전 300만원의 소득세·개인지방소득세·실수령액을 계산한다", () => {
  assert.deepEqual(calculateWithholdingTax(3_000_000), { grossAmount: 3_000_000, incomeTax: 90_000, localIncomeTax: 9_000, totalWithholdingTax: 99_000, netAmount: 2_901_000 });
});

test("소득세와 개인지방소득세를 각각 10원 미만 버림 처리한다", () => {
  assert.deepEqual(calculateWithholdingTax(123_456), { grossAmount: 123_456, incomeTax: 3_700, localIncomeTax: 370, totalWithholdingTax: 4_070, netAmount: 119_386 });
});

test("인적용역 사업소득의 소액부징수 예외를 반영해 1천원 미만 소득세도 계산한다", () => {
  assert.deepEqual(calculateWithholdingTax(33_333), { grossAmount: 33_333, incomeTax: 990, localIncomeTax: 90, totalWithholdingTax: 1_080, netAmount: 32_253 });
});

test("실수령액 967,000원은 세전 1,000,000원으로 역산하고 forward 결과를 검증한다", () => {
  const result = calculateRequiredGrossAmount(967_000);
  assert.equal(result.grossAmount, 1_000_000);
  assert.equal(calculateWithholdingTax(result.grossAmount).netAmount, 967_000);
});

test("역산은 3.3% 역산 기준부터 목표 실수령액 이상을 만족하도록 forward 검증한다", () => {
  const target = 119_387;
  const result = calculateRequiredGrossAmount(target);
  assert.ok(result.netAmount >= target);
  assert.ok(result.grossAmount >= Math.ceil(target / 0.967));
});

test("빈값·0·음수·소수·문자·과대 금액을 거부한다", () => {
  for (const value of [undefined, 0, -1, 1.5, "1000", 1_000_000_000_001]) assert.ok(validateWithholdingTaxAmount(value));
  assert.equal(calculateWithholdingTaxFromUnknown(1_000_000).success, true);
});
