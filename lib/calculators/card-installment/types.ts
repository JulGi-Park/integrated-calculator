export interface CardInstallmentInput {
  purchaseAmount: number;
  installmentMonths: number;
  annualFeeRatePercent: number;
}

export type CardInstallmentInputField =
  | "purchaseAmount"
  | "installmentMonths"
  | "annualFeeRatePercent";

export type CardInstallmentValidationErrorCode =
  | "REQUIRED"
  | "INVALID_NUMBER"
  | "MUST_BE_SAFE_INTEGER"
  | "MUST_BE_POSITIVE"
  | "MUST_BE_NON_NEGATIVE"
  | "MUST_BE_INTEGER"
  | "AMOUNT_EXCEEDS_LIMIT"
  | "MONTHS_EXCEEDS_LIMIT"
  | "RATE_EXCEEDS_LIMIT";

export interface CardInstallmentValidationError {
  field: CardInstallmentInputField;
  code: CardInstallmentValidationErrorCode;
  message: string;
}

export interface CardInstallmentScheduleItem {
  installmentNumber: number;
  openingBalance: number;
  principalPayment: number;
  fee: number;
  monthlyPayment: number;
  closingBalance: number;
}

export interface CardInstallmentResult {
  purchaseAmount: number;
  installmentMonths: number;
  annualFeeRatePercent: number;
  monthlyFeeRate: number;
  baseMonthlyPrincipal: number;
  totalFee: number;
  totalPayment: number;
  extraCostComparedWithLumpSum: number;
  schedule: CardInstallmentScheduleItem[];
}

export type CardInstallmentCalculationResponse =
  | { success: true; data: CardInstallmentResult }
  | { success: false; errors: CardInstallmentValidationError[] };
