export type TrainingCertificateCostInputField =
  | "totalTrainingCost"
  | "trainingSelfPayAmount"
  | "examFee"
  | "expectedExamAttempts"
  | "textbookCost"
  | "practiceMaterialCost"
  | "transportationCost"
  | "mealCost"
  | "otherCost";

export type TrainingCertificateCostValidationField =
  | TrainingCertificateCostInputField
  | "calculation";

export type TrainingCertificateCostInput = Readonly<{
  totalTrainingCost: number;
  trainingSelfPayAmount: number;
  examFee: number;
  expectedExamAttempts: number;
  textbookCost: number;
  practiceMaterialCost: number;
  transportationCost: number;
  mealCost: number;
  otherCost: number;
}>;

export type TrainingCertificateCostValidationErrorCode =
  | "REQUIRED"
  | "INVALID_NUMBER"
  | "MUST_BE_INTEGER"
  | "MUST_BE_SAFE_INTEGER"
  | "MUST_BE_NON_NEGATIVE"
  | "MUST_BE_POSITIVE"
  | "AMOUNT_EXCEEDS_LIMIT"
  | "SELF_PAY_EXCEEDS_TOTAL"
  | "CALCULATION_EXCEEDS_SAFE_RANGE"
  | "INVALID_RESULT";

export type TrainingCertificateCostValidationError = Readonly<{
  field: TrainingCertificateCostValidationField;
  code: TrainingCertificateCostValidationErrorCode;
  message: string;
}>;

export type TrainingCertificateCostResult = Readonly<{
  totalExamCost: number;
  ancillaryCost: number;
  estimatedGovernmentSupportAmount: number;
  estimatedTotalCostWithoutSupport: number;
  estimatedTotalOutOfPocket: number;
  estimatedSavingsAmount: number;
}>;

export type TrainingCertificateCostCalculationResponse =
  | Readonly<{
      success: true;
      data: TrainingCertificateCostResult;
    }>
  | Readonly<{
      success: false;
      errors: TrainingCertificateCostValidationError[];
    }>;
