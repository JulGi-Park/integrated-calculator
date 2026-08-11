import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { metadata } from "../app/calculators/overtime-pay/page.tsx";
import {
  calculateOvertimePayFromUnknown,
} from "../lib/calculators/overtime-pay/calculateOvertimePay.ts";

test("연장·야간·휴일근로수당 계산기는 전용 Open Graph와 Twitter 이미지를 사용한다", async () => {
  const image = "https://gyesanbox.kr/og/overtime-pay.png";
  const png = await readFile("public/og/overtime-pay.png");

  assert.equal(metadata.alternates.canonical, "https://gyesanbox.kr/calculators/overtime-pay/");
  assert.equal(metadata.openGraph.url, "https://gyesanbox.kr/calculators/overtime-pay/");
  assert.deepEqual(metadata.openGraph.images, [
    { url: image, width: 1200, height: 630, alt: metadata.title },
  ]);
  assert.equal(metadata.twitter.card, "summary_large_image");
  assert.deepEqual(metadata.twitter.images, [image]);
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
});
import { validateOvertimePayInput } from "../lib/calculators/overtime-pay/validation.ts";
import { buildOvertimePayResultText } from "../components/calculators/overtimePayClientUtils.ts";

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
  assert.equal(result.additionalAllowanceTotal, 10_000);
  assert.equal(result.totalExpectedPay, 30_000);
});

test("야간근로만 발생하면 50% 가산분만 가산수당 합계에 포함한다", () => {
  const result = assertSuccess(
    calculateOvertimePayFromUnknown({ ...baseInput, baseHours: 2, nightHours: 2 }),
  );

  assert.equal(result.nightPremiumPay, 10_000);
  assert.equal(result.additionalAllowanceTotal, 10_000);
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
  assert.equal(result.additionalAllowanceTotal, 20_000);
  assert.equal(result.totalExpectedPay, 40_000);
});

test("휴일근로 8시간 이내 8시간은 12만원이다", () => {
  const result = assertSuccess(
    calculateOvertimePayFromUnknown({ ...baseInput, holidayHoursWithin8: 8 }),
  );

  assert.equal(result.holidayPayWithin8, 120_000);
  assert.equal(result.additionalAllowanceTotal, 40_000);
});

test("휴일근로 8시간 초과 2시간은 4만원이다", () => {
  const result = assertSuccess(
    calculateOvertimePayFromUnknown({ ...baseInput, holidayHoursOver8: 2 }),
  );

  assert.equal(result.holidayPayOver8, 40_000);
  assert.equal(result.additionalAllowanceTotal, 20_000);
});

test("휴일근로 8시간 이내와 초과분의 가산분을 분리 합산한다", () => {
  const result = assertSuccess(
    calculateOvertimePayFromUnknown({
      ...baseInput,
      holidayHoursWithin8: 8,
      holidayHoursOver8: 2,
    }),
  );

  assert.equal(result.holidayPayWithin8, 120_000);
  assert.equal(result.holidayPayOver8, 40_000);
  assert.equal(result.additionalAllowanceTotal, 60_000);
  assert.equal(result.totalExpectedPay, 160_000);
});

test("휴일과 야간이 겹치면 각 가산분을 중복 합산한다", () => {
  const result = assertSuccess(
    calculateOvertimePayFromUnknown({
      ...baseInput,
      holidayHoursWithin8: 8,
      nightHours: 2,
    }),
  );

  assert.equal(result.additionalAllowanceTotal, 50_000);
  assert.equal(result.totalExpectedPay, 130_000);
});

test("연장과 휴일을 함께 입력해도 각 유형의 가산분만 합산한다", () => {
  const result = assertSuccess(
    calculateOvertimePayFromUnknown({
      ...baseInput,
      overtimeHours: 2,
      holidayHoursWithin8: 8,
    }),
  );

  assert.equal(result.additionalAllowanceTotal, 50_000);
  assert.equal(result.totalExpectedPay, 150_000);
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
  assert.equal(result.additionalAllowanceTotal, 20_000);
  assert.equal(result.totalExpectedPay, 120_000);
  assert.equal(result.totalEnteredHours, 10);
  assert.equal(result.extraComparedWithRegularPay, 20_000);
});

test("여러 유형이 함께 발생하면 가산수당 합계는 기본임금을 제외한다", () => {
  const result = assertSuccess(
    calculateOvertimePayFromUnknown({
      ...baseInput,
      overtimeHours: 2,
      nightHours: 2,
      holidayHoursWithin8: 8,
      holidayHoursOver8: 2,
    }),
  );

  assert.equal(result.totalExpectedPay, 200_000);
  assert.equal(result.additionalAllowanceTotal, 80_000);
  assert.equal(result.extraComparedWithRegularPay, 80_000);
});

test("복사·공유용 결과에도 가산수당 합계의 수정된 의미를 사용한다", () => {
  const input = {
    ...baseInput,
    overtimeHours: 2,
    nightHours: 2,
    holidayHoursWithin8: 8,
    holidayHoursOver8: 2,
  };
  const result = assertSuccess(calculateOvertimePayFromUnknown(input));
  const text = buildOvertimePayResultText(input, result);

  assert.match(text, /가산수당 합계: 80,000원/);
  assert.match(text, /총 예상 지급액: 200,000원/);
  assert.doesNotMatch(text, /일반 근로 대비 추가 금액/);
});

test("기본근로만 있으면 가산수당 합계는 0원이다", () => {
  const result = assertSuccess(
    calculateOvertimePayFromUnknown({ ...baseInput, baseHours: 8 }),
  );

  assert.equal(result.additionalAllowanceTotal, 0);
  assert.equal(result.extraComparedWithRegularPay, 0);
  assert.equal(result.totalExpectedPay, 80_000);
});

test("야간근로는 중복 가산 시간이므로 전체 실제 근로시간을 넘을 수 없다", () => {
  assertHasError(
    calculateOvertimePayFromUnknown({
      ...baseInput,
      baseHours: 1,
      nightHours: 2,
    }),
    "nightHours",
    "NIGHT_HOURS_EXCEED_WORK_HOURS",
  );
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
