/**
 * 실업급여 예상 계산 정책
 *
 * 작업 기준일: 2026-06-25
 * 2026년 구직급여 상한액과 하한액 기준을 공식 출처로 확인했습니다.
 * 실제 수급 여부는 이직확인서, 피보험 단위기간, 퇴직 사유, 실업인정
 * 절차와 고용센터 판단에 따라 달라질 수 있습니다.
 */
export const UNEMPLOYMENT_POLICY_2026 = {
  policyVersion: "2026-06-25-official",
  basisDate: "2026-06-25",
  sourceNote:
    "2026년 1일 구직급여 상한액 68,100원과 시간별 하한액을 공식 기준으로 반영한 예상 계산입니다. 상한액은 급여기초 임금일액 상한 113,500원 × 60%, 하한액은 2026년 최저임금 10,320원 × 1시간 × 80%에 이직 전 1일 소정근로시간(4시간 이하~8시간 이상)을 적용한 값입니다. 실제 수급 여부와 소정근로시간 인정은 고용센터 심사와 이직확인서에 따라 달라질 수 있습니다.",
  needsOfficialVerification: false,
  benefitRateNumerator: 60,
  benefitRateDenominator: 100,
  monthlyWageDivisor: 30,
  dailyBenefitUpperLimit: 68_100,
  scheduledDailyHours: [4, 5, 6, 7, 8],
  dailyBenefitLowerLimitsByScheduledHours: {
    4: 33_024,
    5: 41_280,
    6: 49_536,
    7: 57_792,
    8: 66_048,
  },
  dailyBenefitLowerLimit: 66_048,
  minimumMonthlyWage: 100_000,
  maximumMonthlyWage: 100_000_000,
  minimumAverageDailyWage: 1_000,
  maximumAverageDailyWage: 10_000_000,
  minimumInsuredMonthsForEstimate: 6,
  maximumInsuredMonths: 600,
  prescribedBenefitDays: {
    underOneYear: 120,
    underThreeYears: {
      under50: 150,
      over50OrDisabled: 180,
    },
    underFiveYears: {
      under50: 180,
      over50OrDisabled: 210,
    },
    underTenYears: {
      under50: 210,
      over50OrDisabled: 240,
    },
    tenYearsOrMore: {
      under50: 240,
      over50OrDisabled: 270,
    },
  },
} as const;
