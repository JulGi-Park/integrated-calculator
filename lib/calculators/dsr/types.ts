export type DsrRepaymentType =
  | "levelPayment"
  | "equalPrincipal"
  | "bullet";

export interface DsrInput {
  annualIncome: number;
  existingAnnualDebtPayment: number;
  newLoanPrincipal: number;
  annualInterestRate: number;
  termMonths: number;
  repaymentType: DsrRepaymentType;
  stressInterestRate: number;
  dsrLimitRate: number;
}

export interface DsrLoanPaymentSummary {
  repaymentType: DsrRepaymentType;
  monthlyPayment: number;
  firstMonthlyPayment: number;
  averageMonthlyPayment: number;
  annualPaymentForDsr: number;
  totalInterest: number;
  maturityPrincipal: number;
  annualInterestRate: number;
}

export interface DsrScenarioResult {
  newLoanPayment: DsrLoanPaymentSummary;
  totalAnnualDebtPayment: number;
  dsrRate: number;
  remainingAnnualPaymentRoom: number;
  remainingDsrRateRoom: number;
  status: "withinLimit" | "exceedsLimit";
  interpretation: string;
}

export interface DsrCalculationResult {
  input: DsrInput;
  base: DsrScenarioResult;
  stressed: DsrScenarioResult;
}

export type DsrInputField =
  | "annualIncome"
  | "existingAnnualDebtPayment"
  | "newLoanPrincipal"
  | "annualInterestRate"
  | "termMonths"
  | "repaymentType"
  | "stressInterestRate"
  | "dsrLimitRate";

export type DsrValidationErrorCode =
  | "REQUIRED"
  | "INVALID_NUMBER"
  | "MUST_BE_POSITIVE"
  | "MUST_BE_NON_NEGATIVE"
  | "MUST_BE_INTEGER"
  | "AMOUNT_EXCEEDS_LIMIT"
  | "RATE_EXCEEDS_LIMIT"
  | "TERM_EXCEEDS_LIMIT"
  | "INVALID_OPTION"
  | "RESULT_EXCEEDS_LIMIT";

export interface DsrValidationError {
  field: DsrInputField;
  code: DsrValidationErrorCode;
  message: string;
}

export type DsrCalculationResponse =
  | {
      success: true;
      data: DsrCalculationResult;
    }
  | {
      success: false;
      errors: DsrValidationError[];
    };
