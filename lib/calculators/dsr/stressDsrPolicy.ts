import type {
  DsrInterestRateType,
  DsrStressPolicyInput,
  DsrStressPolicyResult,
  DsrStressPolicyStage,
} from "./types";

export const DSR_STRESS_POLICY = {
  verifiedAt: "2026-08-09",
  effectiveFrom: "2026-07-01",
  effectiveTo: "2026-12-31",
  capitalOrRegulatedMortgageBaseRate: 3,
  generalBaseRate: 1.5,
  stage3Multiplier: 1,
  stage2Multiplier: 0.5,
  creditBalanceThreshold: 100_000_000,
  source:
    "https://www.kfb.or.kr/news/info_news_view.php?idx=1989",
  sources: [
    {
      organization: "은행연합회",
      title: "26년 하반기 스트레스 DSR 운영방안",
      href: "https://www.kfb.or.kr/news/info_news_view.php?idx=1989",
      description:
        "2026년 7월 1일~12월 31일 기본 스트레스 금리, 단계·대출유형별 적용비율과 지방 주담대 2단계 유지",
    },
    {
      organization: "금융위원회",
      title: "2026년 상반기 스트레스 DSR 운영방향",
      href: "https://www.fsc.go.kr/no010101/85824",
      description:
        "대출유형별 적용비율, 신용대출 1억원 초과 기준과 기타대출 준용 방식",
    },
    {
      organization: "금융위원회",
      title: "수도권·규제지역 주담대 스트레스 금리 강화",
      href: "https://www.fsc.go.kr/po020201/85518",
      description:
        "수도권·규제지역 주택담보대출과 오피스텔담보대출의 3.0% 스트레스 금리 적용 범위",
    },
    {
      organization: "금융위원회",
      title: "스트레스 DSR 제도 도입방안",
      href: "https://www.fsc.go.kr/po010102/81343",
      description:
        "변동·혼합·주기·고정형 구분과 신용대출 고정금리 만기별 적용비율",
    },
  ],
} as const;

function isMortgageRateMethod(input: DsrStressPolicyInput): boolean {
  return input.loanType === "mortgage" || input.loanType === "officetelMortgage";
}

function isWithinPolicyPeriod(referenceDate: string): boolean {
  return (
    referenceDate >= DSR_STRESS_POLICY.effectiveFrom &&
    referenceDate <= DSR_STRESS_POLICY.effectiveTo
  );
}

function resolveMortgageProductMultiplier(
  stage: Exclude<DsrStressPolicyStage, null>,
  interestRateType: DsrInterestRateType,
  termMonths: number,
  periodMonths: number,
): number {
  if (interestRateType === "variable") return 1;
  if (interestRateType === "fixed") return 0;
  if (periodMonths < 60) return 1;

  const isMixed = interestRateType === "mixed";
  const stage3 = isMixed ? [0.8, 0.6, 0.4] : [0.4, 0.3, 0.2];
  const stage2 = isMixed ? [0.6, 0.4, 0.2] : [0.3, 0.2, 0.1];
  const multipliers = stage === 3 ? stage3 : stage2;

  if (periodMonths * 100 < termMonths * 30) return multipliers[0];
  if (periodMonths * 100 < termMonths * 50) return multipliers[1];
  if (periodMonths * 100 < termMonths * 70) return multipliers[2];
  return 0;
}

function resolveCreditMethodMultiplier(input: DsrStressPolicyInput): number {
  if (input.interestRateType !== "fixed") return 1;
  if (input.termMonths >= 60) return 0;
  if (input.termMonths >= 36) return 0.6;
  return 1;
}

function buildResult(
  input: DsrStressPolicyInput,
  values: Pick<
    DsrStressPolicyResult,
    | "supported"
    | "applicable"
    | "policyStage"
    | "baseStressRate"
    | "stageMultiplier"
    | "productMultiplier"
    | "finalStressRate"
    | "reason"
  >,
): DsrStressPolicyResult {
  return {
    ...values,
    referenceDate: input.referenceDate,
    effectiveFrom: DSR_STRESS_POLICY.effectiveFrom,
    effectiveTo: DSR_STRESS_POLICY.effectiveTo,
    source: DSR_STRESS_POLICY.source,
  };
}

export function resolveStressDsrPolicy(
  input: DsrStressPolicyInput,
): DsrStressPolicyResult {
  if (!isWithinPolicyPeriod(input.referenceDate)) {
    return buildResult(input, {
      supported: false,
      applicable: false,
      policyStage: null,
      baseStressRate: 0,
      stageMultiplier: 0,
      productMultiplier: 0,
      finalStressRate: 0,
      reason:
        "지원 정책 기간(2026년 7월 1일~12월 31일) 밖이므로 최신 정책을 추정하지 않습니다.",
    });
  }

  const mortgageMethod = isMortgageRateMethod(input);
  const capitalOrRegulated =
    input.regionType === "capital" || input.isRegulatedArea;
  const policyStage: Exclude<DsrStressPolicyStage, null> =
    mortgageMethod && !capitalOrRegulated ? 2 : 3;
  const baseStressRate =
    mortgageMethod && capitalOrRegulated
      ? DSR_STRESS_POLICY.capitalOrRegulatedMortgageBaseRate
      : DSR_STRESS_POLICY.generalBaseRate;
  const stageMultiplier =
    policyStage === 3
      ? DSR_STRESS_POLICY.stage3Multiplier
      : DSR_STRESS_POLICY.stage2Multiplier;
  const productMultiplier = mortgageMethod
    ? resolveMortgageProductMultiplier(
        policyStage,
        input.interestRateType,
        input.termMonths,
        input.interestRateType === "mixed"
          ? input.fixedRatePeriodMonths
          : input.rateResetPeriodMonths,
      )
    : resolveCreditMethodMultiplier(input);

  if (
    input.loanType === "credit" &&
    input.creditLoanTotalBalance <= DSR_STRESS_POLICY.creditBalanceThreshold
  ) {
    return buildResult(input, {
      supported: true,
      applicable: false,
      policyStage,
      baseStressRate,
      stageMultiplier,
      productMultiplier,
      finalStressRate: 0,
      reason: "전체 신용대출 잔액이 1억원 이하이므로 스트레스 DSR 적용 대상이 아닙니다.",
    });
  }

  const finalStressRate =
    Math.round(baseStressRate * stageMultiplier * productMultiplier * 10_000) /
    10_000;

  if (productMultiplier === 0) {
    return buildResult(input, {
      supported: true,
      applicable: false,
      policyStage,
      baseStressRate,
      stageMultiplier,
      productMultiplier,
      finalStressRate: 0,
      reason: "입력한 고정금리 기간·금리변동주기 조건은 스트레스 금리 미적용 구간입니다.",
    });
  }

  const scopeReason = mortgageMethod
    ? capitalOrRegulated
      ? "수도권 또는 규제지역 담보대출에 3단계 정책을 적용했습니다."
      : "지방 비규제지역 담보대출에 2026년 하반기 2단계 정책을 적용했습니다."
    : input.loanType === "credit"
      ? "전체 신용대출 잔액이 1억원을 초과해 3단계 정책을 적용했습니다."
      : "기타대출의 신용대출 준용 방식에 따라 3단계 정책을 적용했습니다.";

  return buildResult(input, {
    supported: true,
    applicable: true,
    policyStage,
    baseStressRate,
    stageMultiplier,
    productMultiplier,
    finalStressRate,
    reason: scopeReason,
  });
}
