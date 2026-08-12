import type {
  TrainingCertificateCostInput,
  TrainingCertificateCostInputField,
  TrainingCertificateCostValidationError,
  TrainingCertificateCostValidationErrorCode,
} from "./types";

export const TRAINING_CERTIFICATE_COST_LIMITS = {
  maximumAmount: 10_000_000_000,
  minimumExamAttempts: 1,
} as const;

const inputFields: TrainingCertificateCostInputField[] = [
  "totalTrainingCost",
  "trainingSelfPayAmount",
  "examFee",
  "expectedExamAttempts",
  "textbookCost",
  "practiceMaterialCost",
  "transportationCost",
  "mealCost",
  "otherCost",
];

const requiredFields: TrainingCertificateCostInputField[] = [
  "totalTrainingCost",
  "trainingSelfPayAmount",
  "examFee",
  "expectedExamAttempts",
];

const optionalCostFields: TrainingCertificateCostInputField[] = [
  "textbookCost",
  "practiceMaterialCost",
  "transportationCost",
  "mealCost",
  "otherCost",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEmpty(value: unknown): boolean {
  return value === "" || value === null || value === undefined;
}

function readValue(input: unknown, field: TrainingCertificateCostInputField) {
  if (!isRecord(input)) {
    return undefined;
  }

  return input[field];
}

function isOptionalCostField(
  field: TrainingCertificateCostInputField,
): boolean {
  return optionalCostFields.includes(field);
}

function addError(
  errors: TrainingCertificateCostValidationError[],
  field: TrainingCertificateCostValidationError["field"],
  code: TrainingCertificateCostValidationErrorCode,
  message: string,
) {
  errors.push({ field, code, message });
}

function getMissingRequiredFieldMessage(
  field: TrainingCertificateCostInputField,
): string {
  const messages: Record<TrainingCertificateCostInputField, string> = {
    totalTrainingCost: "총 훈련비를 입력해 주세요.",
    trainingSelfPayAmount: "훈련비 본인부담액을 입력해 주세요.",
    examFee: "1회 응시료를 입력해 주세요.",
    expectedExamAttempts: "예상 응시 횟수를 입력해 주세요.",
    textbookCost: "교재비를 입력해 주세요.",
    practiceMaterialCost: "실습·재료비를 입력해 주세요.",
    transportationCost: "교통비를 입력해 주세요.",
    mealCost: "식비를 입력해 주세요.",
    otherCost: "기타 비용을 입력해 주세요.",
  };

  return messages[field];
}

function getInvalidNumberMessage(
  field: TrainingCertificateCostInputField,
): string {
  if (field === "expectedExamAttempts") {
    return "예상 응시 횟수는 유한한 숫자로 입력해 주세요.";
  }

  return "금액은 유한한 숫자로 입력해 주세요.";
}

function getIntegerMessage(field: TrainingCertificateCostInputField): string {
  return field === "expectedExamAttempts"
    ? "예상 응시 횟수는 정수로 입력해 주세요."
    : "금액은 원 단위 정수로 입력해 주세요.";
}

function getSafeIntegerMessage(
  field: TrainingCertificateCostInputField,
): string {
  return field === "expectedExamAttempts"
    ? "예상 응시 횟수가 안전한 정수 범위를 벗어났습니다."
    : "금액이 안전한 정수 범위를 벗어났습니다.";
}

function normalizeOptionalValue(value: unknown): unknown {
  return isEmpty(value) ? 0 : value;
}

export function normalizeTrainingCertificateCostInput(
  input: unknown,
): TrainingCertificateCostInput | null {
  if (!isRecord(input)) {
    return null;
  }

  const normalized = Object.fromEntries(
    inputFields.map((field) => [
      field,
      isOptionalCostField(field)
        ? normalizeOptionalValue(input[field])
        : input[field],
    ]),
  ) as Record<TrainingCertificateCostInputField, unknown>;

  if (
    inputFields.some(
      (field) =>
        typeof normalized[field] !== "number" ||
        !Number.isFinite(normalized[field]),
    )
  ) {
    return null;
  }

  return normalized as TrainingCertificateCostInput;
}

export function validateTrainingCertificateCostInput(
  input: unknown,
): TrainingCertificateCostValidationError[] {
  const errors: TrainingCertificateCostValidationError[] = [];

  for (const field of inputFields) {
    const value = readValue(input, field);

    if (isEmpty(value)) {
      if (!isOptionalCostField(field) && requiredFields.includes(field)) {
        addError(
          errors,
          field,
          "REQUIRED",
          getMissingRequiredFieldMessage(field),
        );
      }
      continue;
    }

    if (typeof value !== "number" || !Number.isFinite(value)) {
      addError(errors, field, "INVALID_NUMBER", getInvalidNumberMessage(field));
      continue;
    }

    if (!Number.isInteger(value)) {
      addError(errors, field, "MUST_BE_INTEGER", getIntegerMessage(field));
      continue;
    }

    if (!Number.isSafeInteger(value)) {
      addError(
        errors,
        field,
        "MUST_BE_SAFE_INTEGER",
        getSafeIntegerMessage(field),
      );
      continue;
    }

    if (field === "expectedExamAttempts") {
      if (value < TRAINING_CERTIFICATE_COST_LIMITS.minimumExamAttempts) {
        addError(
          errors,
          field,
          "MUST_BE_POSITIVE",
          "예상 응시 횟수는 1회 이상이어야 합니다.",
        );
      }
      continue;
    }

    if (value < 0) {
      addError(
        errors,
        field,
        "MUST_BE_NON_NEGATIVE",
        "금액은 0원 이상이어야 합니다.",
      );
    } else if (value > TRAINING_CERTIFICATE_COST_LIMITS.maximumAmount) {
      addError(
        errors,
        field,
        "AMOUNT_EXCEEDS_LIMIT",
        `금액은 ${TRAINING_CERTIFICATE_COST_LIMITS.maximumAmount.toLocaleString("ko-KR")}원 이하여야 합니다.`,
      );
    }
  }

  const normalized = normalizeTrainingCertificateCostInput(input);

  if (errors.length === 0 && normalized !== null) {
    if (normalized.trainingSelfPayAmount > normalized.totalTrainingCost) {
      addError(
        errors,
        "trainingSelfPayAmount",
        "SELF_PAY_EXCEEDS_TOTAL",
        "훈련비 본인부담액은 총 훈련비보다 클 수 없습니다.",
      );
    }
  }

  return errors;
}
