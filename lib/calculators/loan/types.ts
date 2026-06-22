export interface LoanRepaymentInput {
  /** 대출원금 (원) */
  principal: number;
  /** 연이율 (%) */
  annualInterestRate: number;
  /** 대출기간 (개월) */
  termMonths: number;
}

export type LoanRepaymentType =
  | "equalPayment"
  | "equalPrincipal"
  | "bullet";

export interface LoanScheduleItem {
  installmentNumber: number;
  openingBalance: number;
  principalPayment: number;
  interestPayment: number;
  monthlyPayment: number;
  closingBalance: number;
}

export interface LoanRepaymentSummary {
  repaymentType: LoanRepaymentType;
  principal: number;
  totalInterest: number;
  totalPayment: number;
  termMonths: number;
  schedule: LoanScheduleItem[];
}

export interface EqualPaymentResult extends LoanRepaymentSummary {
  repaymentType: "equalPayment";
  regularMonthlyPayment: number;
  firstMonthPrincipal: number;
  firstMonthInterest: number;
  lastMonthPrincipal: number;
  lastMonthInterest: number;
  lastMonthPayment: number;
}

export interface EqualPrincipalResult extends LoanRepaymentSummary {
  repaymentType: "equalPrincipal";
  baseMonthlyPrincipal: number;
  firstMonthPayment: number;
  lastMonthPayment: number;
  firstMonthInterest: number;
  lastMonthInterest: number;
}

export interface BulletResult extends LoanRepaymentSummary {
  repaymentType: "bullet";
  regularMonthlyInterest: number;
  maturityMonthPayment: number;
  maturityMonthPrincipal: number;
  maturityMonthInterest: number;
}

export interface TotalInterestDifferences {
  equalPaymentVsEqualPrincipal: number;
  equalPaymentVsBullet: number;
  equalPrincipalVsBullet: number;
}

export interface LoanRepaymentComparisonResult {
  equalPayment: EqualPaymentResult;
  equalPrincipal: EqualPrincipalResult;
  bullet: BulletResult;
  lowestTotalInterestTypes: LoanRepaymentType[];
  lowestFirstMonthPaymentTypes: LoanRepaymentType[];
  levelPaymentTypes: LoanRepaymentType[];
  totalInterestDifferences: TotalInterestDifferences;
}

export type LoanRepaymentInputField = keyof LoanRepaymentInput;

export type LoanRepaymentValidationErrorCode =
  | "REQUIRED"
  | "INVALID_NUMBER"
  | "MUST_BE_SAFE_INTEGER"
  | "MUST_BE_POSITIVE"
  | "MUST_BE_NON_NEGATIVE"
  | "MUST_BE_INTEGER"
  | "PRINCIPAL_EXCEEDS_LIMIT"
  | "RATE_EXCEEDS_LIMIT"
  | "RATE_PRECISION_EXCEEDED"
  | "TERM_EXCEEDS_LIMIT";

export interface LoanRepaymentValidationError {
  field: LoanRepaymentInputField;
  code: LoanRepaymentValidationErrorCode;
  message: string;
}

export type LoanRepaymentCalculationResponse =
  | {
      success: true;
      data: LoanRepaymentComparisonResult;
    }
  | {
      success: false;
      errors: LoanRepaymentValidationError[];
    };
