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

export type DsrRegionType = "capital" | "local";

export type DsrInterestRateType =
  | "variable"
  | "mixed"
  | "periodic"
  | "fixed";

export type DsrStressPolicyStage = 2 | 3 | null;

export interface DsrStressPolicyInput {
  referenceDate: string;
  loanType: DsrLoanType;
  regionType: DsrRegionType;
  isRegulatedArea: boolean;
  interestRateType: DsrInterestRateType;
  termMonths: number;
  fixedRatePeriodMonths: number;
  rateResetPeriodMonths: number;
  creditLoanTotalBalance: number;
}

export interface DsrStressPolicyResult {
  supported: boolean;
  applicable: boolean;
  policyStage: DsrStressPolicyStage;
  baseStressRate: number;
  stageMultiplier: number;
  productMultiplier: number;
  finalStressRate: number;
  reason: string;
  referenceDate: string;
  effectiveFrom: string;
  effectiveTo: string;
  source: string;
}

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
  regionType: DsrRegionType;
  isRegulatedArea: boolean;
  interestRateType: DsrInterestRateType;
  fixedRatePeriodMonths: number;
  rateResetPeriodMonths: number;
  creditLoanTotalBalance: number;
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
  officialStressed: DsrScenarioResult;
  officialStressPolicy: DsrStressPolicyResult;
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
  | "regionType"
  | "isRegulatedArea"
  | "interestRateType"
  | "fixedRatePeriodMonths"
  | "rateResetPeriodMonths"
  | "creditLoanTotalBalance"
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
