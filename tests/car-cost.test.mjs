import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  calculateCarCost,
  validateCarCostInput,
} from "../lib/calculators/car-cost/car-cost.ts";

const baseInput = {
  monthlyDistanceKm: 1000,
  fuelEfficiencyKmPerL: 12,
  fuelPricePerL: 1700,
  annualInsuranceCost: 900000,
  annualCarTax: 300000,
  monthlyMaintenanceCost: 50000,
  monthlyParkingCost: 100000,
  monthlyTollCost: 30000,
  monthlyEtcCost: 20000,
  includeLoanPayment: false,
  monthlyLoanPayment: 0,
  includeDepreciation: false,
  monthlyDepreciationCost: 0,
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

test("자동차 유지비의 모든 중간 결과를 계산한다", () => {
  const data = assertSuccess(calculateCarCost(baseInput));

  assert.deepEqual(data, {
    monthlyFuelUsageL: 83.33333333333333,
    monthlyFuelCost: 141667,
    annualFuelCost: 1700004,
    monthlyInsuranceCost: 75000,
    monthlyCarTax: 25000,
    monthlyFixedCost: 200000,
    monthlyVariableCost: 241667,
    monthlyOperatingCost: 441667,
    annualOperatingCost: 5300004,
    fuelCostPerKm: 142,
    operatingCostPerKm: 442,
    monthlyOptionalCost: 0,
    monthlyTotalCost: 441667,
    annualTotalCost: 5300004,
    totalCostPerKm: 442,
    includedLoanPayment: false,
    includedDepreciation: false,
    resultType: "carCost",
    summaryMessageKey: "monthlyTotalCostEstimated",
  });
});

test("할부금과 감가상각을 선택 비용으로 포함한다", () => {
  const data = assertSuccess(
    calculateCarCost({
      ...baseInput,
      includeLoanPayment: true,
      monthlyLoanPayment: 300000,
      includeDepreciation: true,
      monthlyDepreciationCost: 200000,
    }),
  );

  assert.equal(data.monthlyOptionalCost, 500000);
  assert.equal(data.monthlyOperatingCost, 441667);
  assert.equal(data.monthlyTotalCost, 941667);
  assert.equal(data.annualTotalCost, 11300004);
  assert.equal(data.totalCostPerKm, 942);
  assert.equal(data.includedLoanPayment, true);
  assert.equal(data.includedDepreciation, true);
});

test("선택 비용 미포함 상태에서는 입력 금액을 총 부담에 더하지 않는다", () => {
  const data = assertSuccess(
    calculateCarCost({
      ...baseInput,
      includeLoanPayment: false,
      monthlyLoanPayment: 300000,
      includeDepreciation: false,
      monthlyDepreciationCost: 200000,
    }),
  );

  assert.equal(data.monthlyOptionalCost, 0);
  assert.equal(data.monthlyTotalCost, data.monthlyOperatingCost);
  assert.equal(data.includedLoanPayment, false);
  assert.equal(data.includedDepreciation, false);
});

test("선택 비용 포함 상태에서도 금액 0원을 허용한다", () => {
  const errors = validateCarCostInput({
    ...baseInput,
    includeLoanPayment: true,
    monthlyLoanPayment: 0,
    includeDepreciation: true,
    monthlyDepreciationCost: 0,
  });

  assert.equal(errors.length, 0);
});

test("월 주행거리 1km 경계를 정상 계산한다", () => {
  const data = assertSuccess(
    calculateCarCost({ ...baseInput, monthlyDistanceKm: 1 }),
  );

  assert.equal(data.monthlyFuelUsageL, 1 / 12);
  assert.ok(data.totalCostPerKm > 0);
});

test("월 주행거리 0km와 연비 0은 오류로 반환한다", () => {
  assertHasError(
    calculateCarCost({ ...baseInput, monthlyDistanceKm: 0 }),
    "monthlyDistanceKm",
    "MUST_BE_POSITIVE",
  );
  assertHasError(
    calculateCarCost({ ...baseInput, fuelEfficiencyKmPerL: 0 }),
    "fuelEfficiencyKmPerL",
    "MUST_BE_POSITIVE",
  );
});

for (const [field, value] of [
  ["fuelPricePerL", 0],
  ["annualInsuranceCost", 0],
  ["annualCarTax", 0],
  ["monthlyMaintenanceCost", 0],
  ["monthlyParkingCost", 0],
  ["monthlyTollCost", 0],
  ["monthlyEtcCost", 0],
  ["monthlyLoanPayment", 0],
  ["monthlyDepreciationCost", 0],
]) {
  test(`${field} 0원은 정상 처리한다`, () => {
    const data = assertSuccess(calculateCarCost({ ...baseInput, [field]: value }));

    assert.ok(Number.isFinite(data.monthlyTotalCost));
  });
}

for (const field of [
  "fuelPricePerL",
  "annualInsuranceCost",
  "annualCarTax",
  "monthlyMaintenanceCost",
  "monthlyParkingCost",
  "monthlyTollCost",
  "monthlyEtcCost",
  "monthlyLoanPayment",
  "monthlyDepreciationCost",
]) {
  test(`${field} 음수 금액은 거부한다`, () => {
    assertHasError(
      calculateCarCost({ ...baseInput, [field]: -1 }),
      field,
      "MUST_BE_NON_NEGATIVE",
    );
  });
}

test("매우 큰 주행거리, 소수 연비, 소수 유류 단가를 계산한다", () => {
  const data = assertSuccess(
    calculateCarCost({
      ...baseInput,
      monthlyDistanceKm: 1_000_000,
      fuelEfficiencyKmPerL: 13.7,
      fuelPricePerL: 1688.5,
    }),
  );

  assert.ok(Number.isFinite(data.monthlyFuelUsageL));
  assert.ok(Number.isFinite(data.monthlyFuelCost));
  assert.ok(Number.isFinite(data.fuelCostPerKm));
  assert.equal(data.fuelCostPerKm, 123);
});

for (const invalidValue of [Number.NaN, Infinity, -Infinity]) {
  test(`${String(invalidValue)} 입력을 거부한다`, () => {
    assertHasError(
      calculateCarCost({ ...baseInput, monthlyEtcCost: invalidValue }),
      "monthlyEtcCost",
      "INVALID_NUMBER",
    );
  });
}

test("월 주행거리와 연비가 유효하지 않으면 부분 계산 결과를 반환하지 않는다", () => {
  const response = calculateCarCost({
    ...baseInput,
    monthlyDistanceKm: 0,
    fuelEfficiencyKmPerL: 0,
  });

  assert.equal(response.success, false);
  assert.equal("data" in response, false);
});

test("계산 함수는 입력 객체를 변경하지 않는다", () => {
  const input = { ...baseInput };
  const snapshot = structuredClone(input);

  calculateCarCost(input);

  assert.deepEqual(input, snapshot);
});

test("자동차 유지비 엔진은 React와 브라우저 API에 의존하지 않는다", () => {
  const source = readFileSync(
    new URL("../lib/calculators/car-cost/car-cost.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(
    source,
    /\b(?:React|window|document|navigator|localStorage)\b/,
  );
});
