import { SEVERANCE_POLICY_2026 } from "@/lib/calculators/severance/policy";
import { calculateSeverance } from "@/lib/calculators/severance/severance";
import type { SeveranceInput } from "@/lib/calculators/severance/types";

export interface SeveranceContentItem {
  label: string;
  value: string;
}

export interface SeveranceFaq {
  question: string;
  answer: string;
}

export interface SeveranceSource {
  organization: string;
  title: string;
  criterion: string;
  href: string;
}

export interface SeveranceInterpretationCard {
  title: string;
  description: string;
}

const wonFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 0,
});

function formatWon(value: number): string {
  return `${wonFormatter.format(value)}원`;
}

function formatWonFlexible(value: number): string {
  const isInteger = Number.isInteger(value);
  return `${value.toLocaleString("ko-KR", {
    minimumFractionDigits: isInteger ? 0 : 2,
    maximumFractionDigits: isInteger ? 0 : 2,
  })}원`;
}

function formatKoreanDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

export const severanceOfficialExampleInput: SeveranceInput = {
  employmentStartDate: "2014-10-02",
  retirementDate: "2017-09-16",
  wagesForAveragePeriod: 7_080_000,
  annualBonusTotal: 4_000_000,
  annualLeaveAllowanceTotal: 300_000,
  ordinaryDailyWage: null,
  averageWeeklyContractHours: 40,
};

const severanceOfficialExampleResponse = calculateSeverance(
  severanceOfficialExampleInput,
);

if (!severanceOfficialExampleResponse.success) {
  throw new Error("퇴직금 공식 예제 입력이 현재 계산 정책을 통과하지 못했습니다.");
}

const officialExampleResult = severanceOfficialExampleResponse.data;

export const severanceOfficialExampleInputItems: SeveranceContentItem[] = [
  {
    label: "입사일",
    value: formatKoreanDate(severanceOfficialExampleInput.employmentStartDate),
  },
  {
    label: "퇴직일",
    value: formatKoreanDate(severanceOfficialExampleInput.retirementDate),
  },
  {
    label: "퇴직 전 3개월 임금총액",
    value: formatWon(severanceOfficialExampleInput.wagesForAveragePeriod),
  },
  {
    label: "최근 1년 상여금 총액",
    value: formatWon(severanceOfficialExampleInput.annualBonusTotal),
  },
  {
    label: "반영 대상 연차수당 총액",
    value: formatWon(severanceOfficialExampleInput.annualLeaveAllowanceTotal),
  },
  {
    label: "1일 통상임금",
    value: "입력하지 않음",
  },
  {
    label: "4주 평균 주당 소정근로시간",
    value: `${severanceOfficialExampleInput.averageWeeklyContractHours}시간`,
  },
];

export const severanceOfficialExampleResultItems: SeveranceContentItem[] = [
  {
    label: "총 재직일수",
    value: `${officialExampleResult.totalServiceDays.toLocaleString("ko-KR")}일`,
  },
  {
    label: "평균임금 산정기간",
    value: `${formatKoreanDate(officialExampleResult.averageWagePeriodStartDate)} ~ ${formatKoreanDate(officialExampleResult.averageWagePeriodEndDate)} (${officialExampleResult.averageWagePeriodDays.toLocaleString("ko-KR")}일)`,
  },
  {
    label: "상여금 반영액",
    value: formatWonFlexible(officialExampleResult.reflectedBonusAmount),
  },
  {
    label: "연차수당 반영액",
    value: formatWonFlexible(
      officialExampleResult.reflectedAnnualLeaveAllowanceAmount,
    ),
  },
  {
    label: "평균임금 산정 임금총액",
    value: formatWonFlexible(officialExampleResult.totalWagesForAverageWage),
  },
  {
    label: "1일 평균임금",
    value: formatWonFlexible(officialExampleResult.averageDailyWage),
  },
  {
    label: "적용 1일 임금",
    value: formatWonFlexible(officialExampleResult.appliedDailyWage),
  },
  {
    label: "예상 퇴직금",
    value: formatWon(officialExampleResult.estimatedSeverance),
  },
];

