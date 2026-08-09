import type {
  AveragePriceCalculationResponse,
  AveragePriceInput,
  AveragePriceInputField,
  AveragePriceValidationError,
  AveragePriceValidationErrorCode,
  AveragePriceValidationField,
} from "./types";

const requiredFields: AveragePriceInputField[] = [
  "currentQuantity",
  "currentAveragePrice",
  "additionalQuantity",
  "additionalPrice",
];

const inputFields: AveragePriceInputField[] = [
  ...requiredFields,
  "targetPrice",
];

export const AVERAGE_PRICE_MAX_INPUT = 1_000_000_000_000;
export const AVERAGE_PRICE_MAX_RESULT = Number.MAX_SAFE_INTEGER;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function addError(
  errors: AveragePriceValidationError[],
  field: AveragePriceValidationField,
  code: AveragePriceValidationErrorCode,
  message: string,
) {
  errors.push({ field, code, message });
}

function validatePositiveNumber(
  errors: AveragePriceValidationError[],
  field: AveragePriceInputField,
  value: unknown,
  label: string,
  options: Readonly<{ optional?: boolean }> = {},
) {
  if (options.optional && typeof value === "undefined") {
    return;
  }

  if (!isFiniteNumber(value)) {
    addError(errors, field, "INVALID_NUMBER", `${label}은 숫자로 입력해 주세요.`);
    return;
  }

  if (value <= 0) {
    addError(
      errors,
      field,
      "MUST_BE_POSITIVE",
      `${label}은 0보다 큰 숫자로 입력해 주세요.`,
    );
    return;
  }

  if (value > AVERAGE_PRICE_MAX_INPUT) {
    addError(
      errors,
      field,
      "TOO_LARGE",
      `${label}이 너무 큽니다. 1조 이하의 값으로 입력해 주세요.`,
    );
  }
}

function hasValidInput(
  input: Record<string, unknown>,
): input is Record<string, unknown> & AveragePriceInput {
  return requiredFields.every((field) => isFiniteNumber(input[field]));
}

