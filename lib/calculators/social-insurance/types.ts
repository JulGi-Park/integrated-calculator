export interface SocialInsuranceInput {
  monthlySalary: number;
  nonTaxableAmount: number;
}

export type SocialInsuranceInputField =
  | "monthlySalary"
  | "nonTaxableAmount";

export type SocialInsuranceValidationErrorCode =
  | "REQUIRED"
  | "INVALID_NUMBER"
  | "MUST_BE_INTEGER"
  | "MUST_BE_SAFE_INTEGER"
  | "MUST_BE_POSITIVE"
  | "MUST_BE_NON_NEGATIVE"
  | "AMOUNT_EXCEEDS_LIMIT"
  | "NON_TAXABLE_EXCEEDS_MONTHLY_SALARY"
  | "TAXABLE_PAY_MUST_BE_POSITIVE"
  | "NON_FINITE_RESULT";

export interface SocialInsuranceValidationError {
  field: SocialInsuranceInputField;
  code: SocialInsuranceValidationErrorCode;
  message: string;
}

export interface SocialInsuranceContribution {
  amount: number;
  rate: number;
  formula: string;
}

export interface SocialInsuranceResult {
  monthlySalary: number;
  nonTaxableAmount: number;
  taxableMonthlyPay: number;
  pensionBase: number;
  pensionBaseStatus: "minimum" | "maximum" | "within";
  employeePension: number;
  employeeHealthInsurance: number;
  employeeLongTermCare: number;
  employeeEmploymentInsurance: number;
  totalEmployeeContribution: number;
  afterContributionAmount: number;
  policyYear: 2026;
  policyVerifiedAt: string;
}

export type SocialInsuranceCalculationResponse =
  | { success: true; data: SocialInsuranceResult }
  | { success: false; errors: SocialInsuranceValidationError[] };
