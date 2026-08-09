import type {
  OvertimePayCalculationResponse,
  OvertimePayInput,
  OvertimePayResult,
} from "./types";
import {
  hasValidOvertimePayInput,
  validateOvertimePayInput,
} from "./validation";

const POLICY_VERIFIED_AT = "2026-08-09" as const;

function roundWon(value: number): number {
  return Math.round(value);
}

function assertValidResult(result: OvertimePayResult) {
  const values = [
    result.hourlyWage,
    result.baseHours,
    result.overtimeHours,
    result.nightHours,
    result.holidayHoursWithin8,
    result.holidayHoursOver8,
    result.totalEnteredHours,
    result.regularEquivalentPay,
    result.basePay,
    result.overtimePay,
    result.nightPremiumPay,
    result.holidayPayWithin8,
    result.holidayPayOver8,
    result.additionalAllowanceTotal,
    result.totalExpectedPay,
    result.extraComparedWithRegularPay,
  ];

  if (values.some((value) => !Number.isFinite(value))) {
    throw new RangeError("Overtime pay calculation produced NaN/Infinity.");
  }

  if (result.totalExpectedPay < 0 || result.additionalAllowanceTotal < 0) {
    throw new RangeError("Overtime pay calculation produced a negative result.");
  }
}

export function calculateOvertimePay(
  input: OvertimePayInput,
): OvertimePayResult {
  const basePay = roundWon(input.hourlyWage * input.baseHours);
  const overtimePay = roundWon(input.hourlyWage * input.overtimeHours * 1.5);
  const nightPremiumPay = roundWon(input.hourlyWage * input.nightHours * 0.5);
  const holidayPayWithin8 = roundWon(
    input.hourlyWage * input.holidayHoursWithin8 * 1.5,
  );
  const holidayPayOver8 = roundWon(
    input.hourlyWage * input.holidayHoursOver8 * 2,
  );
  const totalEnteredHours =
    input.baseHours +
    input.overtimeHours +
    input.holidayHoursWithin8 +
    input.holidayHoursOver8;
  const regularEquivalentPay = roundWon(input.hourlyWage * totalEnteredHours);
  const additionalAllowanceTotal =
    overtimePay + nightPremiumPay + holidayPayWithin8 + holidayPayOver8;
  const totalExpectedPay = basePay + additionalAllowanceTotal;
  const extraComparedWithRegularPay = totalExpectedPay - regularEquivalentPay;

  const result: OvertimePayResult = {
    ...input,
    totalEnteredHours,
    regularEquivalentPay,
    basePay,
    overtimePay,
    nightPremiumPay,
    holidayPayWithin8,
    holidayPayOver8,
    additionalAllowanceTotal,
    totalExpectedPay,
    extraComparedWithRegularPay,
    interpretation:
      "입력한 시간 기준으로 연장·야간·휴일근로 항목을 나눠 합산한 예상 지급액입니다.",
    policyVerifiedAt: POLICY_VERIFIED_AT,
  };

  assertValidResult(result);
  return result;
}

export function calculateOvertimePayFromUnknown(
  input: unknown,
): OvertimePayCalculationResponse {
  const errors = validateOvertimePayInput(input);

  if (errors.length > 0 || !hasValidOvertimePayInput(input)) {
    return { success: false, errors };
  }

  try {
    return { success: true, data: calculateOvertimePay(input) };
  } catch {
    return {
      success: false,
      errors: [
        {
          field: "hourlyWage",
          code: "INVALID_RESULT",
          message: "계산 결과를 확인할 수 없습니다. 입력값을 다시 확인해 주세요.",
        },
      ],
    };
  }
}