function roundToDecimalPlaces(value: number, decimalPlaces: number): number {
  if (!Number.isFinite(value) || !Number.isInteger(decimalPlaces)) {
    throw new TypeError("A finite number and integer decimal places are required.");
  }

  const factor = 10 ** decimalPlaces;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function roundAveragePriceWon(value: number): number {
  return roundToDecimalPlaces(value, 2);
}

function assertFiniteResult(
  errors: AveragePriceValidationError[],
  field: AveragePriceValidationField,
  value: number,
  label: string,
) {
  if (!Number.isFinite(value) || Math.abs(value) > AVERAGE_PRICE_MAX_RESULT) {
    addError(
      errors,
      field,
      "NON_FINITE_RESULT",
      `${label} 계산 결과가 유효하지 않습니다. 입력값을 줄여 주세요.`,
    );
  }
}

export function validateAveragePriceInput(
  input: unknown,
): AveragePriceValidationError[] {
  const errors: AveragePriceValidationError[] = [];

  if (!isRecord(input)) {
    return requiredFields.map((field) => ({
      field,
      code: "INVALID_NUMBER",
      message: `${field}은 숫자로 입력해 주세요.`,
    }));
  }

  validatePositiveNumber(
    errors,
    "currentQuantity",
    input.currentQuantity,
    "현재 보유 수량",
  );
  validatePositiveNumber(
    errors,
    "currentAveragePrice",
    input.currentAveragePrice,
    "현재 평균 단가",
  );
  validatePositiveNumber(
    errors,
    "additionalQuantity",
    input.additionalQuantity,
    "추가 매수 수량",
  );
  validatePositiveNumber(
    errors,
    "additionalPrice",
    input.additionalPrice,
    "추가 매수 단가",
  );
  validatePositiveNumber(errors, "targetPrice", input.targetPrice, "현재가 또는 목표 매도가", {
    optional: true,
  });

  if (errors.length > 0 || !hasValidInput(input)) {
    return errors;
  }

  const totalQuantity = input.currentQuantity + input.additionalQuantity;

  if (totalQuantity <= 0) {
    addError(
      errors,
      "totalQuantity",
      "MUST_BE_POSITIVE",
      "총 보유 수량은 0보다 커야 합니다.",
    );
  }

  for (const field of inputFields) {
    const value = input[field];

    if (typeof value === "undefined") {
      continue;
    }

    if (isFiniteNumber(value)) {
      assertFiniteResult(errors, field, value, field);
    }
  }

  return errors;
}

export function calculateAveragePrice(
  input: unknown,
): AveragePriceCalculationResponse {
  const errors = validateAveragePriceInput(input);

  if (errors.length > 0 || !isRecord(input) || !hasValidInput(input)) {
    return { success: false, errors };
  }

  const existingInvestmentAmount =
    input.currentQuantity * input.currentAveragePrice;
  const additionalInvestmentAmount =
    input.additionalQuantity * input.additionalPrice;
  const totalQuantity = input.currentQuantity + input.additionalQuantity;
  const totalInvestmentAmount =
    existingInvestmentAmount + additionalInvestmentAmount;
  const newAveragePrice = totalInvestmentAmount / totalQuantity;

  const resultErrors: AveragePriceValidationError[] = [];

  assertFiniteResult(
    resultErrors,
    "result",
    existingInvestmentAmount,
    "기존 투자금액",
  );
  assertFiniteResult(
    resultErrors,
    "result",
    additionalInvestmentAmount,
    "추가 투자금액",
  );
  assertFiniteResult(resultErrors, "totalQuantity", totalQuantity, "총 보유 수량");
  assertFiniteResult(
    resultErrors,
    "result",
    totalInvestmentAmount,
    "총 투자금액",
  );
  assertFiniteResult(resultErrors, "result", newAveragePrice, "신규 평균 단가");

  const targetPrice = input.targetPrice;
  const hasTargetPrice = isFiniteNumber(targetPrice);
  const expectedValuationAmount = hasTargetPrice
    ? totalQuantity * targetPrice
    : null;
  const expectedProfitLoss =
    expectedValuationAmount === null
      ? null
      : expectedValuationAmount - totalInvestmentAmount;
  const expectedProfitRate =
    expectedProfitLoss === null
      ? null
      : (expectedProfitLoss / totalInvestmentAmount) * 100;

  if (expectedValuationAmount !== null) {
    assertFiniteResult(
      resultErrors,
      "result",
      expectedValuationAmount,
      "예상 평가금액",
    );
  }

  if (expectedProfitLoss !== null) {
    assertFiniteResult(resultErrors, "result", expectedProfitLoss, "예상 손익");
  }

  if (expectedProfitRate !== null) {
    assertFiniteResult(resultErrors, "result", expectedProfitRate, "예상 수익률");
  }

  if (resultErrors.length > 0) {
    return { success: false, errors: resultErrors };
  }

  return {
    success: true,
    data: {
      existingInvestmentAmount: roundAveragePriceWon(existingInvestmentAmount),
      additionalInvestmentAmount: roundAveragePriceWon(additionalInvestmentAmount),
      totalQuantity: roundToDecimalPlaces(totalQuantity, 8),
      totalInvestmentAmount: roundAveragePriceWon(totalInvestmentAmount),
      newAveragePrice: roundAveragePriceWon(newAveragePrice),
      expectedValuationAmount:
        expectedValuationAmount === null
          ? null
          : roundAveragePriceWon(expectedValuationAmount),
      expectedProfitLoss:
        expectedProfitLoss === null ? null : roundAveragePriceWon(expectedProfitLoss),
      expectedProfitRate:
        expectedProfitRate === null
          ? null
          : roundToDecimalPlaces(expectedProfitRate, 2),
    },
  };
}