export const severanceCalculationCriteria = [
  {
    title: "계속근로기간 요건",
    description:
      "계속근로기간이 1년 이상이어야 법정 퇴직금 대상이 될 수 있습니다. 현재 계산기는 퇴직일이 입사일 1주년 이상인지 확인해 기본 대상 여부를 표시합니다.",
  },
  {
    title: "주당 소정근로시간 요건",
    description: `퇴직 전 4주 평균 1주 소정근로시간이 ${SEVERANCE_POLICY_2026.minimumAverageWeeklyContractHours}시간 이상이어야 합니다. ${SEVERANCE_POLICY_2026.minimumAverageWeeklyContractHours}시간 미만이면 비대상으로 계산합니다.`,
  },
  {
    title: "퇴직일 입력 기준",
    description:
      "퇴직일은 마지막 근무일이 아니라 다음 날입니다. 총 재직일수와 평균임금 산정 종료일은 이 입력값을 기준으로 계산합니다.",
  },
  {
    title: "평균임금 산정기간",
    description:
      "평균임금은 퇴직일 직전 3개월의 임금총액과 그 기간의 총일수를 기준으로 계산합니다. 취업 후 3개월이 되지 않았다면 입사일부터 계산합니다.",
  },
  {
    title: "통상임금 비교",
    description:
      "1일 통상임금을 입력한 경우 1일 평균임금과 비교해 더 큰 금액을 적용합니다. 입력하지 않으면 1일 평균임금만으로 계산합니다.",
  },
  {
    title: "상여금·연차수당 반영",
    description:
      "최근 1년 상여금 총액의 3/12와 평균임금에 반영할 전년도 연차수당 총액의 3/12를 평균임금 산정 임금총액에 더합니다.",
  },
  {
    title: "기준 확인일",
    description: `현재 정책 기준 확인일은 ${formatKoreanDate(SEVERANCE_POLICY_2026.verifiedAt)}입니다. 실제 지급액은 회사의 임금 항목 판단과 제출 자료에 따라 달라질 수 있습니다.`,
  },
] as const;

export const severanceFormulaItems = [
  {
    title: "퇴직금",
    description:
      "적용 1일 임금 × 30일 × 총 재직일수 ÷ 365일로 계산합니다.",
  },
  {
    title: "적용 1일 임금",
    description:
      "1일 평균임금과 1일 통상임금 중 더 큰 금액을 사용합니다.",
  },
  {
    title: "1일 평균임금",
    description:
      "평균임금 산정 임금총액 ÷ 평균임금 산정 총일수로 계산합니다.",
  },
  {
    title: "퇴직 전 3개월 임금총액",
    description:
      "평균임금 산정기간에 지급된 기본급과 기타 임금의 세전 총액을 입력합니다.",
  },
  {
    title: "상여금 반영액",
    description:
      "최근 1년 상여금 총액 × 3/12를 평균임금 산정에 반영합니다.",
  },
  {
    title: "연차수당 반영액",
    description:
      "평균임금에 반영할 전년도 연차수당 총액 × 3/12를 더합니다.",
  },
  {
    title: "반올림 기준",
    description:
      "1일 평균임금은 1전 단위로 올림하고, 최종 퇴직금은 원 단위 반올림으로 표시합니다.",
  },
] as const;

export const severanceInterpretationCards: SeveranceInterpretationCard[] = [
  {
    title: "예상 퇴직금",
    description:
      "입력값과 현재 정책을 기준으로 계산한 법정 퇴직금 예상액입니다.",
  },
  {
    title: "대상 여부",
    description:
      "계속근로기간 1년과 주당 15시간 요건을 기준으로 기본 대상 여부를 보여줍니다.",
  },
  {
    title: "평균임금과 통상임금 비교",
    description:
      "입력한 1일 통상임금이 더 크면 그 값을 적용해 결과가 달라질 수 있습니다.",
  },
  {
    title: "실제 지급액과의 차이",
    description:
      "회사별 임금 항목 판단, 제외기간, 세금과 퇴직연금 처리에 따라 실제 지급액은 달라질 수 있습니다.",
  },
];

