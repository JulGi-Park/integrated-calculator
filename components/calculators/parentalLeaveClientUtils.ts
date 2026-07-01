import type { ParentalLeaveResult } from "@/lib/calculators/parental-leave/parentalLeave";

const wonFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 0,
});

export function formatWon(value: number): string {
  return `${wonFormatter.format(value)}원`;
}

export function formatRate(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function buildParentalLeaveResultText(result: ParentalLeaveResult): string {
  const monthlyLines = result.monthlyBenefits
    .map(
      (item) =>
        `${item.month}개월차: ${formatWon(item.estimatedAmount)} (${formatRate(
          item.rate,
        )}, ${item.capApplied ? "상한 적용" : "상한 미적용"}, ${
          item.floorApplied ? "하한 적용" : "하한 미적용"
        })`,
    )
    .join("\n");

  return [
    "육아휴직급여 계산기 예상 결과",
    `계산 기준일: ${result.basisDate}`,
    `월 통상임금: ${formatWon(result.monthlyOrdinaryWage)}`,
    `사용 개월 수: ${result.leaveMonths}개월`,
    `총 예상 수령액: ${formatWon(result.totalEstimatedAmount)}`,
    monthlyLines,
    "확정 지급액이 아닌 예상 계산입니다. 실제 지급 여부와 금액은 고용보험 가입 기간, 신청 요건, 고용센터 심사에 따라 달라질 수 있습니다.",
  ].join("\n");
}

export async function copyParentalLeaveResult(
  result: ParentalLeaveResult,
): Promise<boolean> {
  if (!navigator.clipboard?.writeText) {
    return false;
  }

  await navigator.clipboard.writeText(buildParentalLeaveResultText(result));
  return true;
}

export async function shareParentalLeaveResult(
  result: ParentalLeaveResult,
): Promise<"shared" | "copied" | "failed"> {
  const text = buildParentalLeaveResultText(result);

  if (navigator.share) {
    await navigator.share({
      title: "육아휴직급여 계산기 예상 결과",
      text,
    });
    return "shared";
  }

  return (await copyParentalLeaveResult(result)) ? "copied" : "failed";
}
