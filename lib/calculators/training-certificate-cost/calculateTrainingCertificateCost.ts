import type {
  TrainingCertificateCostCalculationResponse,
  TrainingCertificateCostInput,
  TrainingCertificateCostResult,
  TrainingCertificateCostValidationError,
} from "./types";
import {
  normalizeTrainingCertificateCostInput,
  validateTrainingCertificateCostInput,
} from "./validation";

const maximumSafeInteger = BigInt(Number.MAX_SAFE_INTEGER);
const minimumSafeInteger = BigInt(Number.MIN_SAFE_INTEGER);

function toSafeNumber(value: bigint): number | null {
  if (value < minimumSafeInteger || value > maximumSafeInteger) {
    return null;
  }

  return Number(value);
}

function safeAdd(left: number, right: number): number | null {
  return toSafeNumber(BigInt(left) + BigInt(right));
}

function safeSubtract(left: number, right: number): number | null {
  return toSafeNumber(BigInt(left) - BigInt(right));
}

function safeMultiply(left: number, right: number): number | null {
  return toSafeNumber(BigInt(left) * BigInt(right));
}

function calculateDerivedAmounts(input: TrainingCertificateCostInput) {
  const totalExamCost = safeMultiply(
    input.examFee,
    input.expectedExamAttempts,
  );

  if (totalExamCost === null) {
    return null;
  }

  const ancillaryValues = [
    totalExamCost,
    input.textbookCost,
    input.practiceMaterialCost,
    input.transportationCost,
    input.mealCost,
    input.otherCost,
  ];

  let ancillaryCost = 0;
  for (const value of ancillaryValues) {
    const next = safeAdd(ancillaryCost, value);

    if (next === null) {
      return null;
    }

    ancillaryCost = next;
  }

  const estimatedGovernmentSupportAmount = safeSubtract(
    input.totalTrainingCost,
    input.trainingSelfPayAmount,
  );
  const estimatedTotalCostWithoutSupport = safeAdd(
    input.totalTrainingCost,
    ancillaryCost,
  );
  const estimatedTotalOutOfPocket = safeAdd(
    input.trainingSelfPayAmount,
    ancillaryCost,
  );

  if (
    estimatedGovernmentSupportAmount === null ||
    estimatedTotalCostWithoutSupport === null ||
    estimatedTotalOutOfPocket === null
  ) {
    return null;
  }

  return {
    totalExamCost,
    ancillaryCost,
    estimatedGovernmentSupportAmount,
    estimatedTotalCostWithoutSupport,
    estimatedTotalOutOfPocket,
    estimatedSavingsAmount: estimatedGovernmentSupportAmount,
  } satisfies TrainingCertificateCostResult;
}

function assertValidResult(result: TrainingCertificateCostResult) {
  const values = [
    result.totalExamCost,
    result.ancillaryCost,
    result.estimatedGovernmentSupportAmount,
    result.estimatedTotalCostWithoutSupport,
    result.estimatedTotalOutOfPocket,
    result.estimatedSavingsAmount,
  ];

  if (
    values.some(
      (value) => !Number.isSafeInteger(value) || !Number.isFinite(value),
    )
  ) {
    throw new RangeError(
      "Training certificate cost calculation produced an unsafe result.",
    );
  }

  if (
    values.some((value) => value < 0) ||
    result.estimatedGovernmentSupportAmount !== result.estimatedSavingsAmount
  ) {
    throw new RangeError(
      "Training certificate cost calculation produced an invalid result.",
    );
  }
}

export function calculateTrainingCertificateCost(
  input: TrainingCertificateCostInput,
): TrainingCertificateCostResult {
  const derivedAmounts = calculateDerivedAmounts(input);

  if (derivedAmounts === null) {
    throw new RangeError(
      "Training certificate cost calculation exceeded the safe integer range.",
    );
  }

  const result: TrainingCertificateCostResult = derivedAmounts;
  assertValidResult(result);
  return result;
}

function createCalculationError(
  message: string,
): TrainingCertificateCostValidationError {
  return {
    field: "calculation",
    code: "CALCULATION_EXCEEDS_SAFE_RANGE",
    message,
  };
}

export function calculateTrainingCertificateCostFromUnknown(
  input: unknown,
): TrainingCertificateCostCalculationResponse {
  const errors = validateTrainingCertificateCostInput(input);
  const normalizedInput = normalizeTrainingCertificateCostInput(input);

  if (errors.length > 0 || normalizedInput === null) {
    return { success: false, errors };
  }

  try {
    return {
      success: true,
      data: calculateTrainingCertificateCost(normalizedInput),
    };
  } catch (error) {
    if (error instanceof RangeError) {
      return {
        success: false,
        errors: [
          createCalculationError(
            "입력값 조합이 너무 커 정확한 원 단위 계산이 어렵습니다. 금액이나 예상 응시 횟수를 줄여 주세요.",
          ),
        ],
      };
    }

    return {
      success: false,
      errors: [
        {
          field: "calculation",
          code: "INVALID_RESULT",
          message: "계산 결과를 만들 수 없습니다. 입력값을 확인해 주세요.",
        },
      ],
    };
  }
}
