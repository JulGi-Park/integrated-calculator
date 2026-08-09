export type YouthFutureSavingsContributionType =
  | "standard"
  | "preferred"
  | "customRate"
  | "customMonthly";

export type YouthFutureSavingsTaxType = "taxFree" | "taxable";

export interface YouthFutureSavingsInput {
  monthlyDeposit: number;
  termMonths: number;
  annualInterestRate: number;
  contributionType: YouthFutureSavingsContributionType;
  customContributionRate?: number;
  customMonthlyContribution?: number;
  taxType: YouthFutureSavingsTaxType;
}

export interface YouthFutureSavingsResult {
  monthlyDeposit: number;
  termMonths: number;
  annualInterestRate: number;
  contributionType: YouthFutureSavingsContributionType;
  taxType: YouthFutureSavingsTaxType;
  totalPrincipal: number;
  grossInterest: number;
  interestTax: number;
  taxSaving: number;
  governmentContribution: number;
  maturityAmount: number;
  averageMonthlyBenefit: number;
  effectiveContributionRate: number;
}

export type YouthFutureSavingsInputField =
  | "monthlyDeposit"
  | "termMonths"
  | "annualInterestRate"
  | "contributionType"
  | "customContributionRate"
  | "customMonthlyContribution"
  | "taxType";

export type YouthFutureSavingsValidationErrorCode =
  | "REQUIRED"
  | "INVALID_NUMBER"
  | "MUST_BE_POSITIVE"
  | "MUST_BE_NON_NEGATIVE"
  | "MUST_BE_INTEGER"
  | "MONTHLY_DEPOSIT_EXCEEDS_LIMIT"
  | "TERM_EXCEEDS_LIMIT"
  | "RATE_EXCEEDS_LIMIT"
  | "CONTRIBUTION_EXCEEDS_LIMIT"
  | "INVALID_OPTION"
  | "RESULT_EXCEEDS_LIMIT";

export interface YouthFutureSavingsValidationError {
  field: YouthFutureSavingsInputField;
  code: YouthFutureSavingsValidationErrorCode;
  message: string;
}

export type YouthFutureSavingsCalculationResponse =
  | {
      success: true;
      data: YouthFutureSavingsResult;
    }
  | {
      success: false;
      errors: YouthFutureSavingsValidationError[];
    };
