export type DsrRepaymentType =
  | "levelPayment"
  | "equalPrincipal"
  | "partialInstallment"
  | "bullet";

export type DsrLoanType =
  | "mortgage"
  | "credit"
  | "officetelMortgage"
  | "nonHousingMortgage"
  | "leaseDepositSecured";

export type DsrCreditRepaymentFrequency = "monthly" | "quarterly" | "other";

export interface DsrInput {
  annualIncome: number;
  existingAnnualDebtPayment: number;
  newLoanPrincipal: number;
  annualInterestRate: number;
  termMonths: number;
  loanType: DsrLoanType;
  repaymentType: DsrRepaymentType;
  gracePeriodMonths: number;
  balloonPrincipal: number;
  creditInstallmentRatio: number;
  creditRepaymentFrequency: DsrCreditRepaymentFrequency;
  stressInterestRate: number;
  dsrLimitRate: number;
}

export interface DsrLoanPaymentSummary {
  repaymentType: DsrRepaymentType;
  monthlyPayment: number;
  firstMonthlyPayment: number;
  averageMonthlyPayment: number;
  annualPaymentForDsr: number;
  annualPrincipalForDsr: number;
  annualInterestForDsr: number;
  contractAnnualPayment: number;
  assessmentMaturityMonths: number;
  assessmentReason: string;
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
  | "loanType"
  | "repaymentType"
  | "gracePeriodMonths"
  | "balloonPrincipal"
  | "creditInstallmentRatio"
  | "creditRepaymentFrequency"
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
