import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateOvertimePayFromUnknown,
} from "../lib/calculators/overtime-pay/calculateOvertimePay.ts";
import { validateOvertimePayInput } from "../lib/calculators/overtime-pay/validation.ts";

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

const baseInput = {
  hourlyWage: 10_000,
  baseHours: 0,
  overtimeHours: 0,
  nightHours: 0,
  holidayHoursWithin8: 0,
  holidayHoursOver8: 0,
  rounding: "round",
};

test("시급 1만원, 연장 2시간은 연장근로수당 3만원이다", () => {
  const result = assertSuccess(
    calculateOvertimePayFromUnknown({ ...baseInput, overtimeHours: 2 }),
  );

  assert.equal(result.overtimePay, 30_000);
  assert.equal(result.totalExpectedPay, 30_000);
});

test("연장 2시간과 야간 2시간이 겹치면 총 2.0배 구조가 된다", () => {
  const result = assertSuccess(
    calculateOvertimePayFromUnknown({
      ...baseInput,
      overtimeHours: 2,
      nightHours: 2,
    }),
  );

  assert.equal(result.overtimePay, 30_000);
  assert.equal(result.nightPremiumPay, 10_000);
  assert.equal(result.totalExpectedPay, 40_000);
});

test("휴일근로 8시간 이내 8시간은 12만원이다", () => {
  const result = assertSuccess(
    calculateOvertimePayFromUnknown({ ...baseInput, holidayHoursWithin8: 8 }),
  );

  assert.equal(result.holidayPayWithin8, 120_000);
});

test("휴일근로 8시간 초과 2시간은 4만원이다", () => {
  const result = assertSuccess(
    calculateOvertimePayFromUnknown({ ...baseInput, holidayHoursOver8: 2 }),
  );

  assert.equal(result.holidayPayOver8, 40_000);
});

test("기본 8시간, 연장 2시간, 야간 2시간의 총 예상 지급액은 12만원이다", () => {
  const result = assertSuccess(
    calculateOvertimePayFromUnknown({
      ...baseInput,
      baseHours: 8,
      overtimeHours: 2,
      nightHours: 2,
    }),
  );

  assert.equal(result.basePay, 80_000);
  assert.equal(result.overtimePay, 30_000);
  assert.equal(result.nightPremiumPay, 10_000);
  assert.equal(result.totalExpectedPay, 120_000);
});

test("모든 시간이 0이면 오류다", () => {
  assertHasError(
    calculateOvertimePayFromUnknown(baseInput),
    "baseHours",
    "NO_WORK_HOURS",
  );
});

test("음수, NaN, Infinity, 문자열 입력을 방어한다", () => {
  assertHasError(
    calculateOvertimePayFromUnknown({ ...baseInput, hourlyWage: -1 }),
    "hourlyWage",
    "MUST_BE_POSITIVE",
  );
  assertHasError(
    calculateOvertimePayFromUnknown({ ...baseInput, overtimeHours: -1 }),
    "overtimeHours",
    "MUST_BE_NON_NEGATIVE",
  );

  for (const value of [Number.NaN, Infinity, -Infinity, "1"]) {
    assertHasError(
      calculateOvertimePayFromUnknown({
        ...baseInput,
        hourlyWage: value,
        overtimeHours: 1,
      }),
      "hourlyWage",
      "INVALID_NUMBER",
    );
  }
});

test("상한 초과 입력을 거부한다", () => {
  assertHasError(
    calculateOvertimePayFromUnknown({
      ...baseInput,
      hourlyWage: 100_000_001,
      overtimeHours: 1,
    }),
    "hourlyWage",
    "WAGE_EXCEEDS_LIMIT",
  );
  assertHasError(
    calculateOvertimePayFromUnknown({
      ...baseInput,
      overtimeHours: 10_001,
    }),
    "overtimeHours",
    "HOURS_EXCEED_LIMIT",
  );
  assert.equal(
    validateOvertimePayInput({
      ...baseInput,
      hourlyWage: 100_000_000,
      overtimeHours: 10_000,
    }).length,
    0,
  );
});
