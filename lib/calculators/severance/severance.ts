import {
  addCalendarYears,
  compareCivilDates,
  differenceInCalendarDays,
  formatCivilDate,
  parseCivilDate,
  previousCalendarDay,
  subtractCalendarMonths,
} from "./date-utils";
import { SEVERANCE_POLICY_2026 } from "./policy";
import type {
  AppliedDailyWageReason,
  SeveranceCalculationResponse,
  SeveranceIneligibilityReasonCode,
  SeveranceInput,
  SeveranceInputField,
  SeveranceValidationError,
  SeveranceValidationErrorCode,
} from "./types";

const requiredFields: SeveranceInputField[] = [
  "employmentStartDate",
  "retirementDate",
  "wagesForAveragePeriod",
  "annualBonusTotal",
  "annualLeaveAllowanceTotal",
  "ordinaryDailyWage",
  "averageWeeklyContractHours",
];

const requiredAmountFields = [
  "wagesForAveragePeriod",
  "annualBonusTotal",
  "annualLeaveAllowanceTotal",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isEmpty(value: unknown): boolean {
  return value === "" || value === undefined;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function addError(
  errors: SeveranceValidationError[],
  field: SeveranceInputField,
  code: SeveranceValidationErrorCode,
  message: string,
) {
  errors.push({ field, code, message });
}

function getDecimalPlaces(value: number): number {
  const [coefficient, exponentText] = value.toString().toLowerCase().split("e");
  const decimalPlaces = coefficient.split(".")[1]?.length ?? 0;
  const exponent = Number(exponentText ?? 0);

  return Math.max(0, decimalPlaces - exponent);
}

function validateAmount(
  errors: SeveranceValidationError[],
  input: Record<string, unknown>,
  field: (typeof requiredAmountFields)[number] | "ordinaryDailyWage",
  mustBePositive: boolean,
) {
  const value = input[field];

  if (field === "ordinaryDailyWage" && value === null) {
    return;
  }

  if (isEmpty(value)) {
    addError(errors, field, "REQUIRED", `${field} 값을 입력해 주세요.`);
    return;
  }

  if (!isFiniteNumber(value)) {
    addError(
      errors,
      field,
      "INVALID_NUMBER",
      `${field} 값은 유한한 숫자여야 합니다.`,
    );
    return;
  }

  if (!Number.isInteger(value)) {
    addError(
      errors,
      field,
      "MUST_BE_INTEGER",
      `${field} 값은 원 단위 정수여야 합니다.`,
    );
  } else if (!Number.isSafeInteger(value)) {
    addError(
      errors,
      field,
      "MUST_BE_SAFE_INTEGER",
      `${field} 값은 안전한 정수 범위여야 합니다.`,
    );
  }

  if (mustBePositive ? value <= 0 : value < 0) {
    addError(
      errors,
      field,
      mustBePositive ? "MUST_BE_POSITIVE" : "MUST_BE_NON_NEGATIVE",
      mustBePositive
        ? `${field} 값은 0원보다 커야 합니다.`
        : `${field} 값은 0원 이상이어야 합니다.`,
    );
  }

  if (value > SEVERANCE_POLICY_2026.maximumAmount) {
    addError(
      errors,
      field,
      "AMOUNT_EXCEEDS_LIMIT",
      `${field} 값은 ${SEVERANCE_POLICY_2026.maximumAmount.toLocaleString("ko-KR")}원 이하여야 합니다.`,
    );
  }
}

function validateDate(
  errors: SeveranceValidationError[],
  input: Record<string, unknown>,
  field: "employmentStartDate" | "retirementDate",
) {
  const value = input[field];

  if (isEmpty(value) || value === null) {
    addError(errors, field, "REQUIRED", `${field} 값을 입력해 주세요.`);
    return;
  }

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    addError(
      errors,
      field,
      "INVALID_DATE_FORMAT",
      `${field} 값은 YYYY-MM-DD 형식이어야 합니다.`,
    );
    return;
  }

  if (!parseCivilDate(value)) {
    addError(
      errors,
      field,
      "INVALID_DATE",
      `${field} 값은 실제 존재하는 날짜여야 합니다.`,
    );
  }
}

function hasValidInput(
  input: Record<string, unknown>,
): input is Record<string, unknown> & SeveranceInput {
  return (
    typeof input.employmentStartDate === "string" &&
    parseCivilDate(input.employmentStartDate) !== null &&
    typeof input.retirementDate === "string" &&
    parseCivilDate(input.retirementDate) !== null &&
    requiredAmountFields.every(
      (field) =>
        isFiniteNumber(input[field]) &&
        Number.isSafeInteger(input[field]),
    ) &&
    (input.ordinaryDailyWage === null ||
      (isFiniteNumber(input.ordinaryDailyWage) &&
        Number.isSafeInteger(input.ordinaryDailyWage))) &&
    isFiniteNumber(input.averageWeeklyContractHours)
  );
}

export function validateSeveranceInput(
  input: unknown,
): SeveranceValidationError[] {
  const errors: SeveranceValidationError[] = [];

  if (!isRecord(input)) {
    return requiredFields.map((field) => ({
      field,
      code: "REQUIRED",
      message: `${field} 값을 입력해 주세요.`,
    }));
  }

  validateDate(errors, input, "employmentStartDate");
  validateDate(errors, input, "retirementDate");
  validateAmount(errors, input, "wagesForAveragePeriod", true);
  validateAmount(errors, input, "annualBonusTotal", false);
  validateAmount(errors, input, "annualLeaveAllowanceTotal", false);
  validateAmount(errors, input, "ordinaryDailyWage", false);

  const hours = input.averageWeeklyContractHours;

  if (isEmpty(hours) || hours === null) {
    addError(
      errors,
      "averageWeeklyContractHours",
      "REQUIRED",
      "4주 평균 주당 소정근로시간을 입력해 주세요.",
    );
  } else if (!isFiniteNumber(hours)) {
    addError(
      errors,
      "averageWeeklyContractHours",
      "INVALID_NUMBER",
      "4주 평균 주당 소정근로시간은 유한한 숫자여야 합니다.",
    );
  } else {
    if (hours < 0) {
      addError(
        errors,
        "averageWeeklyContractHours",
        "MUST_BE_NON_NEGATIVE",
        "4주 평균 주당 소정근로시간은 0시간 이상이어야 합니다.",
      );
    }

    if (hours > SEVERANCE_POLICY_2026.maximumAverageWeeklyContractHours) {
      addError(
        errors,
        "averageWeeklyContractHours",
        "HOURS_EXCEED_LIMIT",
        "4주 평균 주당 소정근로시간은 168시간 이하여야 합니다.",
      );
    }

    if (
      getDecimalPlaces(hours) >
      SEVERANCE_POLICY_2026.weeklyHoursDecimalPlaces
    ) {
      addError(
        errors,
        "averageWeeklyContractHours",
        "HOURS_PRECISION_EXCEEDED",
        "4주 평균 주당 소정근로시간은 소수점 이하 2자리까지 입력할 수 있습니다.",
      );
    }
  }

  const start =
    typeof input.employmentStartDate === "string"
      ? parseCivilDate(input.employmentStartDate)
      : null;
  const retirement =
    typeof input.retirementDate === "string"
      ? parseCivilDate(input.retirementDate)
      : null;

  if (start && retirement) {
    const comparison = compareCivilDates(retirement, start);

    if (comparison < 0) {
      addError(
        errors,
        "retirementDate",
        "RETIREMENT_BEFORE_START",
        "퇴직일은 입사일보다 빠를 수 없습니다.",
      );
    } else if (comparison === 0) {
      addError(
        errors,
        "retirementDate",
        "RETIREMENT_SAME_AS_START",
        "퇴직일은 입사일과 같을 수 없습니다.",
      );
    }
  }

  return errors;
}

function divideCeil(numerator: bigint, denominator: bigint): bigint {
  return (numerator + denominator - BigInt(1)) / denominator;
}

function divideHalfUp(numerator: bigint, denominator: bigint): bigint {
  const quotient = numerator / denominator;
  const remainder = numerator % denominator;

  return remainder * BigInt(2) >= denominator
    ? quotient + BigInt(1)
    : quotient;
}

function toSafeNumber(value: bigint): number {
  const numberValue = Number(value);

  if (!Number.isSafeInteger(numberValue)) {
    throw new RangeError("Calculated amount exceeds the safe integer range.");
  }

  return numberValue;
}

function centsToNumber(value: bigint): number {
  return toSafeNumber(value) / 100;
}

function getIneligibilityReason(
  meetsServiceRequirement: boolean,
  meetsHoursRequirement: boolean,
): SeveranceIneligibilityReasonCode | null {
  if (!meetsServiceRequirement && !meetsHoursRequirement) {
    return "BOTH_REQUIREMENTS_NOT_MET";
  }

  if (!meetsServiceRequirement) {
    return "CONTINUOUS_SERVICE_UNDER_ONE_YEAR";
  }

  if (!meetsHoursRequirement) {
    return "WEEKLY_HOURS_UNDER_15";
  }

  return null;
}

export function calculateSeverance(
  input: unknown,
): SeveranceCalculationResponse {
  const errors = validateSeveranceInput(input);

  if (errors.length > 0 || !isRecord(input) || !hasValidInput(input)) {
    return { success: false, errors };
  }

  const start = parseCivilDate(input.employmentStartDate);
  const retirement = parseCivilDate(input.retirementDate);

  if (!start || !retirement) {
    return { success: false, errors };
  }

  const policy = SEVERANCE_POLICY_2026;
  const totalServiceDays = differenceInCalendarDays(start, retirement);
  const fullLookbackStart =
    retirement.year === 1 &&
    retirement.month <= policy.averageWageLookbackMonths
      ? start
      : subtractCalendarMonths(
          retirement,
          policy.averageWageLookbackMonths,
        );
  const averagePeriodStart =
    compareCivilDates(start, fullLookbackStart) > 0
      ? start
      : fullLookbackStart;
  const averagePeriodEnd = previousCalendarDay(retirement);
  const averageWagePeriodDays = differenceInCalendarDays(
    averagePeriodStart,
    retirement,
  );

  const wagesCents = BigInt(input.wagesForAveragePeriod) * BigInt(100);
  const reflectedBonusCents =
    BigInt(input.annualBonusTotal) *
    BigInt(100 * policy.bonusReflectionNumerator) /
    BigInt(policy.bonusReflectionDenominator);
  const reflectedAnnualLeaveAllowanceCents =
    BigInt(input.annualLeaveAllowanceTotal) *
    BigInt(100 * policy.annualLeaveAllowanceReflectionNumerator) /
    BigInt(policy.annualLeaveAllowanceReflectionDenominator);
  const totalWagesCents =
    wagesCents +
    reflectedBonusCents +
    reflectedAnnualLeaveAllowanceCents;
  const averageDailyWageCents = divideCeil(
    totalWagesCents,
    BigInt(averageWagePeriodDays),
  );
  const ordinaryDailyWageCents =
    input.ordinaryDailyWage === null
      ? null
      : BigInt(input.ordinaryDailyWage) * BigInt(100);

  let appliedDailyWageCents = averageDailyWageCents;
  let ordinaryWageSubstituted = false;
  let appliedDailyWageReason: AppliedDailyWageReason =
    "AVERAGE_WAGE_USED_NO_ORDINARY_WAGE";

  if (ordinaryDailyWageCents !== null) {
    if (ordinaryDailyWageCents > averageDailyWageCents) {
      appliedDailyWageCents = ordinaryDailyWageCents;
      ordinaryWageSubstituted = true;
      appliedDailyWageReason = "ORDINARY_WAGE_HIGHER";
    } else {
      appliedDailyWageReason = "AVERAGE_WAGE_HIGHER_OR_EQUAL";
    }
  }

  const oneYearAnniversary = addCalendarYears(
    start,
    policy.requiredContinuousServiceYears,
  );
  const meetsContinuousServiceRequirement =
    compareCivilDates(retirement, oneYearAnniversary) >= 0;
  const meetsWeeklyHoursRequirement =
    input.averageWeeklyContractHours >=
    policy.minimumAverageWeeklyContractHours;
  const isBasicallyEligible =
    meetsContinuousServiceRequirement && meetsWeeklyHoursRequirement;
  const calculatedSeverance = divideHalfUp(
    appliedDailyWageCents *
      BigInt(policy.severanceDaysPerYear) *
      BigInt(totalServiceDays),
    BigInt(policy.daysPerServiceYear * 100),
  );

  return {
    success: true,
    data: {
      totalServiceDays,
      averageWagePeriodStartDate: formatCivilDate(averagePeriodStart),
      averageWagePeriodEndDate: formatCivilDate(averagePeriodEnd),
      averageWagePeriodDays,
      wagesForAveragePeriod: input.wagesForAveragePeriod,
      reflectedBonusAmount: centsToNumber(reflectedBonusCents),
      reflectedAnnualLeaveAllowanceAmount: centsToNumber(
        reflectedAnnualLeaveAllowanceCents,
      ),
      totalWagesForAverageWage: centsToNumber(totalWagesCents),
      averageDailyWage: centsToNumber(averageDailyWageCents),
      ordinaryDailyWage: input.ordinaryDailyWage,
      appliedDailyWage: centsToNumber(appliedDailyWageCents),
      ordinaryWageSubstituted,
      appliedDailyWageReason,
      estimatedSeverance: isBasicallyEligible
        ? toSafeNumber(calculatedSeverance)
        : 0,
      meetsContinuousServiceRequirement,
      meetsWeeklyHoursRequirement,
      isBasicallyEligible,
      ineligibilityReasonCode: getIneligibilityReason(
        meetsContinuousServiceRequirement,
        meetsWeeklyHoursRequirement,
      ),
      policyVerifiedAt: policy.verifiedAt,
    },
  };
}
