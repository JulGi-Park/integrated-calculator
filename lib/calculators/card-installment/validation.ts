import type {
  CardInstallmentInput,
  CardInstallmentInputField,
  CardInstallmentValidationError,
  CardInstallmentValidationErrorCode,
} from "./types";

export const CARD_INSTALLMENT_LIMITS = {
  minimumPurchaseAmount: 1,
  maximumPurchaseAmount: 1_000_000_000,
  minimumInstallmentMonths: 1,
  maximumInstallmentMonths: 60,
  minimumAnnualFeeRatePercent: 0,
  maximumAnnualFeeRatePercent: 30,
} as const;

const inputFields: CardInstallmentInputField[] = [
  "purchaseAmount",
  "installmentMonths",
  "annualFeeRatePercent",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isEmpty(value: unknown): boolean {
  return value === "" || value === null || value === undefined;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function addError(
  errors: CardInstallmentValidationError[],
  field: CardInstallmentInputField,
  code: CardInstallmentValidationErrorCode,
  message: string,
) {
  errors.push({ field, code, message });
}

export function hasValidCardInstallmentInput(
  input: unknown,
): input is CardInstallmentInput {
  return (
    isRecord(input) &&
    isFiniteNumber(input.purchaseAmount) &&
    Number.isSafeInteger(input.purchaseAmount) &&
    isFiniteNumber(input.installmentMonths) &&
    Number.isSafeInteger(input.installmentMonths) &&
    isFiniteNumber(input.annualFeeRatePercent)
  );
}

export function validateCardInstallmentInput(
  input: unknown,
): CardInstallmentValidationError[] {
  const errors: CardInstallmentValidationError[] = [];

  if (!isRecord(input)) {
    return inputFields.map((field) => ({
      field,
      code: "REQUIRED",
      message: `${field} 값을 입력해 주세요.`,
    }));
  }

  for (const field of inputFields) {
    const value = input[field];

    if (isEmpty(value)) {
      addError(errors, field, "REQUIRED", `${field} 값을 입력해 주세요.`);
      continue;
    }

    if (!isFiniteNumber(value)) {
      addError(
        errors,
        field,
        "INVALID_NUMBER",
        `${field} 값은 유한한 숫자여야 합니다.`,
      );
    }
  }

  if (isFiniteNumber(input.purchaseAmount)) {
    if (!Number.isInteger(input.purchaseAmount)) {
      addError(
        errors,
        "purchaseAmount",
        "MUST_BE_INTEGER",
        "구매금액은 원 단위 정수여야 합니다.",
      );
    } else if (!Number.isSafeInteger(input.purchaseAmount)) {
      addError(
        errors,
        "purchaseAmount",
        "MUST_BE_SAFE_INTEGER",
        "구매금액은 안전한 정수 범위여야 합니다.",
      );
    }

    if (input.purchaseAmount < CARD_INSTALLMENT_LIMITS.minimumPurchaseAmount) {
      addError(
        errors,
        "purchaseAmount",
        "MUST_BE_POSITIVE",
        "구매금액은 1원 이상이어야 합니다.",
      );
    }

    if (input.purchaseAmount > CARD_INSTALLMENT_LIMITS.maximumPurchaseAmount) {
      addError(
        errors,
        "purchaseAmount",
        "AMOUNT_EXCEEDS_LIMIT",
        `구매금액은 ${CARD_INSTALLMENT_LIMITS.maximumPurchaseAmount.toLocaleString("ko-KR")}원 이하여야 합니다.`,
      );
    }
  }

  if (isFiniteNumber(input.installmentMonths)) {
    if (!Number.isInteger(input.installmentMonths)) {
      addError(
        errors,
        "installmentMonths",
        "MUST_BE_INTEGER",
        "할부 개월 수는 정수로 입력해 주세요.",
      );
    } else if (!Number.isSafeInteger(input.installmentMonths)) {
      addError(
        errors,
        "installmentMonths",
        "MUST_BE_SAFE_INTEGER",
        "할부 개월 수는 안전한 정수 범위여야 합니다.",
      );
    }

    if (
      input.installmentMonths <
      CARD_INSTALLMENT_LIMITS.minimumInstallmentMonths
    ) {
      addError(
        errors,
        "installmentMonths",
        "MUST_BE_POSITIVE",
        "할부 개월 수는 1개월 이상이어야 합니다.",
      );
    }

    if (
      input.installmentMonths >
      CARD_INSTALLMENT_LIMITS.maximumInstallmentMonths
    ) {
      addError(
        errors,
        "installmentMonths",
        "MONTHS_EXCEEDS_LIMIT",
        `할부 개월 수는 ${CARD_INSTALLMENT_LIMITS.maximumInstallmentMonths}개월 이하여야 합니다.`,
      );
    }
  }

  if (isFiniteNumber(input.annualFeeRatePercent)) {
    if (
      input.annualFeeRatePercent <
      CARD_INSTALLMENT_LIMITS.minimumAnnualFeeRatePercent
    ) {
      addError(
        errors,
        "annualFeeRatePercent",
        "MUST_BE_NON_NEGATIVE",
        "연 할부 수수료율은 0% 이상이어야 합니다.",
      );
    }

    if (
      input.annualFeeRatePercent >
      CARD_INSTALLMENT_LIMITS.maximumAnnualFeeRatePercent
    ) {
      addError(
        errors,
        "annualFeeRatePercent",
        "RATE_EXCEEDS_LIMIT",
        `연 할부 수수료율은 ${CARD_INSTALLMENT_LIMITS.maximumAnnualFeeRatePercent}% 이하여야 합니다.`,
      );
    }
  }

  return errors;
}
