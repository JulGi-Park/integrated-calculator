export const VAT_RATE = 0.1;
export const MAX_VAT_AMOUNT = 1_000_000_000_000;

export type VatProfitAmountMode = "supply" | "total";

export type VatProfitInputField = "amountMode" | "salesAmount" | "purchaseVat";

export type VatProfitValidationCode =
  | "REQUIRED"
  | "INVALID_NUMBER"
  | "INVALID_MODE"
  | "MUST_BE_POSITIVE"
  | "MUST_BE_NON_NEGATIVE"
  | "AMOUNT_OUT_OF_RANGE";

export interface VatProfitInput {
  amountMode: VatProfitAmountMode;
  salesAmount: number;
  purchaseVat: number;
}

export interface VatProfitValidationError {
  field: VatProfitInputField;
  code: VatProfitValidationCode;
}

export interface VatProfitResult {
  amountMode: VatProfitAmountMode;
  supplyAmount: number;
  outputVat: number;
  totalAmount: number;
  purchaseVat: number;
  expectedPayableVat: number;
  effectiveVatRate: number;
  formulas: string[];
  warnings: string[];
}

export type VatProfitResponse =
  | { success: true; data: VatProfitResult }
  | { success: false; errors: VatProfitValidationError[] };

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function roundToWon(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}

export function validateVatProfitInput(
  input: Partial<VatProfitInput> | Record<string, unknown>,
): VatProfitValidationError[] {
  const errors: VatProfitValidationError[] = [];

  if (input.amountMode !== "supply" && input.amountMode !== "total") {
    errors.push({ field: "amountMode", code: "INVALID_MODE" });
  }

  if (typeof input.salesAmount === "undefined" || input.salesAmount === null) {
    errors.push({ field: "salesAmount", code: "REQUIRED" });
  } else if (!isFiniteNumber(input.salesAmount)) {
    errors.push({ field: "salesAmount", code: "INVALID_NUMBER" });
  } else if (input.salesAmount <= 0) {
    errors.push({ field: "salesAmount", code: "MUST_BE_POSITIVE" });
  } else if (input.salesAmount > MAX_VAT_AMOUNT) {
    errors.push({ field: "salesAmount", code: "AMOUNT_OUT_OF_RANGE" });
  }

  if (typeof input.purchaseVat === "undefined" || input.purchaseVat === null) {
    errors.push({ field: "purchaseVat", code: "REQUIRED" });
  } else if (!isFiniteNumber(input.purchaseVat)) {
    errors.push({ field: "purchaseVat", code: "INVALID_NUMBER" });
  } else if (input.purchaseVat < 0) {
    errors.push({ field: "purchaseVat", code: "MUST_BE_NON_NEGATIVE" });
  } else if (input.purchaseVat > MAX_VAT_AMOUNT) {
    errors.push({ field: "purchaseVat", code: "AMOUNT_OUT_OF_RANGE" });
  }

  return errors;
}

export function calculateVatProfit(input: VatProfitInput): VatProfitResponse {
  const errors = validateVatProfitInput(input);

  if (errors.length > 0) {
    return { success: false, errors };
  }

  let supplyAmount: number;
  let outputVat: number;
  let totalAmount: number;
  const formulas: string[] = [];
  const warnings = [
    "간이과세, 면세, 영세율, 의제매입세액, 불공제 매입세액, 예정·확정 신고 조정은 자동 반영하지 않습니다.",
  ];

  if (input.amountMode === "supply") {
    supplyAmount = roundToWon(input.salesAmount);
    outputVat = roundToWon(supplyAmount * VAT_RATE);
    totalAmount = supplyAmount + outputVat;
    formulas.push("매출세액 = 공급가액 × 10%");
    formulas.push("합계금액 = 공급가액 + 매출세액");
  } else {
    totalAmount = roundToWon(input.salesAmount);
    supplyAmount = roundToWon(totalAmount / (1 + VAT_RATE));
    outputVat = totalAmount - supplyAmount;
    formulas.push("공급가액 = 합계금액 ÷ 1.1");
    formulas.push("매출세액 = 합계금액 - 공급가액");
  }

  const purchaseVat = roundToWon(input.purchaseVat);
  const expectedPayableVat = outputVat - purchaseVat;

  formulas.push("예상 납부세액 = 매출세액 - 입력한 매입세액");

  return {
    success: true,
    data: {
      amountMode: input.amountMode,
      supplyAmount,
      outputVat,
      totalAmount,
      purchaseVat,
      expectedPayableVat,
      effectiveVatRate: VAT_RATE,
      formulas,
      warnings,
    },
  };
}
