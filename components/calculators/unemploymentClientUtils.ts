import type {
  UnemploymentAgeGroup,
  UnemploymentLeavingReason,
  UnemploymentResult,
  UnemploymentScheduledDailyHours,
  UnemploymentWageInputType,
} from "@/lib/calculators/unemployment/types";

export const UNEMPLOYMENT_RESULT_CANONICAL_URL =
  "https://gyesanbox.kr/calculators/unemployment/";

export type UnemploymentResultTextInput = {
  wageInputType: UnemploymentWageInputType;
  wageAmount: string;
  insuredMonths: string;
  ageGroup: UnemploymentAgeGroup;
  leavingReason: UnemploymentLeavingReason;
};

const wonFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 0,
});

const ageGroupLabels: Record<UnemploymentAgeGroup, string> = {
  under50: "50세 미만",
  over50OrDisabled: "50세 이상 및 장애인",
};

const leavingReasonLabels: Record<UnemploymentLeavingReason, string> = {
  involuntary: "비자발적 퇴사",
  contractExpired: "계약만료",
  recommendedResignation: "권고사직",
  voluntary: "자발적 퇴사",
  voluntaryExceptionReview: "자발적 퇴사 예외 검토 필요",
  unclear: "기타 또는 판단 어려움",
};

const scheduledDailyHoursLabels: Record<UnemploymentScheduledDailyHours, string> = {
  4: "4시간 이하",
  5: "5시간",
  6: "6시간",
  7: "7시간",
  8: "8시간 이상",
};

function formatWon(value: number): string | null {
  return Number.isFinite(value) ? `${wonFormatter.format(value)}원` : null;
}

export function buildUnemploymentResultText(
  input: UnemploymentResultTextInput,
  result: UnemploymentResult,
): string | null {
  const dailyBenefitAmount = formatWon(result.dailyBenefitAmount);
  const estimatedTotalBenefit = formatWon(result.estimatedTotalBenefit);
  const wageAmount = formatWon(result.wageAmount);
  const dailyBenefitLowerLimit = formatWon(result.dailyBenefitLowerLimit);

  if (
    !dailyBenefitAmount ||
    !estimatedTotalBenefit ||
    !wageAmount ||
    !dailyBenefitLowerLimit ||
    !Number.isFinite(result.prescribedBenefitDays) ||
    !Number.isFinite(result.insuredMonths) ||
    !result.basisDate
  ) {
    return null;
  }

  const wageLabel =
    input.wageInputType === "monthlyWage" ? "월급" : "1일 평균임금";
  const wageInputTypeLabel =
    input.wageInputType === "monthlyWage"
      ? "월급 기준 간편 입력"
      : "1일 평균임금 직접 입력";

  return [
    "실업급여 계산 결과",
    "",
    "[예상 결과]",
    `1일 예상 구직급여액: ${dailyBenefitAmount}`,
    `예상 소정급여일수: ${result.prescribedBenefitDays.toLocaleString("ko-KR")}일`,
    `예상 총 지급액: ${estimatedTotalBenefit}`,
    "",
    "[입력 조건]",
    `임금 입력 방식: ${wageInputTypeLabel}`,
    `${wageLabel}: ${wageAmount}`,
    `1일 소정근로시간: ${scheduledDailyHoursLabels[result.scheduledDailyHours]}`,
    `고용보험 가입기간: ${result.insuredMonths.toLocaleString("ko-KR")}개월`,
    `나이 구간: ${ageGroupLabels[input.ageGroup]}`,
    `퇴직 사유: ${leavingReasonLabels[input.leavingReason]}`,
    `2026년 적용 하한액: ${dailyBenefitLowerLimit}`,
    `하한액 적용: ${result.isLowerLimitApplied ? "적용" : "미적용"}`,
    `상한액 적용: ${result.isUpperLimitApplied ? "적용" : "미적용"}`,
    "",
    `계산 기준일: ${result.basisDate}`,
    "이 결과는 예상값이며 실제 지급 여부와 금액은 고용센터 심사 결과에 따라 달라질 수 있습니다.",
  ].join("\n");
}
