export type ParentalLeavePolicyName =
  | "general"
  | "parentsTogetherSixPlusSix"
  | "singleParent"
  | "none";

export type ParentalLeaveSpecialPolicyName =
  | "parentsTogetherSixPlusSix"
  | "singleParent";

export type ParentalLeaveSpecialReason =
  | "childAgeMonthsOver18"
  | "partnerLeaveNotUsed"
  | "missingChildAgeMonths"
  | "missingPartnerLeaveMonths"
  | "leaveMonthOutOfSpecialRange"
  | "notSameChild"
  | "unknownEligibility"
  | "notSingleParent"
  | "missingSingleParentStatus"
  | "multipleSpecialPoliciesSelected"
  | "insufficientInputs"
  | "unsupportedCase"
  | "centerReviewRequired";

export type ParentalLeaveSpecialMissingInput =
  | "childAgeMonths"
  | "partnerUsedParentalLeave"
  | "partnerLeaveMonths"
  | "sameChild"
  | "isSingleParent";

export type ParentalLeaveInputField = "monthlyOrdinaryWage" | "leaveMonths";

export type ParentalLeaveValidationCode =
  | "REQUIRED"
  | "INVALID_NUMBER"
  | "MUST_BE_INTEGER"
  | "MUST_BE_SAFE_INTEGER"
  | "MUST_BE_POSITIVE"
  | "AMOUNT_EXCEEDS_LIMIT"
  | "MONTHS_UNDER_MINIMUM"
  | "MONTHS_EXCEEDS_LIMIT";

export interface ParentalLeaveValidationError {
  field: ParentalLeaveInputField;
  code: ParentalLeaveValidationCode;
  message: string;
}

export interface ParentalLeaveInput {
  monthlyOrdinaryWage: unknown;
  leaveMonths: unknown;
}

export interface ParentalLeaveSpecialCalculationInput
  extends ParentalLeaveInput {
  specialPolicy?: ParentalLeaveSpecialPolicyName;
  selectedSpecialPolicies?: ParentalLeaveSpecialPolicyName[];
  childAgeMonths?: unknown;
  partnerUsedParentalLeave?: boolean | "unknown";
  partnerLeaveMonths?: unknown;
  sameChild?: boolean | "unknown";
  isSingleParent?: boolean | "unknown";
}

export interface ParentalLeaveMonthlyBenefit {
  month: number;
  rate: number;
  baseAmount: number;
  lowerLimit: number;
  upperLimit: number;
  estimatedAmount: number;
  capApplied: boolean;
  floorApplied: boolean;
  bandLabel: string;
  appliedPolicy?: ParentalLeavePolicyName;
}

export interface ParentalLeaveResult {
  monthlyOrdinaryWage: number;
  leaveMonths: number;
  totalEstimatedAmount: number;
  basisDate: string;
  monthlyBenefits: ParentalLeaveMonthlyBenefit[];
  interpretation: string;
  disclaimer: string;
}

export interface ParentalLeaveSpecialPolicyResult {
  requestedPolicy: ParentalLeaveSpecialPolicyName | "multiple" | "none";
  appliedPolicy: ParentalLeavePolicyName;
  isApplicable: boolean;
  fallbackPolicy: ParentalLeavePolicyName | null;
  reasons: ParentalLeaveSpecialReason[];
  missingInputs: ParentalLeaveSpecialMissingInput[];
  warnings: string[];
  sourceNames: string[];
  policyDate: string;
  monthlyResults: ParentalLeaveMonthlyBenefit[];
  totalEstimatedAmount: number;
  disclaimer: string;
}

export type ParentalLeaveCalculationResponse =
  | { success: true; data: ParentalLeaveResult }
  | { success: false; errors: ParentalLeaveValidationError[] };

export type ParentalLeaveSpecialCalculationResponse =
  | { success: true; data: ParentalLeaveSpecialPolicyResult }
  | { success: false; errors: ParentalLeaveValidationError[] };
