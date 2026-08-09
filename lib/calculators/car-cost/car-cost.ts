export interface CarCostInput {
  monthlyDistanceKm: number;
  fuelEfficiencyKmPerL: number;
  fuelPricePerL: number;
  annualInsuranceCost: number;
  annualCarTax: number;
  monthlyMaintenanceCost: number;
  monthlyParkingCost: number;
  monthlyTollCost: number;
  monthlyEtcCost: number;
  includeLoanPayment?: boolean;
  monthlyLoanPayment?: number;
  includeDepreciation?: boolean;
  monthlyDepreciationCost?: number;
}

export interface CarCostResult {
  monthlyFuelUsageL: number;
  monthlyFuelCost: number;
  annualFuelCost: number;
  monthlyInsuranceCost: number;
  monthlyCarTax: number;
  monthlyFixedCost: number;
  monthlyVariableCost: number;
  monthlyOperatingCost: number;
  annualOperatingCost: number;
  fuelCostPerKm: number;
  operatingCostPerKm: number;
  monthlyOptionalCost: number;
  monthlyTotalCost: number;
  annualTotalCost: number;
  totalCostPerKm: number;
  includedLoanPayment: boolean;
  includedDepreciation: boolean;
  resultType: "carCost";
  summaryMessageKey: "monthlyTotalCostEstimated";
}

export type CarCostInputField = keyof CarCostInput;

export type CarCostValidationErrorCode =
  | "INVALID_NUMBER"
  | "MUST_BE_POSITIVE"
  | "MUST_BE_NON_NEGATIVE";

export interface CarCostValidationError {
  field: CarCostInputField;
  code: CarCostValidationErrorCode;
  message: string;
}

export type CarCostCalculationResponse =
  | {
      success: true;
      data: CarCostResult;
    }
  | {
      success: false;
      errors: CarCostValidationError[];
    };

const requiredNumericFields = [
  "monthlyDistanceKm",
  "fuelEfficiencyKmPerL",
  "fuelPricePerL",
  "annualInsuranceCost",
  "annualCarTax",
  "monthlyMaintenanceCost",
  "monthlyParkingCost",
  "monthlyTollCost",
  "monthlyEtcCost",
  "monthlyLoanPayment",
  "monthlyDepreciationCost",
] as const satisfies readonly CarCostInputField[];

const nonNegativeFields = [
  ["fuelPricePerL", "유류 단가는 0원 이상이어야 합니다."],
  ["annualInsuranceCost", "연 보험료는 0원 이상이어야 합니다."],
  ["annualCarTax", "연 자동차세는 0원 이상이어야 합니다."],
  [
    "monthlyMaintenanceCost",
    "월 정비·소모품 비용은 0원 이상이어야 합니다.",
  ],
  ["monthlyParkingCost", "월 주차비는 0원 이상이어야 합니다."],
  ["monthlyTollCost", "월 통행료는 0원 이상이어야 합니다."],
  ["monthlyEtcCost", "월 기타 비용은 0원 이상이어야 합니다."],
  ["monthlyLoanPayment", "월 할부금은 0원 이상이어야 합니다."],
  ["monthlyDepreciationCost", "월 감가상각비는 0원 이상이어야 합니다."],
] as const satisfies readonly [CarCostInputField, string][];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function hasFiniteInputFields(
  input: Record<string, unknown>,
): input is Record<string, unknown> & Required<CarCostInput> {
  return requiredNumericFields.every((field) => isFiniteNumber(input[field]));
}

function addError(
  errors: CarCostValidationError[],
  field: CarCostInputField,
  code: CarCostValidationErrorCode,
  message: string,
) {
  errors.push({ field, code, message });
}

function roundToWon(value: number): number {
  return Math.round(value);
}