export const severanceCautions = [
  "퇴직소득세 계산은 포함하지 않습니다.",
  "퇴직연금(DB·DC) 적립금과 운용 결과는 포함하지 않습니다.",
  "회사별 임금 항목의 통상임금 해당 여부는 자동 판단하지 않습니다.",
  "미사용 연차 정산 방식과 반영 범위는 회사별 처리 차이가 있을 수 있습니다.",
  "임금체불, 징계, 특수 근로계약과 같은 분쟁 판단은 지원하지 않습니다.",
  "법률 자문이 아니며 중요한 판단은 고용노동부 상담, 노무사 또는 법률 전문가 확인이 필요합니다.",
] as const;

export const severanceFaqs: SeveranceFaq[] = [
  {
    question: "1년 미만 근무하면 퇴직금을 받을 수 있나요?",
    answer:
      "법정 퇴직금은 계속근로기간이 1년 이상인 경우를 기본 전제로 합니다. 현재 계산기도 1년 미만이면 비대상으로 표시합니다.",
  },
  {
    question: "주 15시간 미만 근로자도 퇴직금 대상인가요?",
    answer:
      "4주 평균 1주 소정근로시간이 15시간 미만이면 법정 퇴직금 대상에서 제외될 수 있습니다. 현재 계산기는 입력한 4주 평균 시간을 기준으로 기본 대상 여부를 안내합니다.",
  },
  {
    question: "평균임금과 통상임금은 무엇이 다른가요?",
    answer:
      "평균임금은 퇴직 전 3개월 임금총액과 반영 상여금·연차수당을 포함한 1일 금액이고, 통상임금은 정기적·일률적으로 지급되는 임금을 바탕으로 본 1일 금액입니다. 계산기는 두 값 중 큰 금액을 적용합니다.",
  },
  {
    question: "상여금도 퇴직금 계산에 반영되나요?",
    answer:
      "네. 최근 1년 상여금 총액의 3/12를 평균임금 산정 임금총액에 반영합니다.",
  },
  {
    question: "연차수당도 퇴직금 계산에 반영되나요?",
    answer:
      "네. 평균임금에 반영할 전년도 연차수당 총액의 3/12를 평균임금 산정 임금총액에 반영합니다.",
  },
  {
    question: "퇴직일은 어떤 기준으로 입력하나요?",
    answer:
      "마지막 근무일이 아니라 그 다음 날을 입력합니다. 고용노동부 퇴직금 계산기 안내도 같은 기준을 사용합니다.",
  },
  {
    question: "계산 결과는 세전인가요, 세후인가요?",
    answer:
      "세전 기준의 예상 퇴직금입니다. 퇴직소득세와 퇴직연금 운용 결과는 이 계산기에 포함하지 않습니다.",
  },
  {
    question: "실제 지급액과 계산 결과가 달라지는 이유는 무엇인가요?",
    answer:
      "회사별 임금 항목 판단, 평균임금 제외기간, 퇴직연금 처리, 세금, 미사용 연차 정산 기준과 개별 분쟁 여부에 따라 실제 지급액이 달라질 수 있습니다.",
  },
] as const;

export const severanceSources: SeveranceSource[] = [
  {
    organization: "고용노동부",
    title: "퇴직금 계산기",
    criterion: "공식 계산 예제와 입력 기준",
    href: "https://www.moel.go.kr/retirementpayCal.do",
  },
  {
    organization: "고용노동부",
    title: "퇴직금 및 평균임금 산정공식 FAQ",
    criterion: "평균임금과 산정 방식 설명",
    href: "https://www.moel.go.kr/faq/faqView.do?seqRepeat=89",
  },
  {
    organization: "국가법령정보센터",
    title: "근로자퇴직급여보장법",
    criterion: "계속근로기간과 퇴직금 지급 기준",
    href: "https://www.law.go.kr/법령/근로자퇴직급여보장법",
  },
] as const;

export const severanceWebApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "퇴직금 계산기",
  description:
    "입사일, 퇴직일, 퇴직 전 3개월 임금과 상여금·연차수당을 입력해 평균임금·통상임금 기준 예상 퇴직금을 계산합니다.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  browserRequirements: "JavaScript가 지원되는 웹 브라우저",
};

export const severanceBreadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "홈",
      item: "https://gyesanbox.kr/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "계산기 목록",
      item: "https://gyesanbox.kr/calculators/",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "퇴직금 계산기",
      item: "https://gyesanbox.kr/calculators/severance/",
    },
  ],
};

export const severanceFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: severanceFaqs.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
};
