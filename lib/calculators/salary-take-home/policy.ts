/**
 * 2026년 연봉·월급 실수령액 계산 정책
 *
 * 확인일: 2026-07-11
 * 상세 출처와 연도 변경 절차:
 * docs/SALARY_TAKE_HOME_POLICY_2026.md
 */
export const SALARY_TAKE_HOME_POLICY_2026 = {
  year: 2026,
  verifiedAt: "2026-07-11",
  maximumAnnualSalary: 10_000_000_000,
  nationalPension: {
    totalRateBasisPoints: 950,
    employeeRateBasisPoints: 475,
    standardMonthlyIncomeMinimum: 410_000,
    standardMonthlyIncomeMaximum: 6_590_000,
    standardMonthlyIncomeUnit: 1_000,
    contributionTruncationUnit: 10,
    ceilingEffectiveFrom: "2026-07-01",
    ceilingEffectiveTo: "2027-06-30",
  },
  healthInsurance: {
    totalRateBasisPoints: 719,
    employeeShareDenominator: 2,
    maximumTotalMonthlyPremium: 4_591_740,
  },
  longTermCareInsurance: {
    incomeRatePartsPerMillion: 9_448,
    healthInsuranceRatePartsPerMillion: 71_900,
  },
  employmentInsurance: {
    employeeRateBasisPoints: 90,
  },
  incomeTax: {
    tableEffectiveFrom: "2026-02-27",
    highIncomeThreshold: 10_000_000,
    truncationUnit: 10,
  },
  localIncomeTax: {
    percentageOfIncomeTax: 10,
    truncationUnit: 10,
  },
} as const;

export const SALARY_TAKE_HOME_INPUT_METADATA = {
  dependentCount: {
    includesSelf: true,
    description:
      "공제대상가족 수에는 근로자 본인을 포함하며, 배우자도 요건을 충족하면 1명으로 계산합니다.",
  },
  childCount: {
    description:
      "간이세액표상 자녀 수는 공제대상가족 중 8세 이상 20세 이하 자녀 수입니다.",
  },
} as const;
