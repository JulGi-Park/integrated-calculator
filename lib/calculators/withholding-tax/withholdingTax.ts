export const WITHHOLDING_TAX_LIMITS = {
  maximumAmount: 1_000_000_000_000,
} as const;

export type WithholdingTaxResult = {
  grossAmount: number;
  incomeTax: number;
  localIncomeTax: number;
  totalWithholdingTax: number;
  netAmount: number;
};

export type WithholdingTaxValidationError = {
  code: "required" | "invalid" | "nonPositive" | "maximum";
  message: string;
};

/**
 * 국고금 관리법 제47조에 따라 10원 미만을 버린다.
 * 사업소득 소득세를 먼저 계산하고, 그 확정 소득세의 10%로 개인지방소득세를 계산한다.
 */
function truncateToTenWon(amount: number): number {
  return Math.floor(amount / 10) * 10;
}

export function calculateWithholdingTax(grossAmount: number): WithholdingTaxResult {
  const incomeTax = truncateToTenWon((grossAmount * 3) / 100);
  const localIncomeTax = truncateToTenWon(incomeTax / 10);
  const totalWithholdingTax = incomeTax + localIncomeTax;

  return {
    grossAmount,
    incomeTax,
    localIncomeTax,
    totalWithholdingTax,
    netAmount: grossAmount - totalWithholdingTax,
  };
}

export function validateWithholdingTaxAmount(value: unknown): WithholdingTaxValidationError | null {
  if (value === undefined || value === null || value === "") {
    return { code: "required", message: "금액을 입력해 주세요." };
  }

  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value)) {
    return { code: "invalid", message: "원 단위의 정수 금액만 입력할 수 있습니다." };
  }

  if (value <= 0) {
    return { code: "nonPositive", message: "0원보다 큰 금액을 입력해 주세요." };
  }

  if (value > WITHHOLDING_TAX_LIMITS.maximumAmount) {
    return {
      code: "maximum",
      message: `금액은 ${WITHHOLDING_TAX_LIMITS.maximumAmount.toLocaleString("ko-KR")}원 이하로 입력해 주세요.`,
    };
  }

  return null;
}

export type WithholdingTaxCalculationResponse =
  | { success: true; data: WithholdingTaxResult }
  | { success: false; error: WithholdingTaxValidationError };

export function calculateWithholdingTaxFromUnknown(value: unknown): WithholdingTaxCalculationResponse {
  const error = validateWithholdingTaxAmount(value);
  return error ? { success: false, error } : { success: true, data: calculateWithholdingTax(value as number) };
}

/**
 * 3.3% 역산 기준 금액부터 forward 재계산해 목표 실수령액 이상이 되는 금액을 찾는다.
 * 끝수 처리로 더 낮은 세전 금액이 같은 실수령액을 만들 수 있어도, 대표 역산값의
 * 일관성을 위해 이 기준점 아래는 선택하지 않는다.
 */
export function calculateRequiredGrossAmount(desiredNetAmount: number): WithholdingTaxResult {
  const validationError = validateWithholdingTaxAmount(desiredNetAmount);
  if (validationError) {
    throw new RangeError(validationError.message);
  }

  let candidate = Math.ceil(desiredNetAmount / 0.967);
  while (calculateWithholdingTax(candidate).netAmount < desiredNetAmount) {
    candidate += 1;
  }

  return calculateWithholdingTax(candidate);
}

export function calculateRequiredGrossAmountFromUnknown(value: unknown): WithholdingTaxCalculationResponse {
  const error = validateWithholdingTaxAmount(value);
  return error ? { success: false, error } : { success: true, data: calculateRequiredGrossAmount(value as number) };
}
