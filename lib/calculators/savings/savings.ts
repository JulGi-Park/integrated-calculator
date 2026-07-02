export const SAVINGS_CRITERION_DATE = "2026-07-02";

// 기준일: 2026-07-02
// 공식 출처: 법제처 국가법령정보센터 소득세법 제129조 원천징수세율,
// 국세청 원천징수 안내의 개인 지방소득세 특별징수 기준.
export const GENERAL_INCOME_TAX_RATE = 0.14;
export const LOCAL_INCOME_TAX_RATE_ON_INCOME_TAX = 0.1;
export const GENERAL_TOTAL_TAX_RATE =
  GENERAL_INCOME_TAX_RATE * (1 + LOCAL_INCOME_TAX_RATE_ON_INCOME_TAX);
export const MAX_TERM_MONTHS = 600;
export const MAX_ANNUAL_INTEREST_RATE = 100;

export type SavingsProductType = "deposit" | "installment";
export type SavingsTaxType = "general" | "taxFree";
export type SavingsInterestType = "simple";

export interface SavingsInput {
  productType: SavingsProductType;
  amount: number;
  termMonths: number;
  annualInterestRate: number;
  taxType: SavingsTaxType;
  interestType: SavingsInterestType;
}

export interface SavingsResult {
  productType: SavingsProductType;
  principalTotal: number;
  grossInterest: number;
  incomeTax: number;
  localIncomeTax: number;
  totalTax: number;
  netInterest: number;
  maturityAmount: number;
  appliedTaxRate: number;
  appliedIncomeTaxRate: number;
  appliedLocalIncomeTaxRate: number;
  termMonths: number;
  annualInterestRate: number;
  depositAmount?: number;
  monthlyPayment?: number;
  interestType: SavingsInterestType;
  taxType: SavingsTaxType;
  installmentInterestMonthSum?: number;
  resultType: "savings";
  summaryMessageKey: "maturityAmountEstimated";
}

export type SavingsInputField = keyof SavingsInput;

export type SavingsValidationErrorCode =
  | "INVALID_NUMBER"
  | "INVALID_PRODUCT_TYPE"
  | "INVALID_TAX_TYPE"
  | "INVALID_INTEREST_TYPE"
  | "MUST_BE_POSITIVE"
  | "MUST_BE_INTEGER"
  | "TERM_TOO_LARGE"
  | "RATE_TOO_LARGE"
  | "MUST_BE_NON_NEGATIVE";

export interface SavingsValidationError {
  field: SavingsInputField;
  code: SavingsValidationErrorCode;
  message: string;
}