export function validateCarCostInput(
  input: unknown,
): CarCostValidationError[] {
  const errors: CarCostValidationError[] = [];

  if (!isRecord(input)) {
    return requiredNumericFields.map((field) => ({
      field,
      code: "INVALID_NUMBER",
      message: `${field} 값은 유한한 숫자여야 합니다.`,
    }));
  }

  for (const field of requiredNumericFields) {
    if (!isFiniteNumber(input[field])) {
      addError(
        errors,
        field,
        "INVALID_NUMBER",
        `${field} 값은 유한한 숫자여야 합니다.`,
      );
    }
  }

  if (isFiniteNumber(input.monthlyDistanceKm) && input.monthlyDistanceKm <= 0) {
    addError(
      errors,
      "monthlyDistanceKm",
      "MUST_BE_POSITIVE",
      "월 주행거리는 0보다 커야 합니다.",
    );
  }

  if (
    isFiniteNumber(input.fuelEfficiencyKmPerL) &&
    input.fuelEfficiencyKmPerL <= 0
  ) {
    addError(
      errors,
      "fuelEfficiencyKmPerL",
      "MUST_BE_POSITIVE",
      "연비는 0보다 커야 합니다.",
    );
  }

  for (const [field, message] of nonNegativeFields) {
    const value = input[field];

    if (isFiniteNumber(value) && value < 0) {
      addError(errors, field, "MUST_BE_NON_NEGATIVE", message);
    }
  }

  return errors;
}

export function calculateCarCost(input: unknown): CarCostCalculationResponse {
  const errors = validateCarCostInput(input);

  if (errors.length > 0 || !isRecord(input) || !hasFiniteInputFields(input)) {
    return { success: false, errors };
  }

  const monthlyFuelUsageL =
    input.monthlyDistanceKm / input.fuelEfficiencyKmPerL;
  const monthlyFuelCost = roundToWon(monthlyFuelUsageL * input.fuelPricePerL);
  const annualFuelCost = roundToWon(monthlyFuelCost * 12);
  const monthlyInsuranceCost = roundToWon(input.annualInsuranceCost / 12);
  const monthlyCarTax = roundToWon(input.annualCarTax / 12);
  const monthlyFixedCost = roundToWon(
    monthlyInsuranceCost + monthlyCarTax + input.monthlyParkingCost,
  );
  const monthlyVariableCost = roundToWon(
    monthlyFuelCost +
      input.monthlyMaintenanceCost +
      input.monthlyTollCost +
      input.monthlyEtcCost,
  );
  const monthlyOperatingCost = roundToWon(
    monthlyFixedCost + monthlyVariableCost,
  );
  const annualOperatingCost = roundToWon(monthlyOperatingCost * 12);
  const includedLoanPayment = input.includeLoanPayment === true;
  const includedDepreciation = input.includeDepreciation === true;
  const monthlyOptionalCost = roundToWon(
    (includedLoanPayment ? input.monthlyLoanPayment : 0) +
      (includedDepreciation ? input.monthlyDepreciationCost : 0),
  );
  const monthlyTotalCost = roundToWon(
    monthlyOperatingCost + monthlyOptionalCost,
  );

  return {
    success: true,
    data: {
      monthlyFuelUsageL,
      monthlyFuelCost,
      annualFuelCost,
      monthlyInsuranceCost,
      monthlyCarTax,
      monthlyFixedCost,
      monthlyVariableCost,
      monthlyOperatingCost,
      annualOperatingCost,
      fuelCostPerKm: roundToWon(monthlyFuelCost / input.monthlyDistanceKm),
      operatingCostPerKm: roundToWon(
        monthlyOperatingCost / input.monthlyDistanceKm,
      ),
      monthlyOptionalCost,
      monthlyTotalCost,
      annualTotalCost: roundToWon(monthlyTotalCost * 12),
      totalCostPerKm: roundToWon(monthlyTotalCost / input.monthlyDistanceKm),
      includedLoanPayment,
      includedDepreciation,
      resultType: "carCost",
      summaryMessageKey: "monthlyTotalCostEstimated",
    },
  };
}
