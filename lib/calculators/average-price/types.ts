export interface AveragePriceInput {
  currentQuantity: number;
  currentAveragePrice: number;
  additionalQuantity: number;
  additionalPrice: number;
  targetPrice?: number;
}

export interface AveragePriceResult {
  existingInvestmentAmount: number;
  additionalInvestmentAmount: number;
  totalQuantity: number;
  totalInvestmentAmount: number;
  newAveragePrice: number;
  expectedValuationAmount: number | null;
  expectedProfitLoss: number | null;
  expectedProfitRate: number | null;
}

export type AveragePriceInputField = keyof AveragePriceInput;

export type AveragePriceValidationField =
  | AveragePriceInputField
  | "totalQuantity"
  | "result";

export type AveragePriceValidationErrorCode =
  | "INVALID_NUMBER"
  | "MUST_BE_POSITIVE"
  | "TOO_LARGE"
  | "NON_FINITE_RESULT";

export interface AveragePriceValidationError {
  field: AveragePriceValidationField;
  code: AveragePriceValidationErrorCode;
  message: string;
}

export type AveragePriceCalculationResponse =
  | {
      success: true;
      data: AveragePriceResult;
    }
  | {
      success: false;
      errors: AveragePriceValidationError[];
    };
