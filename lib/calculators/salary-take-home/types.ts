export interface SalaryTakeHomeInput {
  /** 퇴직금을 포함하지 않은 연간 급여 (원) */
  annualSalary: number;
  /** 매월 지급되는 비과세 급여 (원) */
  monthlyNonTaxableAmount: number;
  /** 본인을 포함한 공제대상가족 수 */
  dependentCount: number;
  /** 간이세액표상 8세 이상 20세 이하 자녀 수 */
  childCount: number;
}

export interface SalaryTakeHomeResult {
  monthlyGrossSalary: number;
  monthlyTaxableSalary: number;
  nationalPension: number;
  healthInsurance: number;
  longTermCareInsurance: number;
  employmentInsurance: number;
  incomeTax: number;
  localIncomeTax: number;
  totalMonthlyDeductions: number;
  estimatedMonthlyTakeHome: number;
  estimatedAnnualTakeHome: number;
  policyYear: number;
  policyVerifiedAt: string;
}

export type SalaryTakeHomeInputField = keyof SalaryTakeHomeInput;

export type SalaryTakeHomeValidationErrorCode =
  | "REQUIRED"
  | "INVALID_NUMBER"
  | "MUST_BE_SAFE_INTEGER"
  | "MUST_BE_POSITIVE"
  | "MUST_BE_NON_NEGATIVE"
  | "MUST_BE_INTEGER"
  | "ANNUAL_SALARY_EXCEEDS_LIMIT"
  | "NON_TAXABLE_EXCEEDS_MONTHLY_SALARY"
  | "CHILD_COUNT_EXCEEDS_DEPENDENT_COUNT";

export interface SalaryTakeHomeValidationError {
  field: SalaryTakeHomeInputField;
  code: SalaryTakeHomeValidationErrorCode;
  message: string;
}

export type SalaryTakeHomeCalculationResponse =
  | {
      success: true;
      data: SalaryTakeHomeResult;
    }
  | {
      success: false;
      errors: SalaryTakeHomeValidationError[];
    };
