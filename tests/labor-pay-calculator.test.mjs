import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateLaborPay,
  MAX_HOURLY_WAGE,
  MINIMUM_HOURLY_WAGE_2026,
  validateLaborPayInput,
} from "../lib/calculators/labor-pay/laborPay.ts";

const baseInput = {
  hourlyWage: 10_320,
  weeklyScheduledHours: 40,
  weeklyActualHours: 40,
  weeklyWorkDays: 5,
  isFullAttendance: true,
  includeMonthlyEstimate: false,
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

test("2026년 최저임금, 주 40시간, 개근 true이면 주휴 8시간과 82,560원을 계산한다", () => {
  const data = assertSuccess(calculateLaborPay(baseInput));

  assert.equal(data.isEligible, true);
  assert.equal(data.weeklyHolidayHours, 8);
  assert.equal(data.weeklyHolidayPay, 82_560);
  assert.equal(data.baseWeeklyPay, 412_800);
  assert.equal(data.weeklyPayIncludingHoliday, 495_360);
});

test("주 20시간이면 주휴 4시간과 41,280원을 계산한다", () => {
  const data = assertSuccess(
    calculateLaborPay({
      ...baseInput,
      weeklyScheduledHours: 20,
      weeklyActualHours: 20,
    }),
  );

  assert.equal(data.weeklyHolidayHours, 4);
  assert.equal(data.weeklyHolidayPay, 41_280);
});

test("주 18시간·주 6일이면 1일 평균 3시간으로 주휴시간을 계산한다", () => {
  const data = assertSuccess(
    calculateLaborPay({
      ...baseInput,
      weeklyScheduledHours: 18,
      weeklyActualHours: 18,
      weeklyWorkDays: 6,
    }),
  );

  assert.equal(data.effectiveWorkDays, 6);
  assert.equal(data.weeklyHolidayHours, 3);
});

test("간편 모드는 통상근로일 입력을 그대로 분모로 사용한다", () => {
  const data = assertSuccess(
    calculateLaborPay({
      ...baseInput,
      weeklyScheduledHours: 18,
      weeklyActualHours: 18,
      weeklyWorkDays: 4,
    }),
  );

  assert.equal(data.effectiveWorkDays, 4);
  assert.equal(data.weeklyHolidayHours, 4.5);
});

test("간편 모드는 5일 가정이 기본이며 분모를 자동 보정하지 않는다", () => {
  const data = assertSuccess(
    calculateLaborPay({
      ...baseInput,
      weeklyScheduledHours: 15,
      weeklyActualHours: 15,
      weeklyWorkDays: 3,
    }),
  );

  assert.equal(data.isEligible, true);
  assert.equal(data.effectiveWorkDays, 3);
  assert.equal(data.weeklyHolidayHours, 5);
});

test("상세 모드: 4주 60시간·통상근로일 20일은 3시간과 30,960원", () => {
  const data = assertSuccess(calculateLaborPay({ ...baseInput, mode: "detailed", weeklyScheduledHours: 15, weeklyActualHours: 15, fourWeekScheduledHours: 60, ordinaryWorkerFourWeekWorkDays: 20, hasComparableWorker: true, employmentWeeks: 4, employmentContinuesThroughHoliday: true }));
  assert.equal(data.eligibilityBasisHours, 15);
  assert.equal(data.weeklyHolidayHours, 3);
  assert.equal(data.weeklyHolidayPay, 30_960);
});

test("상세 모드: 통상근로일 24일은 2.5시간과 25,800원", () => {
  const data = assertSuccess(calculateLaborPay({ ...baseInput, mode: "detailed", weeklyScheduledHours: 15, weeklyActualHours: 15, fourWeekScheduledHours: 60, ordinaryWorkerFourWeekWorkDays: 24, hasComparableWorker: true, employmentWeeks: 4, employmentContinuesThroughHoliday: true }));
  assert.equal(data.weeklyHolidayHours, 2.5);
  assert.equal(data.weeklyHolidayPay, 25_800);
});

for (const [hours, days, expectedHours, expectedPay] of [
  [96, 20, 4.8, 49_536],
  [96, 24, 4, 41_280],
]) {
  test(`상세 모드: 4주 ${hours}시간·통상근로일 ${days}일 산정`, () => {
    const data = assertSuccess(calculateLaborPay({ ...baseInput, mode: "detailed", weeklyScheduledHours: 24, weeklyActualHours: 24, fourWeekScheduledHours: hours, ordinaryWorkerFourWeekWorkDays: days, hasComparableWorker: true, employmentWeeks: 4, employmentContinuesThroughHoliday: true }));
    assert.equal(data.weeklyHolidayHours, expectedHours);
    assert.equal(data.weeklyHolidayPay, expectedPay);
  });
}

test("상세 모드: 불규칙 4주 64시간·통상근로일 20일은 3.2시간", () => {
  const data = assertSuccess(calculateLaborPay({ ...baseInput, mode: "detailed", weeklyScheduledHours: 20, weeklyActualHours: 20, fourWeekScheduledHours: 64, ordinaryWorkerFourWeekWorkDays: 20, hasComparableWorker: true, employmentWeeks: 4, employmentContinuesThroughHoliday: true }));
  assert.equal(data.eligibilityBasisHours, 16);
  assert.equal(data.weeklyHolidayHours, 3.2);
  assert.equal(data.weeklyHolidayPay, 33_024);
});

test("상세 모드는 4주 미만이면 금액 대신 수동 확인을 요구한다", () => {
  const data = assertSuccess(calculateLaborPay({ ...baseInput, mode: "detailed", fourWeekScheduledHours: 30, ordinaryWorkerFourWeekWorkDays: 20, hasComparableWorker: true, employmentWeeks: 2, employmentContinuesThroughHoliday: true }));
  assert.equal(data.requiresManualReview, true);
  assert.equal(data.isEligible, false);
});

test("상세 모드는 비교 근로자가 없으면 금액 산출을 보류한다", () => {
  const data = assertSuccess(calculateLaborPay({ ...baseInput, mode: "detailed", fourWeekScheduledHours: 60, ordinaryWorkerFourWeekWorkDays: 20, hasComparableWorker: false, employmentWeeks: 4, employmentContinuesThroughHoliday: true }));
  assert.equal(data.requiresManualReview, true);
  assert.equal(data.weeklyHolidayPay, 0);
});

test("상세 모드는 주휴일 전 근로관계 종료 조건이면 금액 산출을 보류한다", () => {
  const data = assertSuccess(calculateLaborPay({ ...baseInput, mode: "detailed", fourWeekScheduledHours: 60, ordinaryWorkerFourWeekWorkDays: 20, hasComparableWorker: true, employmentWeeks: 4, employmentContinuesThroughHoliday: false }));
  assert.equal(data.requiresManualReview, true);
});

test("주 14시간이면 지급 대상이 아니다", () => {
  const data = assertSuccess(
    calculateLaborPay({ ...baseInput, weeklyScheduledHours: 14 }),
  );

  assert.equal(data.isEligible, false);
  assert.equal(data.weeklyHolidayPay, 0);
  assert.ok(data.reasons.some((reason) => reason.includes("15시간 미만")));
});

test("주 15시간이면 지급 대상이다", () => {
  const data = assertSuccess(
    calculateLaborPay({ ...baseInput, weeklyScheduledHours: 15 }),
  );

  assert.equal(data.isEligible, true);
  assert.equal(data.weeklyHolidayHours, 3);
});

test("개근 false이면 지급 대상이 아니고 주휴수당은 0원이다", () => {
  const data = assertSuccess(
    calculateLaborPay({ ...baseInput, isFullAttendance: false }),
  );

  assert.equal(data.isEligible, false);
  assert.equal(data.weeklyHolidayPay, 0);
  assert.ok(data.reasons.some((reason) => reason.includes("개근")));
});

test("1주 소정근로시간 40시간 초과는 일반 근로형태 범위 밖으로 오류 처리한다", () => {
  assertHasError(
    calculateLaborPay({ ...baseInput, weeklyScheduledHours: 41 }),
    "weeklyScheduledHours",
    "HOURS_OUT_OF_RANGE",
  );
});

test("1일 평균 소정근로시간 8시간 초과는 오류 처리한다", () => {
  assertHasError(
    calculateLaborPay({
      ...baseInput,
      weeklyScheduledHours: 20,
      weeklyActualHours: 20,
      weeklyWorkDays: 2,
    }),
    "weeklyScheduledHours",
    "DAILY_SCHEDULED_HOURS_EXCEED_STANDARD_LIMIT",
  );
});

test("4주 평균 주 소정근로시간이 있으면 지급 대상 판정에 우선 사용한다", () => {
  const data = assertSuccess(
    calculateLaborPay({
      ...baseInput,
      weeklyScheduledHours: 20,
      averageWeeklyScheduledHours: 14,
    }),
  );

  assert.equal(data.isEligible, false);
  assert.equal(data.eligibilityBasisHours, 14);
});

for (const hourlyWage of [0, -1]) {
  test(`시급 ${hourlyWage} 입력은 오류 처리한다`, () => {
    assertHasError(
      calculateLaborPay({ ...baseInput, hourlyWage }),
      "hourlyWage",
      "MUST_BE_POSITIVE",
    );
  });
}

for (const weeklyScheduledHours of [0, -1]) {
  test(`주 소정근로시간 ${weeklyScheduledHours} 입력은 오류 처리한다`, () => {
    assertHasError(
      calculateLaborPay({ ...baseInput, weeklyScheduledHours }),
      "weeklyScheduledHours",
      "MUST_BE_POSITIVE",
    );
  });
}

test("실제 근로시간 음수는 오류 처리한다", () => {
  assertHasError(
    calculateLaborPay({ ...baseInput, weeklyActualHours: -1 }),
    "weeklyActualHours",
    "MUST_BE_NON_NEGATIVE",
  );
});

test("근무일수 8은 오류 처리한다", () => {
  assertHasError(
    calculateLaborPay({ ...baseInput, weeklyWorkDays: 8 }),
    "weeklyWorkDays",
    "WORK_DAYS_OUT_OF_RANGE",
  );
});

test("근무일수 미입력과 0일은 오류 처리한다", () => {
  assertHasError(
    calculateLaborPay({ ...baseInput, weeklyWorkDays: undefined }),
    "weeklyWorkDays",
    "REQUIRED",
  );
  assertHasError(
    calculateLaborPay({ ...baseInput, weeklyWorkDays: 0 }),
    "weeklyWorkDays",
    "WORK_DAYS_OUT_OF_RANGE",
  );
});

test("지나치게 큰 시급은 오류 처리한다", () => {
  assertHasError(
    calculateLaborPay({ ...baseInput, hourlyWage: MAX_HOURLY_WAGE + 1 }),
    "hourlyWage",
    "AMOUNT_OUT_OF_RANGE",
  );
});

test("숫자가 아닌 값은 오류 처리한다", () => {
  assertHasError(
    calculateLaborPay({ ...baseInput, hourlyWage: "10320" }),
    "hourlyWage",
    "INVALID_NUMBER",
  );
});

test("필수값 누락은 REQUIRED 오류를 반환한다", () => {
  const errors = validateLaborPayInput({
    weeklyScheduledHours: 40,
    weeklyActualHours: 40,
    isFullAttendance: true,
  });

  assert.ok(
    errors.some(
      (error) => error.field === "hourlyWage" && error.code === "REQUIRED",
    ),
  );
});

test("2026년 최저임금 미만 시급이면 경고를 반환한다", () => {
  const data = assertSuccess(
    calculateLaborPay({
      ...baseInput,
      hourlyWage: MINIMUM_HOURLY_WAGE_2026 - 1,
    }),
  );

  assert.equal(data.isBelowMinimumWage, true);
  assert.ok(data.warnings.some((warning) => warning.includes("최저임금")));
});

test("4주 평균 주 소정근로시간 40시간 초과는 오류 처리한다", () => {
  assertHasError(
    calculateLaborPay({ ...baseInput, averageWeeklyScheduledHours: 41 }),
    "averageWeeklyScheduledHours",
    "HOURS_OUT_OF_RANGE",
  );
});

test("월 환산 표시는 선택한 경우에만 참고용 금액을 반환한다", () => {
  assert.equal(assertSuccess(calculateLaborPay(baseInput)).monthlyEstimate, null);
  assert.equal(
    assertSuccess(
      calculateLaborPay({ ...baseInput, includeMonthlyEstimate: true }),
    ).monthlyEstimate,
    2_156_880,
  );
});
