import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  differenceInCalendarDays,
  parseCivilDate,
  subtractCalendarMonths,
} from "../lib/calculators/severance/date-utils.ts";
import { SEVERANCE_POLICY_2026 } from "../lib/calculators/severance/policy.ts";
import {
  calculateSeverance,
  validateSeveranceInput,
} from "../lib/calculators/severance/severance.ts";

const officialExampleInput = {
  employmentStartDate: "2014-10-02",
  retirementDate: "2017-09-16",
  wagesForAveragePeriod: 7_080_000,
  annualBonusTotal: 4_000_000,
  annualLeaveAllowanceTotal: 300_000,
  ordinaryDailyWage: null,
  averageWeeklyContractHours: 40,
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

test("고용노동부 공식 예제의 중간값과 최종 퇴직금을 재현한다", () => {
  const data = assertSuccess(calculateSeverance(officialExampleInput));

  assert.deepEqual(
    {
      totalServiceDays: data.totalServiceDays,
      start: data.averageWagePeriodStartDate,
      end: data.averageWagePeriodEndDate,
      periodDays: data.averageWagePeriodDays,
      wages: data.wagesForAveragePeriod,
      bonus: data.reflectedBonusAmount,
      annualLeave: data.reflectedAnnualLeaveAllowanceAmount,
      totalWages: data.totalWagesForAverageWage,
      averageDailyWage: data.averageDailyWage,
      estimatedSeverance: data.estimatedSeverance,
    },
    {
      totalServiceDays: 1_080,
      start: "2017-06-16",
      end: "2017-09-15",
      periodDays: 92,
      wages: 7_080_000,
      bonus: 1_000_000,
      annualLeave: 75_000,
      totalWages: 8_155_000,
      averageDailyWage: 88_641.31,
      estimatedSeverance: 7_868_434,
    },
  );
});

test("공식 예제는 입사일을 포함하고 퇴직일을 제외해 1,080일이다", () => {
  const start = parseCivilDate("2014-10-02");
  const retirement = parseCivilDate("2017-09-16");

  assert.ok(start);
  assert.ok(retirement);
  assert.equal(differenceInCalendarDays(start, retirement), 1_080);
});

test("정확히 1년이면 계속근로기간 요건을 충족한다", () => {
  const data = assertSuccess(
    calculateSeverance({
      ...officialExampleInput,
      employmentStartDate: "2025-06-23",
      retirementDate: "2026-06-23",
      annualBonusTotal: 0,
      annualLeaveAllowanceTotal: 0,
    }),
  );

  assert.equal(data.totalServiceDays, 365);
  assert.equal(data.meetsContinuousServiceRequirement, true);
  assert.equal(data.isBasicallyEligible, true);
});

test("1년보다 하루 짧으면 계속근로기간 요건을 충족하지 않는다", () => {
  const data = assertSuccess(
    calculateSeverance({
      ...officialExampleInput,
      employmentStartDate: "2025-06-24",
      retirementDate: "2026-06-23",
      annualBonusTotal: 0,
      annualLeaveAllowanceTotal: 0,
    }),
  );

  assert.equal(data.totalServiceDays, 364);
  assert.equal(data.meetsContinuousServiceRequirement, false);
  assert.equal(data.isBasicallyEligible, false);
  assert.equal(data.estimatedSeverance, 0);
  assert.equal(
    data.ineligibilityReasonCode,
    "CONTINUOUS_SERVICE_UNDER_ONE_YEAR",
  );
});

test("주 15시간은 근로시간 요건을 충족한다", () => {
  const data = assertSuccess(
    calculateSeverance({
      ...officialExampleInput,
      averageWeeklyContractHours: 15,
    }),
  );

  assert.equal(data.meetsWeeklyHoursRequirement, true);
  assert.equal(data.isBasicallyEligible, true);
});

test("주 15시간 미만이면 근로시간 요건을 충족하지 않는다", () => {
  const data = assertSuccess(
    calculateSeverance({
      ...officialExampleInput,
      averageWeeklyContractHours: 14.99,
    }),
  );

  assert.equal(data.meetsWeeklyHoursRequirement, false);
  assert.equal(data.estimatedSeverance, 0);
  assert.equal(data.ineligibilityReasonCode, "WEEKLY_HOURS_UNDER_15");
});

test("계속근로기간과 주 15시간 요건을 모두 충족하지 않는 경우를 구분한다", () => {
  const data = assertSuccess(
    calculateSeverance({
      ...officialExampleInput,
      employmentStartDate: "2026-01-01",
      retirementDate: "2026-06-23",
      averageWeeklyContractHours: 10,
    }),
  );

  assert.equal(data.isBasicallyEligible, false);
  assert.equal(data.ineligibilityReasonCode, "BOTH_REQUIREMENTS_NOT_MET");
});

test("평년 2월을 포함한 3개월 산정기간을 달력 기준으로 계산한다", () => {
  const data = assertSuccess(
    calculateSeverance({
      ...officialExampleInput,
      employmentStartDate: "2020-01-01",
      retirementDate: "2023-05-31",
    }),
  );

  assert.equal(data.averageWagePeriodStartDate, "2023-02-28");
  assert.equal(data.averageWagePeriodEndDate, "2023-05-30");
  assert.equal(data.averageWagePeriodDays, 92);
});

test("윤년 2월을 포함한 3개월 산정기간을 달력 기준으로 계산한다", () => {
  const data = assertSuccess(
    calculateSeverance({
      ...officialExampleInput,
      employmentStartDate: "2020-01-01",
      retirementDate: "2024-05-31",
    }),
  );

  assert.equal(data.averageWagePeriodStartDate, "2024-02-29");
  assert.equal(data.averageWagePeriodEndDate, "2024-05-30");
  assert.equal(data.averageWagePeriodDays, 92);
});

test("윤년을 포함한 장기 근속 재직일수를 정확히 계산한다", () => {
  const data = assertSuccess(
    calculateSeverance({
      ...officialExampleInput,
      employmentStartDate: "2019-01-01",
      retirementDate: "2025-01-01",
    }),
  );

  assert.equal(data.totalServiceDays, 2_192);
});

test("월말 퇴직일에서 존재하지 않는 3개월 전 일자를 월말로 맞춘다", () => {
  const date = parseCivilDate("2024-05-31");
  assert.ok(date);
  assert.deepEqual(subtractCalendarMonths(date, 3), {
    year: 2024,
    month: 2,
    day: 29,
  });
});

test("월 중간 퇴직은 같은 일자의 3개월 전부터 전날까지 계산한다", () => {
  const data = assertSuccess(
    calculateSeverance({
      ...officialExampleInput,
      employmentStartDate: "2020-01-01",
      retirementDate: "2026-06-23",
    }),
  );

  assert.equal(data.averageWagePeriodStartDate, "2026-03-23");
  assert.equal(data.averageWagePeriodEndDate, "2026-06-22");
  assert.equal(data.averageWagePeriodDays, 92);
});

test("취업 후 3개월 미만이면 입사일부터 평균임금 기간을 계산한다", () => {
  const data = assertSuccess(
    calculateSeverance({
      ...officialExampleInput,
      employmentStartDate: "2026-05-01",
      retirementDate: "2026-06-23",
    }),
  );

  assert.equal(data.averageWagePeriodStartDate, "2026-05-01");
  assert.equal(data.averageWagePeriodEndDate, "2026-06-22");
  assert.equal(data.averageWagePeriodDays, 53);
});

test("지원 범위의 가장 이른 날짜에서도 3개월 미만 취업기간을 계산한다", () => {
  const data = assertSuccess(
    calculateSeverance({
      ...officialExampleInput,
      employmentStartDate: "0001-01-01",
      retirementDate: "0001-02-01",
    }),
  );

  assert.equal(data.totalServiceDays, 31);
  assert.equal(data.averageWagePeriodStartDate, "0001-01-01");
  assert.equal(data.averageWagePeriodEndDate, "0001-01-31");
  assert.equal(data.averageWagePeriodDays, 31);
});

test("통상임금이 평균임금보다 높으면 통상임금으로 대체한다", () => {
  const data = assertSuccess(
    calculateSeverance({
      ...officialExampleInput,
      ordinaryDailyWage: 100_000,
    }),
  );

  assert.equal(data.averageDailyWage, 88_641.31);
  assert.equal(data.appliedDailyWage, 100_000);
  assert.equal(data.ordinaryWageSubstituted, true);
  assert.equal(data.appliedDailyWageReason, "ORDINARY_WAGE_HIGHER");
  assert.equal(data.estimatedSeverance, 8_876_712);
});

test("통상임금과 평균임금이 같으면 평균임금을 유지한다", () => {
  const input = {
    ...officialExampleInput,
    wagesForAveragePeriod: 9_200_000,
    annualBonusTotal: 0,
    annualLeaveAllowanceTotal: 0,
    ordinaryDailyWage: 100_000,
  };
  const data = assertSuccess(calculateSeverance(input));

  assert.equal(data.averageDailyWage, 100_000);
  assert.equal(data.appliedDailyWage, 100_000);
  assert.equal(data.ordinaryWageSubstituted, false);
  assert.equal(data.appliedDailyWageReason, "AVERAGE_WAGE_HIGHER_OR_EQUAL");
});

test("통상임금 미입력 null을 결과에서도 null로 보존한다", () => {
  const data = assertSuccess(calculateSeverance(officialExampleInput));

  assert.equal(data.ordinaryDailyWage, null);
  assert.equal(
    data.appliedDailyWageReason,
    "AVERAGE_WAGE_USED_NO_ORDINARY_WAGE",
  );
});

test("통상임금 0원 입력은 미입력과 구분한다", () => {
  const data = assertSuccess(
    calculateSeverance({
      ...officialExampleInput,
      ordinaryDailyWage: 0,
    }),
  );

  assert.equal(data.ordinaryDailyWage, 0);
  assert.equal(data.ordinaryWageSubstituted, false);
  assert.equal(data.appliedDailyWageReason, "AVERAGE_WAGE_HIGHER_OR_EQUAL");
});

test("상여금 총액의 3/12를 평균임금에 반영한다", () => {
  const data = assertSuccess(calculateSeverance(officialExampleInput));

  assert.equal(data.reflectedBonusAmount, 1_000_000);
});

test("연차수당 총액의 3/12를 평균임금에 반영한다", () => {
  const data = assertSuccess(calculateSeverance(officialExampleInput));

  assert.equal(data.reflectedAnnualLeaveAllowanceAmount, 75_000);
});

test("상여금과 연차수당이 모두 0원인 입력을 허용한다", () => {
  const response = calculateSeverance({
    ...officialExampleInput,
    annualBonusTotal: 0,
    annualLeaveAllowanceTotal: 0,
  });

  assert.equal(response.success, true);
});

test("1일 평균임금은 1전 단위로 올림한다", () => {
  const data = assertSuccess(
    calculateSeverance({
      ...officialExampleInput,
      wagesForAveragePeriod: 1,
      annualBonusTotal: 0,
      annualLeaveAllowanceTotal: 0,
    }),
  );

  assert.equal(data.averageDailyWage, 0.02);
});

test("존재하지 않는 날짜를 거부한다", () => {
  assertHasError(
    calculateSeverance({
      ...officialExampleInput,
      retirementDate: "2026-02-30",
    }),
    "retirementDate",
    "INVALID_DATE",
  );
});

test("YYYY-MM-DD가 아닌 날짜를 거부한다", () => {
  for (const retirementDate of ["2026/06/23", "2026-6-23", "23-06-2026"]) {
    assertHasError(
      calculateSeverance({ ...officialExampleInput, retirementDate }),
      "retirementDate",
      "INVALID_DATE_FORMAT",
    );
  }
});

test("퇴직일이 입사일보다 빠른 경우를 거부한다", () => {
  assertHasError(
    calculateSeverance({
      ...officialExampleInput,
      employmentStartDate: "2026-06-24",
      retirementDate: "2026-06-23",
    }),
    "retirementDate",
    "RETIREMENT_BEFORE_START",
  );
});

test("퇴직일과 입사일이 같은 경우를 거부한다", () => {
  assertHasError(
    calculateSeverance({
      ...officialExampleInput,
      employmentStartDate: "2026-06-23",
      retirementDate: "2026-06-23",
    }),
    "retirementDate",
    "RETIREMENT_SAME_AS_START",
  );
});

test("필수 입력의 빈 값을 구조화된 오류로 반환한다", () => {
  for (const field of [
    "employmentStartDate",
    "retirementDate",
    "wagesForAveragePeriod",
    "annualBonusTotal",
    "annualLeaveAllowanceTotal",
    "averageWeeklyContractHours",
  ]) {
    assertHasError(
      calculateSeverance({ ...officialExampleInput, [field]: "" }),
      field,
      "REQUIRED",
    );
  }
});

test("숫자가 아닌 값, NaN과 Infinity를 금액과 시간에서 거부한다", () => {
  for (const field of [
    "wagesForAveragePeriod",
    "annualBonusTotal",
    "annualLeaveAllowanceTotal",
    "ordinaryDailyWage",
    "averageWeeklyContractHours",
  ]) {
    for (const value of ["100", Number.NaN, Infinity, -Infinity]) {
      assertHasError(
        calculateSeverance({ ...officialExampleInput, [field]: value }),
        field,
        "INVALID_NUMBER",
      );
    }
  }
});

test("음수 금액을 거부한다", () => {
  for (const field of [
    "wagesForAveragePeriod",
    "annualBonusTotal",
    "annualLeaveAllowanceTotal",
    "ordinaryDailyWage",
  ]) {
    assertHasError(
      calculateSeverance({ ...officialExampleInput, [field]: -1 }),
      field,
      field === "wagesForAveragePeriod"
        ? "MUST_BE_POSITIVE"
        : "MUST_BE_NON_NEGATIVE",
    );
  }
});

test("평균임금 산정 임금총액 0원을 거부한다", () => {
  assertHasError(
    calculateSeverance({
      ...officialExampleInput,
      wagesForAveragePeriod: 0,
      annualBonusTotal: 0,
      annualLeaveAllowanceTotal: 0,
    }),
    "wagesForAveragePeriod",
    "MUST_BE_POSITIVE",
  );
});

test("소수 원 금액과 안전 정수 범위 초과 금액을 거부한다", () => {
  assertHasError(
    calculateSeverance({
      ...officialExampleInput,
      wagesForAveragePeriod: 1.5,
    }),
    "wagesForAveragePeriod",
    "MUST_BE_INTEGER",
  );
  assertHasError(
    calculateSeverance({
      ...officialExampleInput,
      wagesForAveragePeriod: Number.MAX_SAFE_INTEGER + 1,
    }),
    "wagesForAveragePeriod",
    "MUST_BE_SAFE_INTEGER",
  );
});

test("주당 근로시간 음수·168시간 초과·소수점 정밀도 초과를 거부한다", () => {
  assertHasError(
    calculateSeverance({
      ...officialExampleInput,
      averageWeeklyContractHours: -1,
    }),
    "averageWeeklyContractHours",
    "MUST_BE_NON_NEGATIVE",
  );
  assertHasError(
    calculateSeverance({
      ...officialExampleInput,
      averageWeeklyContractHours: 168.01,
    }),
    "averageWeeklyContractHours",
    "HOURS_EXCEED_LIMIT",
  );
  assertHasError(
    calculateSeverance({
      ...officialExampleInput,
      averageWeeklyContractHours: 15.001,
    }),
    "averageWeeklyContractHours",
    "HOURS_PRECISION_EXCEEDED",
  );
});

test("서비스 최대 금액을 허용하고 최대값 초과를 거부한다", () => {
  assert.equal(
    validateSeveranceInput({
      ...officialExampleInput,
      wagesForAveragePeriod: SEVERANCE_POLICY_2026.maximumAmount,
      annualBonusTotal: SEVERANCE_POLICY_2026.maximumAmount,
      annualLeaveAllowanceTotal: SEVERANCE_POLICY_2026.maximumAmount,
      ordinaryDailyWage: SEVERANCE_POLICY_2026.maximumAmount,
    }).length,
    0,
  );
  assertHasError(
    calculateSeverance({
      ...officialExampleInput,
      wagesForAveragePeriod: SEVERANCE_POLICY_2026.maximumAmount + 1,
    }),
    "wagesForAveragePeriod",
    "AMOUNT_EXCEEDS_LIMIT",
  );
});

test("최대 허용 입력 조합도 안전 정수 결과를 반환한다", () => {
  const data = assertSuccess(
    calculateSeverance({
      employmentStartDate: "0001-01-01",
      retirementDate: "9999-12-31",
      wagesForAveragePeriod: SEVERANCE_POLICY_2026.maximumAmount,
      annualBonusTotal: SEVERANCE_POLICY_2026.maximumAmount,
      annualLeaveAllowanceTotal: SEVERANCE_POLICY_2026.maximumAmount,
      ordinaryDailyWage: SEVERANCE_POLICY_2026.maximumAmount,
      averageWeeklyContractHours: 168,
    }),
  );

  assert.ok(Number.isSafeInteger(data.estimatedSeverance));
  assert.ok(data.estimatedSeverance > 0);
});

test("계산 함수는 입력 객체를 변경하지 않는다", () => {
  const input = structuredClone(officialExampleInput);
  const snapshot = structuredClone(input);

  calculateSeverance(input);

  assert.deepEqual(input, snapshot);
});

test("같은 입력은 호출 간 상태 공유 없이 같은 결과를 반환한다", () => {
  const first = calculateSeverance(officialExampleInput);
  const second = calculateSeverance(officialExampleInput);

  assert.notStrictEqual(first, second);
  assert.deepEqual(first, second);
});

test("결과는 JSON 직렬화 가능하고 BigInt·NaN·Infinity를 노출하지 않는다", () => {
  const data = assertSuccess(calculateSeverance(officialExampleInput));
  const serialized = JSON.stringify(data);

  assert.doesNotThrow(() => JSON.parse(serialized));
  assert.doesNotMatch(serialized, /NaN|Infinity/);
  assert.doesNotMatch(serialized, /BigInt/);
});

test("다른 시간대에서도 공식 예제의 날짜와 금액 결과가 같다", () => {
  const moduleUrl = new URL(
    "../lib/calculators/severance/severance.ts",
    import.meta.url,
  ).href;
  const code = `
    const { calculateSeverance } = await import(${JSON.stringify(moduleUrl)});
    const response = calculateSeverance(${JSON.stringify(officialExampleInput)});
    process.stdout.write(JSON.stringify(response));
  `;
  const results = ["UTC", "Asia/Seoul", "America/New_York"].map((TZ) =>
    JSON.parse(
      execFileSync(
        process.execPath,
        ["--import", "tsx", "--input-type=module", "--eval", code],
        {
          encoding: "utf8",
          env: { ...process.env, TZ },
        },
      ),
    ),
  );

  assert.deepEqual(results[0], results[1]);
  assert.deepEqual(results[0], results[2]);
});

test("퇴직금 엔진은 React와 브라우저 API 및 암묵적 Date 파싱에 의존하지 않는다", () => {
  const engineSource = readFileSync(
    new URL(
      "../lib/calculators/severance/severance.ts",
      import.meta.url,
    ),
    "utf8",
  );
  const dateSource = readFileSync(
    new URL(
      "../lib/calculators/severance/date-utils.ts",
      import.meta.url,
    ),
    "utf8",
  );

  assert.doesNotMatch(
    engineSource,
    /\b(?:React|window|document|navigator|localStorage)\b/,
  );
  assert.doesNotMatch(dateSource, /\bnew Date\b|\bDate\.parse\b/);
});
