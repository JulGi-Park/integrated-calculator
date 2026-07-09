import type { HouseholdType } from "./types";

export const WORK_CHILD_INCENTIVE_POLICY = {
  year: 2026,
  incomeYear: 2025,
  verifiedAt: "2026-07-08",
  flagName: "NEXT_PUBLIC_ENABLE_WORK_CHILD_INCENTIVE_CALCULATOR",
  workIncomeLimits: {
    single: 22_000_000,
    singleIncome: 32_000_000,
    dualIncome: 44_000_000,
  } satisfies Record<HouseholdType, number>,
  workMaximumAmounts: {
    single: 1_650_000,
    singleIncome: 2_850_000,
    dualIncome: 3_300_000,
  } satisfies Record<HouseholdType, number>,
  childIncomeLimit: 70_000_000,
  childMaximumPerChild: 1_000_000,
  childMinimumPerChild: 500_000,
  propertyReductionThreshold: 170_000_000,
  propertyLimit: 240_000_000,
  propertyReductionRate: 0.5,
  lateFilingRate: 0.95,
  maximumInputAmount: 10_000_000_000,
  maximumChildCount: 20,
} as const;

export function isWorkChildIncentiveCalculatorEnabled(): boolean {
  return (
    process.env[WORK_CHILD_INCENTIVE_POLICY.flagName] === "true"
  );
}
