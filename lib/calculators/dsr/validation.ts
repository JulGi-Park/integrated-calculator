import { DSR_POLICY } from "./constants";
import type {
  DsrInput,
  DsrInputField,
  DsrInterestRateType,
  DsrLoanType,
  DsrRegionType,
  DsrRepaymentType,
  DsrValidationError,
  DsrValidationErrorCode,
} from "./types";

const repaymentTypes = new Set<DsrRepaymentType>([
  "levelPayment",
  "equalPrincipal",
  "partialInstallment",
  "bullet",
]);
const loanTypes = new Set<DsrLoanType>([
  "mortgage",
  "credit",
  "officetelMortgage",
  "nonHousingMortgage",
  "leaseDepositSecured",
]);
const creditFrequencies = new Set(["monthly", "quarterly", "other"]);
const regionTypes = new Set<DsrRegionType>(["capital", "local"]);
const interestRateTypes = new Set<DsrInterestRateType>([
  "variable",
  "mixed",
  "periodic",
  "fixed",
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

  if (!input.loanType || !loanTypes.has(input.loanType)) {
    addError(errors, "loanType", "INVALID_OPTION", "대출 종류를 선택해 주세요.");
  }

  if (!input.regionType || !regionTypes.has(input.regionType)) {
    addError(errors, "regionType", "INVALID_OPTION", "담보물 지역을 선택해 주세요.");
  }

  if (typeof input.isRegulatedArea !== "boolean") {
    addError(
      errors,
      "isRegulatedArea",
      "INVALID_OPTION",
      "규제지역 여부를 선택해 주세요.",
    );
  }

  if (
    !input.interestRateType ||
    !interestRateTypes.has(input.interestRateType)
  ) {
    addError(
      errors,
      "interestRateType",
      "INVALID_OPTION",
      "금리 유형을 선택해 주세요.",
    );
  }

  if (
    !input.creditRepaymentFrequency ||
    !creditFrequencies.has(input.creditRepaymentFrequency)
  ) {
    addError(
      errors,
      "creditRepaymentFrequency",
      "INVALID_OPTION",
      "신용대출 상환 주기를 선택해 주세요.",
    );
  }

  for (const [field, label] of [
    ["gracePeriodMonths", "거치기간"],
    ["balloonPrincipal", "만기상환 원금"],
    ["creditInstallmentRatio", "신용대출 분할상환 비율"],
  ] as const) {
    const value = input[field];
    if (isMissing(value)) {
      addError(errors, field, "REQUIRED", `${label}을 입력해 주세요.`);
    } else if (!isFiniteNumber(value)) {
      addError(errors, field, "INVALID_NUMBER", `${label}은 숫자로 입력해 주세요.`);
    } else if (value < 0) {
      addError(errors, field, "MUST_BE_NON_NEGATIVE", `${label}은 0 이상이어야 합니다.`);
    }
  }

  if (
    isFiniteNumber(input.gracePeriodMonths) &&
    !Number.isInteger(input.gracePeriodMonths)
  ) {
    addError(errors, "gracePeriodMonths", "MUST_BE_INTEGER", "거치기간은 정수 개월로 입력해 주세요.");
  }
  if (
    isFiniteNumber(input.gracePeriodMonths) &&
    isFiniteNumber(input.termMonths) &&
    input.gracePeriodMonths >= input.termMonths
  ) {
    addError(errors, "gracePeriodMonths", "TERM_EXCEEDS_LIMIT", "거치기간은 대출기간보다 짧아야 합니다.");
  }
  if (
    isFiniteNumber(input.balloonPrincipal) &&
    isFiniteNumber(input.newLoanPrincipal) &&
    input.balloonPrincipal > input.newLoanPrincipal
  ) {
    addError(errors, "balloonPrincipal", "AMOUNT_EXCEEDS_LIMIT", "만기상환 원금은 신규 대출금액 이하여야 합니다.");
  }
  if (
    isFiniteNumber(input.creditInstallmentRatio) &&
    input.creditInstallmentRatio > 100
  ) {
    addError(errors, "creditInstallmentRatio", "RATE_EXCEEDS_LIMIT", "분할상환 비율은 100% 이하여야 합니다.");
  }

  if (isMissing(input.creditLoanTotalBalance)) {
    addError(
      errors,
      "creditLoanTotalBalance",
      "REQUIRED",
      "전체 신용대출 잔액을 입력해 주세요.",
    );
  } else if (!isFiniteNumber(input.creditLoanTotalBalance)) {
    addError(
      errors,
      "creditLoanTotalBalance",
      "INVALID_NUMBER",
      "전체 신용대출 잔액은 숫자로 입력해 주세요.",
    );
  } else if (input.creditLoanTotalBalance < 0) {
    addError(
      errors,
      "creditLoanTotalBalance",
      "MUST_BE_NON_NEGATIVE",
      "전체 신용대출 잔액은 0원 이상이어야 합니다.",
    );
  } else if (input.creditLoanTotalBalance > DSR_POLICY.maximumAmount) {
    addError(
      errors,
      "creditLoanTotalBalance",
      "AMOUNT_EXCEEDS_LIMIT",
      "전체 신용대출 잔액이 너무 큽니다.",
    );
  }

  for (const [field, label, isRequired] of [
    [
      "fixedRatePeriodMonths",
      "고정금리 적용기간",
      input.interestRateType === "mixed",
    ],
    [
      "rateResetPeriodMonths",
      "금리변동주기",
      input.interestRateType === "periodic",
    ],
  ] as const) {
    const value = input[field];
    if (isMissing(value)) {
      addError(errors, field, "REQUIRED", `${label}을 입력해 주세요.`);
    } else if (!isFiniteNumber(value)) {
      addError(errors, field, "INVALID_NUMBER", `${label}은 숫자로 입력해 주세요.`);
    } else {
      if (!Number.isInteger(value)) {
        addError(errors, field, "MUST_BE_INTEGER", `${label}은 정수 개월로 입력해 주세요.`);
      }
      if (isRequired && value <= 0) {
        addError(errors, field, "MUST_BE_POSITIVE", `${label}을 0보다 크게 입력해 주세요.`);
      }
      if (value < 0) {
        addError(errors, field, "MUST_BE_NON_NEGATIVE", `${label}은 0 이상이어야 합니다.`);
      }
      if (
        isRequired &&
        isFiniteNumber(input.termMonths) &&
        value > input.termMonths
      ) {
        addError(errors, field, "TERM_EXCEEDS_LIMIT", `${label}은 대출기간 이하여야 합니다.`);
      }
    }
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
