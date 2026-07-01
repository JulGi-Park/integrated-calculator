import type { ParentalLeavePolicyName } from "./parentalLeaveTypes";

export interface ParentalLeavePolicyBand {
  fromMonth: number;
  toMonth: number;
  rate: number;
  upperLimit: number;
  label: string;
  policyName: ParentalLeavePolicyName;
}

export const PARENTAL_LEAVE_POLICY_DATE = "2026-07-01";

export const PARENTAL_LEAVE_SOURCE_NAMES = [
  "고용24 육아휴직급여 안내",
  "국가법령정보센터 고용보험법 시행령 제95조",
] as const;

export const PARENTAL_LEAVE_SPECIAL_SOURCE_NAMES = [
  "고용24 육아휴직급여 안내",
  "국가법령정보센터 고용보험법 시행령 제95조의3",
] as const;

export const PARENTAL_LEAVE_POLICY_2026 = {
  basisDate: PARENTAL_LEAVE_POLICY_DATE,
  maxLeaveMonths: 12,
  lowerLimit: 700_000,
  bands: [
    {
      fromMonth: 1,
      toMonth: 3,
      rate: 1,
      upperLimit: 2_500_000,
      label: "1~3개월: 통상임금 100%, 상한 250만원",
      policyName: "general",
    },
    {
      fromMonth: 4,
      toMonth: 6,
      rate: 1,
      upperLimit: 2_000_000,
      label: "4~6개월: 통상임금 100%, 상한 200만원",
      policyName: "general",
    },
    {
      fromMonth: 7,
      toMonth: 12,
      rate: 0.8,
      upperLimit: 1_600_000,
      label: "7~12개월: 통상임금 80%, 상한 160만원",
      policyName: "general",
    },
  ] satisfies ParentalLeavePolicyBand[],
  sourceNote:
    "고용24 육아휴직급여 안내와 고용보험법 시행령 제95조의 일반 육아휴직급여 구간을 기준으로 한 참고용 예상 계산입니다.",
} as const;

export const PARENTS_TOGETHER_SIX_PLUS_SIX_POLICY_2026 = {
  policyName: "parentsTogetherSixPlusSix",
  basisDate: PARENTAL_LEAVE_POLICY_DATE,
  sourceNames: PARENTAL_LEAVE_SPECIAL_SOURCE_NAMES,
  childAgeMonthLimit: 18,
  maxSpecialMonths: 6,
  lowerLimit: 700_000,
  monthlyUpperLimits: [2_500_000, 2_500_000, 3_000_000, 3_500_000, 4_000_000, 4_500_000],
  label: "부모 함께 육아휴직제 6+6",
} as const;

export const SINGLE_PARENT_POLICY_2026 = {
  policyName: "singleParent",
  basisDate: PARENTAL_LEAVE_POLICY_DATE,
  sourceNames: PARENTAL_LEAVE_SPECIAL_SOURCE_NAMES,
  lowerLimit: 700_000,
  firstThreeMonthsUpperLimit: 3_000_000,
  label: "한부모 육아휴직 특례",
} as const;
