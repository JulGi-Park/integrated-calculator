export const RENT_CONVERSION_POLICY = {
  checkedAt: "2026-08-21",
  bokBaseRate: 2.75,
  statutoryAdditiveRate: 2,
  fixedCeilingRate: 10,
  maximumInputRate: 100,
  maximumAmount: 1_000_000_000_000,
} as const;

export type RentConversionResult = {
  annualAmount: number;
  monthlyAmount: number;
  appliedRate: number;
  effectiveStatutoryCeiling: number;
  rateDifference: number;
  comparison: "below" | "equal" | "above";
};

export function getEffectiveStatutoryCeiling(): number {
  return Math.min(RENT_CONVERSION_POLICY.fixedCeilingRate, RENT_CONVERSION_POLICY.bokBaseRate + RENT_CONVERSION_POLICY.statutoryAdditiveRate);
}

export function calculateDepositToRent(depositReduction: number, annualRate: number): RentConversionResult {
  const annualAmount = Math.round(depositReduction * annualRate / 100);
  return makeResult(annualAmount, annualRate);
}

export function calculateRentToDeposit(monthlyRentIncrease: number, annualRate: number): RentConversionResult {
  const annualAmount = monthlyRentIncrease * 12;
  const deposit = Math.round(annualAmount / (annualRate / 100));
  return { ...makeResult(annualAmount, annualRate), monthlyAmount: deposit };
}

export function calculateActualConversionRate(depositReduction: number, monthlyRentIncrease: number): RentConversionResult {
  const annualAmount = monthlyRentIncrease * 12;
  const appliedRate = annualAmount / depositReduction * 100;
  return makeResult(annualAmount, appliedRate);
}

function makeResult(annualAmount: number, appliedRate: number): RentConversionResult {
  const ceiling = getEffectiveStatutoryCeiling();
  const rateDifference = Number((appliedRate - ceiling).toFixed(4));
  return {
    annualAmount,
    monthlyAmount: Math.round(annualAmount / 12),
    appliedRate,
    effectiveStatutoryCeiling: ceiling,
    rateDifference,
    comparison: rateDifference > 0 ? "above" : rateDifference < 0 ? "below" : "equal",
  };
}

export type ValidationError = { field: string; message: string };

export function validateAmount(value: unknown, label: string): ValidationError | null {
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value)) return { field: label, message: `${label}은 원 단위 정수로 입력해 주세요.` };
  if (value <= 0) return { field: label, message: `${label}은 0원보다 커야 합니다.` };
  if (value > RENT_CONVERSION_POLICY.maximumAmount) return { field: label, message: `${label}은 ${RENT_CONVERSION_POLICY.maximumAmount.toLocaleString("ko-KR")}원 이하로 입력해 주세요.` };
  return null;
}

export function validateRate(value: unknown): ValidationError | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return { field: "전환율", message: "전환율을 숫자로 입력해 주세요." };
  if (value <= 0 || value > RENT_CONVERSION_POLICY.maximumInputRate) return { field: "전환율", message: `전환율은 0% 초과 ${RENT_CONVERSION_POLICY.maximumInputRate}% 이하로 입력해 주세요.` };
  return null;
}
