export type IncentiveApplicationType = "work" | "child" | "both";
export type HouseholdType = "single" | "singleIncome" | "dualIncome";
export type FilingType = "regular" | "late" | "halfYear";
export type YesNo = "yes" | "no";

export interface WorkChildIncentiveInput {
  applicationType: IncentiveApplicationType;
  householdType: HouseholdType;
  totalIncome: number;
  totalSalary: number;
  propertyAmount: number;
  childCount: number;
  childAgeEligible: boolean;
  spouseSalary: number;
  filingType: FilingType;
  hasTaxArrears: YesNo;
  hasChildTaxCredit: YesNo;
}

export type WorkChildIncentiveInputField = keyof WorkChildIncentiveInput;

export interface WorkChildIncentiveValidationError {
  field: WorkChildIncentiveInputField;
  message: string;
}

export interface IncentiveEligibility {
  requested: boolean;
  eligible: boolean;
  status: "eligible" | "excluded" | "notRequested";
  reason: string;
  incomeLimit: number | null;
  estimatedBeforeReduction: number;
  estimatedAfterReduction: number;
  estimatedRange: {
    min: number;
    max: number;
  };
  notes: string[];
}

export interface WorkChildIncentiveResult {
  input: WorkChildIncentiveInput;
  work: IncentiveEligibility;
  child: IncentiveEligibility;
  propertyStatus: "pass" | "reduced" | "excluded";
  propertyMessage: string;
  reductionRate: number;
  reductionReasons: string[];
  totalEstimatedAmount: number;
  interpretation: string;
  policyVerifiedAt: string;
}

export type WorkChildIncentiveResponse =
  | { success: true; data: WorkChildIncentiveResult }
  | { success: false; errors: WorkChildIncentiveValidationError[] };
