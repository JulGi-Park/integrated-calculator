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
      organization: "국가법령정보센터",
      title: "은행업감독업무시행세칙 별표 18",
      href: "https://www.law.go.kr/admRulLsInfoP.do?admRulSeq=2200000108789",
      description:
        "대출 종류·상환형태별 DSR 원금 산정방법, 이자 산정방법, 산정만기와 적용 제외 기준",
    },
    {
      organization: "금융위원회",
      title: "차주단위 DSR 규제 안내",
      href: "https://www.fsc.go.kr/po020201/76750",
      description:
        "DSR 산식과 은행권 40%, 비은행권 50% 기준 및 적용 제외 대출 안내",
    },
  ],
} as const;
