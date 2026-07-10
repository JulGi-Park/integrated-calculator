export const MINIMUM_HOURLY_WAGE_2026 = 10_320;
export const MAX_HOURLY_WAGE = 10_000_000;
export const MONTHLY_STANDARD_HOURS = 209;
export const WEEKLY_HOLIDAY_HOUR_LIMIT = 8;
export const WEEKLY_ELIGIBILITY_HOURS = 15;

export type LaborPayInputField =
  | "hourlyWage"
  | "weeklyScheduledHours"
  | "weeklyActualHours"
  | "isFullAttendance"
  | "averageWeeklyScheduledHours"
  | "weeklyWorkDays";

export type LaborPayValidationCode =
  | "REQUIRED"
  | "INVALID_NUMBER"
  | "MUST_BE_POSITIVE"
  | "MUST_BE_NON_NEGATIVE"
  | "AMOUNT_OUT_OF_RANGE"
  | "HOURS_OUT_OF_RANGE"
  | "WORK_DAYS_OUT_OF_RANGE"
  | "MUST_BE_BOOLEAN";

export interface LaborPayInput {
  hourlyWage: number;
  weeklyScheduledHours: number;
  weeklyActualHours: number;
  isFullAttendance: boolean;
  averageWeeklyScheduledHours?: number;
  weeklyWorkDays?: number;
  includeMonthlyEstimate?: boolean;
}

export interface LaborPayValidationError {
  field: LaborPayInputField;
  code: LaborPayValidationCode;
}

export interface LaborPayResult {
  isEligible: boolean;
  eligibilityBasisHours: number;
  weeklyHolidayHours: number;
  weeklyHolidayPay: number;
  baseWeeklyPay: number;
  weeklyPayIncludingHoliday: number;
  monthlyEstimate: number | null;
  appliedHolidayHourCap: boolean;
  isBelowMinimumWage: boolean;
  reasons: string[];
  warnings: string[];
}

export type LaborPayResponse =
  | { success: true; data: LaborPayResult }
  | { success: false; errors: LaborPayValidationError[] };

export function roundToWon(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}

