/**
 * 대출 상환 비교 서비스 계산 정책
 *
 * 확인일: 2026-06-22
 * 상세 출처와 계산상 가정: docs/LOAN_REPAYMENT_POLICY.md
 *
 * 아래 최대값은 계산량과 안전한 정수 연산을 위한 서비스 제한이며,
 * 금융회사 상품 한도나 법정 최고금리 판정 기준이 아닙니다.
 */
export const LOAN_REPAYMENT_POLICY = {
  verifiedAt: "2026-06-22",
  minimumPrincipal: 1,
  maximumPrincipal: 10_000_000_000,
  minimumAnnualInterestRate: 0,
  maximumAnnualInterestRate: 100,
  annualInterestRateDecimalPlaces: 4,
  minimumTermMonths: 1,
  maximumTermMonths: 600,
  rateScale: 10_000,
  monthlyRateDenominator: 12_000_000,
  amountRounding: "half-up",
} as const;
