export type OvertimePayInputField =
  | "hourlyWage"
  | "baseHours"
  | "overtimeHours"
  | "nightHours"
  | "holidayHoursWithin8"
  | "holidayHoursOver8";

export type OvertimePayInput = Readonly<{
  hourlyWage: number;
  baseHours: number;
  overtimeHours: number;
  nightHours: number;
  holidayHoursWithin8: number;
  holidayHoursOver8: number;
  rounding: "round";
}>;

export type OvertimePayValidationCode =
  | "REQUIRED"
  | "INVALID_NUMBER"
  | "MUST_BE_POSITIVE"
  | "MUST_BE_NON_NEGATIVE"
  | "WAGE_EXCEEDS_LIMIT"
  | "HOURS_EXCEED_LIMIT"
  | "NO_WORK_HOURS"
  | "INVALID_RESULT";

export type OvertimePayValidationError = Readonly<{
  field: OvertimePayInputField;
  code: OvertimePayValidationCode;
  message: string;
}>;

export type OvertimePayResult = Readonly<{
  hourlyWage: number;
  baseHours: number;
  overtimeHours: number;
  nightHours: number;
  holidayHoursWithin8: number;
  holidayHoursOver8: number;
  totalEnteredHours: number;
  regularEquivalentPay: number;
  basePay: number;
  overtimePay: number;
  nightPremiumPay: number;
  holidayPayWithin8: number;
  holidayPayOver8: number;
  additionalAllowanceTotal: number;
  totalExpectedPay: number;
  extraComparedWithRegularPay: number;
  interpretation: string;
  policyVerifiedAt: "2026-07-05";
}>;

export type OvertimePayCalculationResponse =
  | Readonly<{ success: true; data: OvertimePayResult }>
  | Readonly<{ success: false; errors: OvertimePayValidationError[] }>;
