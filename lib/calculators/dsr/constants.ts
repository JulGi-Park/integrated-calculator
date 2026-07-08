export const DSR_POLICY = {
  verifiedAt: "2026-07-08",
  flagName: "NEXT_PUBLIC_ENABLE_DSR_CALCULATOR",
  maximumAmount: 10_000_000_000,
  maximumAnnualInterestRate: 100,
  maximumStressInterestRate: 20,
  maximumTermMonths: 600,
  maximumDsrLimitRate: 200,
  defaultDsrLimitRate: 40,
  defaultStressInterestRate: 1.5,
  sources: [
    {
      organization: "금융위원회",
      title: "주택담보대출 관련 Q&A",
      href: "https://www.fsc.go.kr/po020201/27351",
      description:
        "DSR은 차주의 연간 소득 대비 연간 금융부채 원리금 상환액 비율이라는 공식 설명",
    },
    {
      organization: "금융위원회",
      title: "3단계 스트레스 DSR 시행방안 확정 발표",
      href: "https://www.fsc.go.kr/no010101/84617",
      description:
        "3단계 스트레스 DSR 적용 대상과 스트레스 금리 1.50% 안내",
    },
    {
      organization: "금융위원회",
      title: "스트레스 DSR 제도 카드뉴스",
      href: "https://fsc.go.kr/no040101?cnId=2035",
      description:
        "스트레스 DSR은 금리변동위험을 DSR에 반영하기 위한 제도라는 안내",
    },
  ],
} as const;

export function isDsrCalculatorEnabled(): boolean {
  return process.env[DSR_POLICY.flagName] === "true";
}
