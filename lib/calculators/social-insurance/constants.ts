export const SOCIAL_INSURANCE_POLICY_2026 = {
  year: 2026,
  verifiedAt: "2026-07-10",
  maximumInputAmount: 1_000_000_000,
  nationalPension: {
    totalRate: 0.095,
    employeeRate: 0.0475,
    employerRate: 0.0475,
    standardMonthlyIncomeMinimum: 410_000,
    standardMonthlyIncomeMaximum: 6_590_000,
    effectiveFrom: "2026-07-01",
    effectiveTo: "2027-06-30",
    sourceName: "국민연금공단",
  },
  healthInsurance: {
    totalRate: 0.0719,
    employeeRate: 0.03595,
    employerRate: 0.03595,
    sourceName: "국민건강보험공단",
  },
  longTermCareInsurance: {
    incomeRate: 0.009448,
    healthInsuranceRate: 0.1314,
    sourceName: "국민건강보험공단",
  },
  employmentInsurance: {
    unemploymentBenefitEmployeeRate: 0.009,
    unemploymentBenefitEmployerRate: 0.009,
    sourceName: "고용노동부·고용보험",
  },
  industrialAccidentInsurance: {
    sourceName: "고용노동부",
    note: "산재보험은 근로자 급여 공제 항목이 아니며, 업종별 사업주 부담 보험료라 본 계산기에서는 자동 계산하지 않습니다.",
  },
} as const;
