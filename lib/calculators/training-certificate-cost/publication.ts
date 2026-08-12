export const TRAINING_CERTIFICATE_COST_PUBLICATION = {
  environmentVariable:
    "NEXT_PUBLIC_ENABLE_TRAINING_CERTIFICATE_COST_CALCULATOR",
  name: "국비지원 자격증 취득비용 계산기",
  slug: "training-certificate-cost",
  path: "/calculators/training-certificate-cost/",
  url: "https://gyesanbox.kr/calculators/training-certificate-cost/",
  category: "급여",
  description:
    "내일배움카드 훈련비 본인부담금과 시험·교재·재료비 등을 합산해 자격증 취득 예상비용을 계산합니다.",
  releasedAt: "2026-08-12",
} as const;

export function isTrainingCertificateCostCalculatorEnabled(
  value: string | undefined =
    process.env.NEXT_PUBLIC_ENABLE_TRAINING_CERTIFICATE_COST_CALCULATOR,
): boolean {
  return value === "true";
}
