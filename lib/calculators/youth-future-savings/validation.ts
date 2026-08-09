import { YOUTH_FUTURE_SAVINGS_POLICY } from "./constants";
import type {
  YouthFutureSavingsContributionType,
  YouthFutureSavingsInput,
  YouthFutureSavingsInputField,
  YouthFutureSavingsTaxType,
  YouthFutureSavingsValidationError,
  YouthFutureSavingsValidationErrorCode,
} from "./types";

const contributionTypes = new Set<YouthFutureSavingsContributionType>([
  "standard",
  "preferred",
  "customRate",
  "customMonthly",
]);

const taxTypes = new Set<YouthFutureSavingsTaxType>(["taxFree", "taxable"]);

function addError(
  errors: YouthFutureSavingsValidationError[],
  field: YouthFutureSavingsInputField,
  code: YouthFutureSavingsValidationErrorCode,
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

export function validateYouthFutureSavingsInput(
  input: Partial<YouthFutureSavingsInput>,
): YouthFutureSavingsValidationError[] {
  const errors: YouthFutureSavingsValidationError[] = [];

  if (isMissing(input.monthlyDeposit)) {
    addError(
      errors,
      "monthlyDeposit",
      "REQUIRED",
      "월 납입액을 입력해 주세요.",
    );
  } else if (!isFiniteNumber(input.monthlyDeposit)) {
    addError(
      errors,
      "monthlyDeposit",
      "INVALID_NUMBER",
      "월 납입액은 숫자로 입력해 주세요.",
    );
  } else {
    if (!Number.isInteger(input.monthlyDeposit)) {
      addError(
        errors,
        "monthlyDeposit",
        "MUST_BE_INTEGER",
        "월 납입액은 원 단위 정수로 입력해 주세요.",
      );
    }
    if (input.monthlyDeposit <= 0) {
      addError(
        errors,
        "monthlyDeposit",
        "MUST_BE_POSITIVE",
        "월 납입액은 1원 이상이어야 합니다.",
      );
    }
    if (
      input.monthlyDeposit >
      YOUTH_FUTURE_SAVINGS_POLICY.maximumMonthlyDeposit
    ) {
      addError(
        errors,
        "monthlyDeposit",
        "MONTHLY_DEPOSIT_EXCEEDS_LIMIT",
        "청년미래적금 월 납입 한도는 50만원 기준으로 계산합니다.",
      );
    }
  }

  if (isMissing(input.termMonths)) {
    addError(errors, "termMonths", "REQUIRED", "가입 기간을 입력해 주세요.");
  } else if (!isFiniteNumber(input.termMonths)) {
    addError(
      errors,
      "termMonths",
      "INVALID_NUMBER",
      "가입 기간은 개월 수로 입력해 주세요.",
    );
  } else {
    if (!Number.isInteger(input.termMonths)) {
      addError(
        errors,
        "termMonths",
        "MUST_BE_INTEGER",
        "가입 기간은 정수 개월로 입력해 주세요.",
      );
    }
    if (input.termMonths <= 0) {
      addError(
        errors,
        "termMonths",
        "MUST_BE_POSITIVE",
        "가입 기간은 1개월 이상이어야 합니다.",
      );
    }
    if (input.termMonths > YOUTH_FUTURE_SAVINGS_POLICY.maximumTermMonths) {
      addError(
        errors,
        "termMonths",
        "TERM_EXCEEDS_LIMIT",
        "청년미래적금은 3년 만기 기준 상품이므로 최대 36개월 기준으로 계산합니다.",
      );
    }
  }

  if (isMissing(input.annualInterestRate)) {
    addError(
      errors,
      "annualInterestRate",
      "REQUIRED",
      "연 이자율을 입력해 주세요.",
    );
  } else if (!isFiniteNumber(input.annualInterestRate)) {
    addError(
      errors,
      "annualInterestRate",
      "INVALID_NUMBER",
      "연 이자율은 숫자로 입력해 주세요.",
    );
  } else {
    if (input.annualInterestRate < 0) {
      addError(
        errors,
        "annualInterestRate",
        "MUST_BE_NON_NEGATIVE",
        "연 이자율은 0 이상이어야 합니다.",
      );
    }
    if (
      input.annualInterestRate >
      YOUTH_FUTURE_SAVINGS_POLICY.maximumAnnualInterestRate
    ) {
      addError(
        errors,
        "annualInterestRate",
        "RATE_EXCEEDS_LIMIT",
        "연 이자율이 너무 높습니다. 입력값을 다시 확인해 주세요.",
      );
    }
  }

  if (
    !input.contributionType ||
    !contributionTypes.has(input.contributionType)
  ) {
    addError(
      errors,
      "contributionType",
      "INVALID_OPTION",
      "정부기여금 방식을 선택해 주세요.",
    );
  }

  if (!input.taxType || !taxTypes.has(input.taxType)) {
    addError(errors, "taxType", "INVALID_OPTION", "과세 여부를 선택해 주세요.");
  }

  if (input.contributionType === "customRate") {
    if (isMissing(input.customContributionRate)) {
      addError(
        errors,
        "customContributionRate",
        "REQUIRED",
        "정부기여금 비율을 입력해 주세요.",
      );
    } else if (!isFiniteNumber(input.customContributionRate)) {
      addError(
        errors,
        "customContributionRate",
        "INVALID_NUMBER",
        "정부기여금 비율은 숫자로 입력해 주세요.",
      );
    } else {
      if (input.customContributionRate < 0) {
        addError(
          errors,
          "customContributionRate",
          "MUST_BE_NON_NEGATIVE",
          "정부기여금은 0원 이상으로 입력해 주세요.",
        );
      }
      if (
        input.customContributionRate >
        YOUTH_FUTURE_SAVINGS_POLICY.maximumCustomContributionRate
      ) {
        addError(
          errors,
          "customContributionRate",
          "CONTRIBUTION_EXCEEDS_LIMIT",
          "정부기여금 입력값이 너무 큽니다. 다시 확인해 주세요.",
        );
      }
    }
  }

  if (input.contributionType === "customMonthly") {
    if (isMissing(input.customMonthlyContribution)) {
      addError(
        errors,
        "customMonthlyContribution",
        "REQUIRED",
        "월 정부기여금 예상액을 입력해 주세요.",
      );
    } else if (!isFiniteNumber(input.customMonthlyContribution)) {
      addError(
        errors,
        "customMonthlyContribution",
        "INVALID_NUMBER",
        "월 정부기여금 예상액은 숫자로 입력해 주세요.",
      );
    } else {
      if (input.customMonthlyContribution < 0) {
        addError(
          errors,
          "customMonthlyContribution",
          "MUST_BE_NON_NEGATIVE",
          "정부기여금은 0원 이상으로 입력해 주세요.",
        );
      }
      if (
        input.customMonthlyContribution >
        YOUTH_FUTURE_SAVINGS_POLICY.maximumCustomMonthlyContribution
      ) {
        addError(
          errors,
          "customMonthlyContribution",
          "CONTRIBUTION_EXCEEDS_LIMIT",
          "정부기여금 입력값이 너무 큽니다. 다시 확인해 주세요.",
        );
      }
    }
  }

  return errors;
}
