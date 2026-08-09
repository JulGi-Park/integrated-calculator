import type {
  OvertimePayInput,
  OvertimePayInputField,
  OvertimePayValidationError,
} from "./types";

export const OVERTIME_PAY_LIMITS = {
  maximumHourlyWage: 100_000_000,
  maximumHours: 10_000,
} as const;

const fields: OvertimePayInputField[] = [
  "hourlyWage",
  "baseHours",
  "overtimeHours",
  "nightHours",
  "holidayHoursWithin8",
  "holidayHoursOver8",
];

const requiredFields: OvertimePayInputField[] = ["hourlyWage"];

function readNumber(
  input: unknown,
  field: OvertimePayInputField,
): unknown {
  if (!input || typeof input !== "object") {
    return undefined;
  }

  return (input as Record<OvertimePayInputField, unknown>)[field];
}

function createError(
  field: OvertimePayInputField,
  code: OvertimePayValidationError["code"],
  message: string,
): OvertimePayValidationError {
  return { field, code, message };
}

export function validateOvertimePayInput(
  input: unknown,
): OvertimePayValidationError[] {
  const errors: OvertimePayValidationError[] = [];

  for (const field of fields) {
    const value = readNumber(input, field);

    if (requiredFields.includes(field) && value === undefined) {
      errors.push(createError(field, "REQUIRED", "시급을 입력해 주세요."));
      continue;
    }

    if (value === undefined) {
      continue;
    }

    if (typeof value !== "number" || !Number.isFinite(value)) {
      errors.push(
        createError(
          field,
          "INVALID_NUMBER",
          field === "hourlyWage"
            ? "시급은 0보다 큰 숫자로 입력해 주세요."
            : "근로시간은 0 이상 숫자로 입력해 주세요.",
        ),
      );
      continue;
    }

    if (field === "hourlyWage") {
      if (value <= 0) {
        errors.push(
          createError(field, "MUST_BE_POSITIVE", "시급은 0보다 큰 숫자로 입력해 주세요."),
        );
      } else if (value > OVERTIME_PAY_LIMITS.maximumHourlyWage) {
        errors.push(
          createError(field, "WAGE_EXCEEDS_LIMIT", "입력값이 너무 큽니다. 시급을 다시 확인해 주세요."),
        );
      }
      continue;
    }

    if (value < 0) {
      errors.push(
        createError(field, "MUST_BE_NON_NEGATIVE", "근로시간은 0 이상 숫자로 입력해 주세요."),
      );
    } else if (value > OVERTIME_PAY_LIMITS.maximumHours) {
      errors.push(
        createError(field, "HOURS_EXCEED_LIMIT", "입력값이 너무 큽니다. 시간을 다시 확인해 주세요."),
      );
    }
  }

  if (errors.length === 0) {
    const baseHours = Number(readNumber(input, "baseHours") ?? 0);
    const overtimeHours = Number(readNumber(input, "overtimeHours") ?? 0);
    const nightHours = Number(readNumber(input, "nightHours") ?? 0);
    const holidayHoursWithin8 = Number(readNumber(input, "holidayHoursWithin8") ?? 0);
    const holidayHoursOver8 = Number(readNumber(input, "holidayHoursOver8") ?? 0);
    const totalHours = baseHours + overtimeHours + holidayHoursWithin8 + holidayHoursOver8;

    if (totalHours === 0) {
      errors.push(
        createError("baseHours", "NO_WORK_HOURS", "계산할 근로시간을 1개 이상 입력해 주세요."),
      );
    } else if (nightHours > totalHours) {
      errors.push(
        createError(
          "nightHours",
          "NIGHT_HOURS_EXCEED_WORK_HOURS",
          "야간근로 시간은 전체 실제 근로시간보다 클 수 없습니다.",
        ),
      );
    }
  }

  return errors;
}

export function hasValidOvertimePayInput(
  input: unknown,
): input is OvertimePayInput {
  return validateOvertimePayInput(input).length === 0;
}
