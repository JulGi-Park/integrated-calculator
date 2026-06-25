/**
 * 실업급여 예상 계산 정책
 *
 * 작업 기준일: 2026-06-25
 * 아래 상한액과 하한액은 1차 구현 기준값입니다. 실제 지급 여부와 세부
 * 금액은 고용보험 공식 고시, 이직확인서, 피보험 단위기간, 고용센터
 * 판단에 따라 달라질 수 있습니다.
 */
export const UNEMPLOYMENT_POLICY_2026 = {
  policyVersion: "2026-06-25-draft",
  basisDate: "2026-06-25",
  sourceNote:
    "2026년 1일 구직급여 상한액 68,100원, 하한액 66,048원을 현재 계산기 적용 기준으로 사용하는 예상 계산입니다. 고용보험 공식 모의계산 안내의 2019년 이후 상한액 66,000원 안내 및 2026년 최저임금 기반 하한 산식과 수치 차이가 있을 수 있어 공식 원문 재검증이 필요합니다.",
  needsOfficialVerification: true,
  benefitRateNumerator: 60,
  benefitRateDenominator: 100,
  monthlyWageDivisor: 30,
  dailyBenefitUpperLimit: 68_100,
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