export function roundToHours(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function validateLaborPayInput(
  input: Partial<LaborPayInput> | Record<string, unknown>,
): LaborPayValidationError[] {
  const errors: LaborPayValidationError[] = [];

  function requireNumber(
    field: "hourlyWage" | "weeklyScheduledHours" | "weeklyActualHours",
  ) {
    const value = input[field];

    if (typeof value === "undefined" || value === null) {
      errors.push({ field, code: "REQUIRED" });
      return undefined;
    }

    if (!isFiniteNumber(value)) {
      errors.push({ field, code: "INVALID_NUMBER" });
      return undefined;
    }

    return value;
  }

  const hourlyWage = requireNumber("hourlyWage");
  const weeklyScheduledHours = requireNumber("weeklyScheduledHours");
  const weeklyActualHours = requireNumber("weeklyActualHours");

  if (isFiniteNumber(hourlyWage) && hourlyWage <= 0) {
    errors.push({ field: "hourlyWage", code: "MUST_BE_POSITIVE" });
  } else if (isFiniteNumber(hourlyWage) && hourlyWage > MAX_HOURLY_WAGE) {
    errors.push({ field: "hourlyWage", code: "AMOUNT_OUT_OF_RANGE" });
  }

  if (isFiniteNumber(weeklyScheduledHours)) {
    if (weeklyScheduledHours <= 0) {
      errors.push({
        field: "weeklyScheduledHours",
        code: "MUST_BE_POSITIVE",
      });
    } else if (weeklyScheduledHours > 168) {
      errors.push({
        field: "weeklyScheduledHours",
        code: "HOURS_OUT_OF_RANGE",
      });
    }
  }

  if (isFiniteNumber(weeklyActualHours)) {
    if (weeklyActualHours < 0) {
      errors.push({ field: "weeklyActualHours", code: "MUST_BE_NON_NEGATIVE" });
    } else if (weeklyActualHours > 168) {
      errors.push({ field: "weeklyActualHours", code: "HOURS_OUT_OF_RANGE" });
    }
  }

  if (typeof input.isFullAttendance !== "boolean") {
    errors.push({ field: "isFullAttendance", code: "MUST_BE_BOOLEAN" });
  }

  const averageWeeklyScheduledHours = input.averageWeeklyScheduledHours;
  if (
    typeof averageWeeklyScheduledHours !== "undefined" &&
    averageWeeklyScheduledHours !== null
  ) {
    if (!isFiniteNumber(averageWeeklyScheduledHours)) {
      errors.push({
        field: "averageWeeklyScheduledHours",
        code: "INVALID_NUMBER",
      });
    } else if (averageWeeklyScheduledHours < 0) {
      errors.push({
        field: "averageWeeklyScheduledHours",
        code: "MUST_BE_NON_NEGATIVE",
      });
    } else if (averageWeeklyScheduledHours > 168) {
      errors.push({
        field: "averageWeeklyScheduledHours",
        code: "HOURS_OUT_OF_RANGE",
      });
    }
  }

  const weeklyWorkDays = input.weeklyWorkDays;
  if (typeof weeklyWorkDays !== "undefined" && weeklyWorkDays !== null) {
    if (!isFiniteNumber(weeklyWorkDays)) {
      errors.push({ field: "weeklyWorkDays", code: "INVALID_NUMBER" });
    } else if (weeklyWorkDays < 1 || weeklyWorkDays > 7) {
      errors.push({ field: "weeklyWorkDays", code: "WORK_DAYS_OUT_OF_RANGE" });
    }
  }

  return errors;
}

export function calculateLaborPay(input: LaborPayInput): LaborPayResponse {
  const errors = validateLaborPayInput(input);

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const eligibilityBasisHours =
    typeof input.averageWeeklyScheduledHours === "number"
      ? input.averageWeeklyScheduledHours
      : input.weeklyScheduledHours;
  const reasons: string[] = [];
  const warnings: string[] = [];
  const isBelowMinimumWage = input.hourlyWage < MINIMUM_HOURLY_WAGE_2026;

  if (eligibilityBasisHours < WEEKLY_ELIGIBILITY_HOURS) {
    reasons.push("4주 평균 또는 1주 소정근로시간이 15시간 미만입니다.");
  }

  if (!input.isFullAttendance) {
    reasons.push("소정근로일을 개근하지 않은 주로 입력되었습니다.");
  }

  if (isBelowMinimumWage) {
    warnings.push(
      "입력한 시급이 2026년 최저임금 10,320원보다 낮습니다. 실제 적용 여부는 근로계약과 법정 기준을 확인해 주세요.",
    );
  }

  if (input.weeklyScheduledHours > 52) {
    warnings.push(
      "1주 소정근로시간이 52시간을 초과합니다. 근로시간 산정 기준을 다시 확인해 주세요.",
    );
  }

  if (
    typeof input.weeklyWorkDays === "number" &&
    input.weeklyWorkDays > 0 &&
    input.weeklyScheduledHours / input.weeklyWorkDays > 8
  ) {
    warnings.push(
      "1일 평균 소정근로시간이 8시간을 초과합니다. 법정근로시간, 연장근로, 휴게시간 포함 여부를 확인해 주세요.",
    );
  }

  const isEligible = reasons.length === 0;
  const uncappedHolidayHours = (input.weeklyScheduledHours / 40) * 8;
  const weeklyHolidayHours = isEligible
    ? roundToHours(Math.min(uncappedHolidayHours, WEEKLY_HOLIDAY_HOUR_LIMIT))
    : 0;
  const weeklyHolidayPay = roundToWon(weeklyHolidayHours * input.hourlyWage);
  const baseWeeklyPay = roundToWon(input.weeklyActualHours * input.hourlyWage);
  const weeklyPayIncludingHoliday = baseWeeklyPay + weeklyHolidayPay;
  const monthlyEstimate = input.includeMonthlyEstimate
    ? roundToWon(input.hourlyWage * MONTHLY_STANDARD_HOURS)
    : null;

  return {
    success: true,
    data: {
      isEligible,
      eligibilityBasisHours: roundToHours(eligibilityBasisHours),
      weeklyHolidayHours,
      weeklyHolidayPay,
      baseWeeklyPay,
      weeklyPayIncludingHoliday,
      monthlyEstimate,
      appliedHolidayHourCap:
        isEligible && uncappedHolidayHours > WEEKLY_HOLIDAY_HOUR_LIMIT,
      isBelowMinimumWage,
      reasons,
      warnings,
    },
  };
}