export type SavingsCalculationResponse =
  | {
      success: true;
      data: SavingsResult;
    }
  | {
      success: false;
      errors: SavingsValidationError[];
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function roundToWon(value: number): number {
  return Math.round(value);
}

function addError(
  errors: SavingsValidationError[],
  field: SavingsInputField,
  code: SavingsValidationErrorCode,
  message: string,
) {
  errors.push({ field, code, message });
}

function hasValidInputShape(
  input: Record<string, unknown>,
): input is Record<string, unknown> & SavingsInput {
  return (
    (input.productType === "deposit" || input.productType === "installment") &&
    isFiniteNumber(input.amount) &&
    isFiniteNumber(input.termMonths) &&
    isFiniteNumber(input.annualInterestRate) &&
    (input.taxType === "general" || input.taxType === "taxFree") &&
    input.interestType === "simple"
  );
}

export function validateSavingsInput(
  input: unknown,
): SavingsValidationError[] {
  const errors: SavingsValidationError[] = [];

  if (!isRecord(input)) {
    return [
      {
        field: "amount",
        code: "INVALID_NUMBER",
        message: "숫자로 입력해 주세요.",
      },
      {
        field: "termMonths",
        code: "INVALID_NUMBER",
        message: "숫자로 입력해 주세요.",
      },
      {
        field: "annualInterestRate",
        code: "INVALID_NUMBER",
        message: "숫자로 입력해 주세요.",
      },
    ];
  }

  if (input.productType !== "deposit" && input.productType !== "installment") {
    addError(
      errors,
      "productType",
      "INVALID_PRODUCT_TYPE",
      "상품 유형을 다시 선택해 주세요.",
    );
  }

  if (!isFiniteNumber(input.amount)) {
    addError(errors, "amount", "INVALID_NUMBER", "숫자로 입력해 주세요.");
  } else if (input.amount <= 0) {
    addError(
      errors,
      "amount",
      "MUST_BE_POSITIVE",
      "금액은 0원보다 커야 합니다.",
    );
  }

  if (!isFiniteNumber(input.termMonths)) {
    addError(errors, "termMonths", "INVALID_NUMBER", "숫자로 입력해 주세요.");
  } else {
    if (!Number.isInteger(input.termMonths)) {
      addError(
        errors,
        "termMonths",
        "MUST_BE_INTEGER",
        "기간은 개월 단위 정수로 입력해 주세요.",
      );
    }

    if (input.termMonths < 1) {
      addError(
        errors,
        "termMonths",
        "MUST_BE_POSITIVE",
        "기간은 1개월 이상이어야 합니다.",
      );
    }

    if (input.termMonths > MAX_TERM_MONTHS) {
      addError(
        errors,
        "termMonths",
        "TERM_TOO_LARGE",
        "기간은 600개월 이하로 입력해 주세요.",
      );
    }
  }

  if (!isFiniteNumber(input.annualInterestRate)) {
    addError(
      errors,
      "annualInterestRate",
      "INVALID_NUMBER",
      "숫자로 입력해 주세요.",
    );
  } else if (input.annualInterestRate < 0) {
    addError(
      errors,
      "annualInterestRate",
      "MUST_BE_NON_NEGATIVE",
      "연 이율은 0% 이상이어야 합니다.",
    );
  } else if (input.annualInterestRate >= MAX_ANNUAL_INTEREST_RATE) {
    addError(
      errors,
      "annualInterestRate",
      "RATE_TOO_LARGE",
      "연 이율이 너무 큽니다. 입력값을 다시 확인해 주세요.",
    );
  }

  if (input.taxType !== "general" && input.taxType !== "taxFree") {
    addError(
      errors,
      "taxType",
      "INVALID_TAX_TYPE",
      "과세 방식을 다시 선택해 주세요.",
    );
  }

  if (input.interestType !== "simple") {
    addError(
      errors,
      "interestType",
      "INVALID_INTEREST_TYPE",
      "1차 계산기는 단리 기준만 지원합니다.",
    );
  }

  return errors;
}

function calculateTax(grossInterest: number, taxType: SavingsTaxType) {
  if (taxType === "taxFree") {
    return {
      incomeTax: 0,
      localIncomeTax: 0,
      totalTax: 0,
      appliedTaxRate: 0,
      appliedIncomeTaxRate: 0,
      appliedLocalIncomeTaxRate: 0,
    };
  }

  const incomeTax = roundToWon(grossInterest * GENERAL_INCOME_TAX_RATE);
  const localIncomeTax = roundToWon(
    incomeTax * LOCAL_INCOME_TAX_RATE_ON_INCOME_TAX,
  );

  return {
    incomeTax,
    localIncomeTax,
    totalTax: roundToWon(incomeTax + localIncomeTax),
    appliedTaxRate: GENERAL_TOTAL_TAX_RATE,
    appliedIncomeTaxRate: GENERAL_INCOME_TAX_RATE,
    appliedLocalIncomeTaxRate: LOCAL_INCOME_TAX_RATE_ON_INCOME_TAX,
  };
}

function calculateDepositGrossInterest(input: SavingsInput): number {
  return roundToWon(
    input.amount * (input.annualInterestRate / 100) * (input.termMonths / 12),
  );
}

function calculateInstallmentGrossInterest(input: SavingsInput): number {
  return roundToWon(
    input.amount *
      (input.annualInterestRate / 100 / 12) *
      ((input.termMonths * (input.termMonths + 1)) / 2),
  );
}

export function calculateSavings(input: unknown): SavingsCalculationResponse {
  const errors = validateSavingsInput(input);

  if (errors.length > 0 || !isRecord(input) || !hasValidInputShape(input)) {
    return { success: false, errors };
  }

  const principalTotal =
    input.productType === "deposit" ? input.amount : input.amount * input.termMonths;
  const grossInterest =
    input.productType === "deposit"
      ? calculateDepositGrossInterest(input)
      : calculateInstallmentGrossInterest(input);
  const tax = calculateTax(grossInterest, input.taxType);
  const netInterest = roundToWon(grossInterest - tax.totalTax);
  const maturityAmount = roundToWon(principalTotal + netInterest);

  return {
    success: true,
    data: {
      productType: input.productType,
      principalTotal: roundToWon(principalTotal),
      grossInterest,
      incomeTax: tax.incomeTax,
      localIncomeTax: tax.localIncomeTax,
      totalTax: tax.totalTax,
      netInterest,
      maturityAmount,
      appliedTaxRate: tax.appliedTaxRate,
      appliedIncomeTaxRate: tax.appliedIncomeTaxRate,
      appliedLocalIncomeTaxRate: tax.appliedLocalIncomeTaxRate,
      termMonths: input.termMonths,
      annualInterestRate: input.annualInterestRate,
      depositAmount: input.productType === "deposit" ? input.amount : undefined,
      monthlyPayment:
        input.productType === "installment" ? input.amount : undefined,
      interestType: input.interestType,
      taxType: input.taxType,
      installmentInterestMonthSum:
        input.productType === "installment"
          ? (input.termMonths * (input.termMonths + 1)) / 2
          : undefined,
      resultType: "savings",
      summaryMessageKey: "maturityAmountEstimated",
    },
  };
}
