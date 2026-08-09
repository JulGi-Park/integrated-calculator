export type BrokerageTransactionType = "sale" | "jeonse" | "monthlyRent";

export interface BrokerageFeeInput {
  transactionType: BrokerageTransactionType;
  transactionAmount?: number;
  jeonseDeposit?: number;
  monthlyRentDeposit?: number;
  monthlyRent?: number;
  negotiatedRatePercent?: number;
}

export interface BrokerageFeeRateBand {
  minAmount: number;
  maxAmount: number | null;
  ratePercent: number;
  limitAmount: number | null;
  label: string;
}

export interface BrokerageFeeResult {
  transactionType: BrokerageTransactionType;
  appliedTransactionAmount: number;
  firstMonthlyRentConvertedAmount: number | null;
  monthlyRentRecalculated: boolean;
  finalMonthlyRentConvertedAmount: number | null;
  rateBand: BrokerageFeeRateBand;
  maxRatePercent: number;
  limitAmount: number | null;
  baseFee: number;
  vatAmount: number;
  vatIncludedFee: number;
  negotiatedRatePercent: number | null;
  negotiatedFee: number | null;
  negotiatedVatIncludedFee: number | null;
  negotiatedLimitApplied: boolean;
}

export type BrokerageFeeInputField =
  | "transactionType"
  | "transactionAmount"
  | "jeonseDeposit"
  | "monthlyRentDeposit"
  | "monthlyRent"
  | "negotiatedRatePercent";

export type BrokerageFeeValidationField = BrokerageFeeInputField | "result";

export type BrokerageFeeValidationErrorCode =
  | "INVALID_TRANSACTION_TYPE"
  | "INVALID_NUMBER"
  | "MUST_BE_POSITIVE"
  | "MUST_BE_NON_NEGATIVE"
  | "RENT_REQUIRES_VALUE"
  | "TOO_LARGE"
  | "RATE_EXCEEDS_MAX"
  | "NON_FINITE_RESULT";

export interface BrokerageFeeValidationError {
  field: BrokerageFeeValidationField;
  code: BrokerageFeeValidationErrorCode;
  message: string;
}

export type BrokerageFeeCalculationResponse =
  | {
      success: true;
      data: BrokerageFeeResult;
    }
  | {
      success: false;
      errors: BrokerageFeeValidationError[];
    };
