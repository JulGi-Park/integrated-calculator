/**
 * 대한민국 법정 퇴직금 기본 계산 정책
 *
 * 확인일: 2026-06-23
 * 상세 근거와 지원 범위: docs/SEVERANCE_POLICY_2026.md
 *
 * 최대 금액은 법정 한도가 아니라 안전한 정수 연산과 일반 사용성을 위한
 * 서비스 입력 제한입니다.
 */
export const SEVERANCE_POLICY_2026 = {
  verifiedAt: "2026-06-23",
  requiredContinuousServiceYears: 1,
  minimumAverageWeeklyContractHours: 15,
  maximumAverageWeeklyContractHours: 168,
  weeklyHoursDecimalPlaces: 2,
  averageWageLookbackMonths: 3,
  bonusReflectionNumerator: 3,
  bonusReflectionDenominator: 12,
  annualLeaveAllowanceReflectionNumerator: 3,
  annualLeaveAllowanceReflectionDenominator: 12,
  severanceDaysPerYear: 30,
  daysPerServiceYear: 365,
  averageDailyWageDecimalPlaces: 2,
  maximumAmount: 10_000_000_000,
  amountUnit: "won",
  averageDailyWageRounding: "ceil-to-jeon",
  estimatedSeveranceRounding: "half-up-to-won",
} as const;
