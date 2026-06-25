export type UnemploymentWageInputType = "monthlyWage" | "averageDailyWage";

export type UnemploymentAgeGroup = "under50" | "over50OrDisabled";

export type UnemploymentLeavingReason =
  | "involuntary"
  | "contractExpired"
  | "recommendedResignation"
  | "voluntary"
  | "voluntaryExceptionReview"
  | "unclear";

export interface UnemploymentInput {
  wageInputType: UnemploymentWageInputType;
  wageAmount: number;
  insuredMonths: number;
  ageGroup: UnemploymentAgeGroup;
  leavingReason: UnemploymentLeavingReason;
}

export type UnemploymentInputField = keyof UnemploymentInput;

export type UnemploymentValidationErrorCode =
  | "REQUIRED"
  | "INVALID_NUMBER"
  | "MUST_BE_SAFE_INTEGER"
  | "MUST_BE_POSITIVE"
  | "MUST_BE_INTEGER"
  | "AMOUNT_BELOW_LIMIT"
  | "AMOUNT_EXCEEDS_LIMIT"
  | "INSURED_MONTHS_UNDER_MINIMUM"
  | "INSURED_MONTHS_EXCEEDS_LIMIT"
  | "INVALID_OPTION";

export interface UnemploymentValidationError {
  field: UnemploymentInputField;
  code: UnemploymentValidationErrorCode;
  message: string;
}

export type UnemploymentEligibilityStatus =
  | "possible"
  | "restricted"
  | "reviewRequired"
  | "officialReviewRequired";

export interface UnemploymentResult {
  policyVersion: string;
  basisDate: string;
  sourceNote: string;
  needsOfficialVerification: boolean;
  wageInputType: UnemploymentWageInputType;
  wageAmount: number;
  estimatedAverageDailyWage: number;
  baseDailyBenefit: number;
  dailyBenefitUpperLimit: number;
  dailyBenefitLowerLimit: number;
  dailyBenefitAmount: number;
  isUpperLimitApplied: boolean;
  isLowerLimitApplied: boolean;
  insuredMonths: number;
  prescribedBenefitDays: number;
  estimatedTotalBenefit: number;
  ageGroup: UnemploymentAgeGroup;
  leavingReason: UnemploymentLeavingReason;
  eligibilityStatus: UnemploymentEligibilityStatus;
  eligibilityMessage: string;
  procedureGuide: string[];
  disclaimer: string;
}

export type UnemploymentCalculationResponse =
  | {
      success: true;
      data: UnemploymentResult;
    }
  | {
      success: false;
      errors: UnemploymentValidationError[];
    };
