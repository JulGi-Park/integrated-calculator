export const YOUTH_FUTURE_SAVINGS_POLICY = {
  verifiedAt: "2026-07-08",
  officialSourceName: "금융위원회",
  officialSourceTitle: "청년미래적금 출시 보도자료",
  officialSourceUrl: "https://www.fsc.go.kr/no010101/87158",
  flagName: "NEXT_PUBLIC_ENABLE_YOUTH_FUTURE_SAVINGS_CALCULATOR",
  maximumMonthlyDeposit: 500_000,
  defaultTermMonths: 36,
  maximumTermMonths: 36,
  maximumAnnualInterestRate: 30,
  standardContributionRate: 6,
  preferredContributionRate: 12,
  maximumCustomContributionRate: 100,
  maximumCustomMonthlyContribution: 1_000_000,
  interestIncomeTaxRate: 15.4,
  maximumResultAmount: 100_000_000,
} as const;

export function isYouthFutureSavingsEnabled(): boolean {
  return (
    process.env[
      YOUTH_FUTURE_SAVINGS_POLICY.flagName
    ] === "true"
  );
}
