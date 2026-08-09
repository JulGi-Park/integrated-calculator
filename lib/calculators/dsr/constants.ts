export const DSR_POLICY = {
  verifiedAt: "2026-08-09",
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
      title: "차주단위 DSR 규제 안내",
      href: "https://www.fsc.go.kr/po020201/76750",
      description:
        "DSR 산식과 은행권 40%, 비은행권 50% 기준 및 적용 제외 대출 안내",
    },
    {
      organization: "금융위원회",
      title: "2026년 상반기 스트레스 DSR 운용방향",
      href: "https://www.fsc.go.kr/no010101/85824",
      description:
        "수도권·규제지역 주담대와 지방 비규제지역 주담대 등에 적용되는 스트레스 금리 운용 안내",
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
