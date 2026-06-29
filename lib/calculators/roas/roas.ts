export interface RoasInput {
  adCost: number;
  adRevenue: number;
  productCost: number;
  otherCost: number;
  targetRoas?: number;
}

export interface RoasResult {
  roasRate: number;
  adCostShareRate: number | null;
  netProfitAfterAd: number;
  contributionProfitBeforeAd: number;
  contributionMarginRate: number | null;
  breakEvenRoasRate: number | null;
  targetStatus: "ACHIEVED" | "MISSED" | "NOT_SET";
}

export type RoasInputField = keyof RoasInput;

export type RoasValidationErrorCode =
  | "REQUIRED"
  | "INVALID_NUMBER"
  | "MUST_BE_POSITIVE"
  | "MUST_BE_NON_NEGATIVE";

export interface RoasValidationError {
  field: RoasInputField;
  code: RoasValidationErrorCode;
  message: string;
}

export type RoasCalculationResponse =
  | {
      success: true;
      data: RoasResult;
    }
  | {
      success: false;
      errors: RoasValidationError[];
    };

const requiredFields = ["adCost", "adRevenue"] as const;
const optionalAmountFields = ["productCost", "otherCost"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function roundRoasValue(value: number, decimalPlaces: number): number {
  if (!Number.isFinite(value) || !Number.isInteger(decimalPlaces)) {
    throw new TypeError("A finite number and an integer decimal place are required.");
  }

  const factor = 10 ** decimalPlaces;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function addError(
  errors: RoasValidationError[],
  field: RoasInputField,
  code: RoasValidationErrorCode,
  message: string,
) {
  errors.push({ field, code, message });
}

export function validateRoasInput(input: unknown): RoasValidationError[] {
  const errors: RoasValidationError[] = [];

  if (!isRecord(input)) {
    return requiredFields.map((field) => ({
      field,
      code: "REQUIRED",
      message: `${field} 값을 입력해야 합니다.`,
    }));
  }

  for (const field of requiredFields) {
    const value = input[field];

    if (typeof value === "undefined" || value === null) {
      addError(errors, field, "REQUIRED", `${field} 값을 입력해야 합니다.`);
      continue;
    }

    if (!isFiniteNumber(value)) {
      addError(errors, field, "INVALID_NUMBER", `${field} 값은 숫자여야 합니다.`);
    }
  }

  if (isFiniteNumber(input.adCost)) {
    if (input.adCost < 0) {
      addError(errors, "adCost", "MUST_BE_NON_NEGATIVE", "광고비는 음수로 입력할 수 없습니다.");
    } else if (input.adCost === 0) {
      addError(errors, "adCost", "MUST_BE_POSITIVE", "광고비는 0보다 커야 합니다.");
    }
  }

  if (isFiniteNumber(input.adRevenue) && input.adRevenue < 0) {
    addError(errors, "adRevenue", "MUST_BE_NON_NEGATIVE", "광고 매출은 음수로 입력할 수 없습니다.");
  }

  for (const field of optionalAmountFields) {
    const value = input[field];

    if (typeof value === "undefined" || value === null) {
      continue;
    }

    if (!isFiniteNumber(value)) {
      addError(errors, field, "INVALID_NUMBER", `${field} 값은 숫자여야 합니다.`);
    } else if (value < 0) {
      addError(errors, field, "MUST_BE_NON_NEGATIVE", `${field} 값은 음수로 입력할 수 없습니다.`);
    }
  }

  const targetRoas = input.targetRoas;

  if (typeof targetRoas !== "undefined" && targetRoas !== null) {
    if (!isFiniteNumber(targetRoas)) {
      addError(errors, "targetRoas", "INVALID_NUMBER", "목표 ROAS는 숫자여야 합니다.");
    } else if (targetRoas <= 0) {
      addError(errors, "targetRoas", "MUST_BE_POSITIVE", "목표 ROAS는 0보다 커야 합니다.");
    }
  }

  return errors;
}

function hasRequiredCalculationFields(
  input: Record<string, unknown>,
): input is Record<string, unknown> & Pick<RoasInput, "adCost" | "adRevenue"> {
  return isFiniteNumber(input.adCost) && isFiniteNumber(input.adRevenue);
}

export function calculateRoas(input: unknown): RoasCalculationResponse {
  const errors = validateRoasInput(input);

  if (!isRecord(input) || !hasRequiredCalculationFields(input) || errors.length > 0) {
    return { success: false, errors };
  }

  const productCost = isFiniteNumber(input.productCost) ? input.productCost : 0;
  const otherCost = isFiniteNumber(input.otherCost) ? input.otherCost : 0;
  const targetRoas = isFiniteNumber(input.targetRoas) ? input.targetRoas : undefined;
  const contributionProfitBeforeAd = input.adRevenue - productCost - otherCost;
  const contributionMarginRate =
    input.adRevenue > 0 ? contributionProfitBeforeAd / input.adRevenue : null;
  const roasRate = roundRoasValue((input.adRevenue / input.adCost) * 100, 2);
  const breakEvenRoasRate =
    contributionMarginRate !== null && contributionMarginRate > 0
      ? roundRoasValue(100 / contributionMarginRate, 2)
      : null;

  return {
    success: true,
    data: {
      roasRate,
      adCostShareRate:
        input.adRevenue > 0
          ? roundRoasValue((input.adCost / input.adRevenue) * 100, 2)
          : null,
      netProfitAfterAd: roundRoasValue(
        input.adRevenue - productCost - otherCost - input.adCost,
        0,
      ),
      contributionProfitBeforeAd: roundRoasValue(contributionProfitBeforeAd, 0),
      contributionMarginRate:
        contributionMarginRate === null
          ? null
          : roundRoasValue(contributionMarginRate * 100, 2),
      breakEvenRoasRate,
      targetStatus:
        typeof targetRoas === "undefined"
          ? "NOT_SET"
          : roasRate >= targetRoas
            ? "ACHIEVED"
            : "MISSED",
    },
  };
}
