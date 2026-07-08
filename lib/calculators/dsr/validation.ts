import { DSR_POLICY } from "./constants";
import type {
  DsrInput,
  DsrInputField,
  DsrRepaymentType,
  DsrValidationError,
  DsrValidationErrorCode,
} from "./types";

const repaymentTypes = new Set<DsrRepaymentType>([
  "levelPayment",
  "equalPrincipal",
  "bullet",
]);

function addError(
  errors: DsrValidationError[],
  field: DsrInputField,
  code: DsrValidationErrorCode,
  message: string,
) {
  errors.push({ field, code, message });
}

function isMissing(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function validatePositiveAmount(
  errors: DsrValidationError[],
  input: Partial<DsrInput>,
  field: "annualIncome" | "newLoanPrincipal",
  message: string,
) {
  const value = input[field];

  if (isMissing(value)) {
    addError(errors, field, "REQUIRED", message);
  } else if (!isFiniteNumber(value)) {
    addError(errors, field, "INVALID_NUMBER", message);
  } else {
    if (value <= 0) {
      addError(errors, field, "MUST_BE_POSITIVE", message);
    }
    if (value > DSR_POLICY.maximumAmount) {
      addError(
        errors,
        field,
        "AMOUNT_EXCEEDS_LIMIT",
        "금액이 너무 큽니다. 입력값을 다시 확인해 주세요.",
      );
    }
  }
}

export function validateDsrInput(
  input: Partial<DsrInput>,
): DsrValidationError[] {
  const errors: DsrValidationError[] = [];

  validatePositiveAmount(
    errors,
    input,
    "annualIncome",
    "연소득을 0보다 큰 금액으로 입력해 주세요.",
  );
  validatePositiveAmount(
    errors,
    input,
    "newLoanPrincipal",
    "신규 대출 금액을 0보다 큰 금액으로 입력해 주세요.",
  );

  if (isMissing(input.existingAnnualDebtPayment)) {
    addError(
      errors,
      "existingAnnualDebtPayment",
      "REQUIRED",
      "기존 대출 연간 원리금을 입력해 주세요.",
    );
  } else if (!isFiniteNumber(input.existingAnnualDebtPayment)) {
    addError(
      errors,
      "existingAnnualDebtPayment",
      "INVALID_NUMBER",
      "기존 대출 연간 원리금은 숫자로 입력해 주세요.",
    );
  } else {
    if (input.existingAnnualDebtPayment < 0) {
      addError(
        errors,
        "existingAnnualDebtPayment",
        "MUST_BE_NON_NEGATIVE",
        "기존 대출 연간 원리금은 0원 이상으로 입력해 주세요.",
      );
    }
    if (input.existingAnnualDebtPayment > DSR_POLICY.maximumAmount) {
      addError(
        errors,
        "existingAnnualDebtPayment",
        "AMOUNT_EXCEEDS_LIMIT",
        "기존 대출 연간 원리금이 너무 큽니다. 입력값을 다시 확인해 주세요.",
      );
    }
  }

  if (isMissing(input.annualInterestRate)) {
    addError(
      errors,
      "annualInterestRate",
      "REQUIRED",
      "신규 대출 금리를 입력해 주세요.",
    );
  } else if (!isFiniteNumber(input.annualInterestRate)) {
    addError(
      errors,
      "annualInterestRate",
      "INVALID_NUMBER",
      "신규 대출 금리는 숫자로 입력해 주세요.",
    );
  } else {
    if (input.annualInterestRate < 0) {
      addError(
        errors,
        "annualInterestRate",
        "MUST_BE_NON_NEGATIVE",
        "신규 대출 금리는 0 이상으로 입력해 주세요.",
      );
    }
    if (input.annualInterestRate > DSR_POLICY.maximumAnnualInterestRate) {
      addError(
        errors,
        "annualInterestRate",
        "RATE_EXCEEDS_LIMIT",
        "신규 대출 금리가 너무 높습니다. 입력값을 다시 확인해 주세요.",
      );
    }
  }

  if (isMissing(input.termMonths)) {
    addError(errors, "termMonths", "REQUIRED", "대출 기간을 입력해 주세요.");
  } else if (!isFiniteNumber(input.termMonths)) {
    addError(
      errors,
      "termMonths",
      "INVALID_NUMBER",
      "대출 기간은 개월 수로 입력해 주세요.",
    );
  } else {
    if (!Number.isInteger(input.termMonths)) {
      addError(
        errors,
        "termMonths",
        "MUST_BE_INTEGER",
        "대출 기간은 정수 개월로 입력해 주세요.",
      );
    }
    if (input.termMonths <= 0) {
      addError(
        errors,
        "termMonths",
        "MUST_BE_POSITIVE",
        "대출 기간을 0보다 큰 값으로 입력해 주세요.",
      );
    }
    if (input.termMonths > DSR_POLICY.maximumTermMonths) {
      addError(
        errors,
        "termMonths",
        "TERM_EXCEEDS_LIMIT",
        "대출 기간은 600개월 이내로 입력해 주세요.",
      );
    }
  }

  if (!input.repaymentType || !repaymentTypes.has(input.repaymentType)) {
    addError(
      errors,
      "repaymentType",
      "INVALID_OPTION",
      "상환 방식을 선택해 주세요.",
    );
  }

  if (isMissing(input.stressInterestRate)) {
    addError(
      errors,
      "stressInterestRate",
      "REQUIRED",
      "스트레스 금리를 입력해 주세요.",
    );
  } else if (!isFiniteNumber(input.stressInterestRate)) {
    addError(
      errors,
      "stressInterestRate",
      "INVALID_NUMBER",
      "스트레스 금리는 숫자로 입력해 주세요.",
    );
  } else {
    if (input.stressInterestRate < 0) {
      addError(
        errors,
        "stressInterestRate",
        "MUST_BE_NON_NEGATIVE",
        "스트레스 금리는 0 이상으로 입력해 주세요.",
      );
    }
    if (input.stressInterestRate > DSR_POLICY.maximumStressInterestRate) {
      addError(
        errors,
        "stressInterestRate",
        "RATE_EXCEEDS_LIMIT",
        "스트레스 금리가 너무 높습니다. 입력값을 다시 확인해 주세요.",
      );
    }
  }

  if (isMissing(input.dsrLimitRate)) {
    addError(
      errors,
      "dsrLimitRate",
      "REQUIRED",
      "DSR 기준 비율을 입력해 주세요.",
    );
  } else if (!isFiniteNumber(input.dsrLimitRate)) {
    addError(
      errors,
      "dsrLimitRate",
      "INVALID_NUMBER",
      "DSR 기준 비율은 숫자로 입력해 주세요.",
    );
  } else {
    if (input.dsrLimitRate <= 0) {
      addError(
        errors,
        "dsrLimitRate",
        "MUST_BE_POSITIVE",
        "DSR 기준 비율을 0보다 큰 값으로 입력해 주세요.",
      );
    }
    if (input.dsrLimitRate > DSR_POLICY.maximumDsrLimitRate) {
      addError(
        errors,
        "dsrLimitRate",
        "RATE_EXCEEDS_LIMIT",
        "DSR 기준 비율이 너무 큽니다. 입력값을 다시 확인해 주세요.",
      );
    }
  }

  return errors;
}
