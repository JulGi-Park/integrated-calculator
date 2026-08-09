import { calculateDsr } from "@/lib/calculators/dsr";
import { DSR_POLICY } from "@/lib/calculators/dsr/constants";
import { DSR_STRESS_POLICY } from "@/lib/calculators/dsr/stressDsrPolicy";
import type { DsrInput } from "@/lib/calculators/dsr/types";
import { formatPercentPoint, formatRate, formatWon } from "./dsrClientUtils";

export interface DsrFaq {
  question: string;
  answer: string;
}

function formatKoreanDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

export const dsrExampleInput: DsrInput = {
  annualIncome: 60_000_000,
  existingAnnualDebtPayment: 8_000_000,
  newLoanPrincipal: 200_000_000,
  annualInterestRate: 4.5,
  termMonths: 360,
  loanType: "mortgage",
  repaymentType: "levelPayment",
  gracePeriodMonths: 0,
  balloonPrincipal: 0,
  creditInstallmentRatio: 100,
  creditRepaymentFrequency: "monthly",
  regionType: "capital",
  isRegulatedArea: false,
  interestRateType: "variable",
  fixedRatePeriodMonths: 60,
  rateResetPeriodMonths: 60,
  creditLoanTotalBalance: 100_000_000,
  stressInterestRate: 1.5,
  dsrLimitRate: 40,
};

const exampleResponse = calculateDsr(dsrExampleInput);

if (!exampleResponse.success) {
  throw new Error("DSR 예시 입력이 계산 정책을 통과하지 못했습니다.");
}

export const dsrExampleResult = exampleResponse.data;

export const dsrPolicySummary = {
  verifiedAt: formatKoreanDate(DSR_POLICY.verifiedAt),
  defaultLimitRate: formatRate(DSR_POLICY.defaultDsrLimitRate),
  defaultStressRate: formatPercentPoint(DSR_POLICY.defaultStressInterestRate),
  stressPolicyEffectiveFrom: formatKoreanDate(DSR_STRESS_POLICY.effectiveFrom),
  stressPolicyEffectiveTo: formatKoreanDate(DSR_STRESS_POLICY.effectiveTo),
};

export const dsrCriteria = [
  {
    title: "일반 DSR 계산식",
    description:
      "기존 대출 연간 DSR 원리금과 신규 대출의 공식 산정 연간 원금·이자를 더한 뒤 연소득으로 나눕니다.",
  },
  {
    title: "계약상 납입액과 DSR 산정액",
    description:
      "계약상 향후 1년 납입액은 실제 상환 일정 기준이며, DSR 산정액은 대출 종류별 공식 산정만기를 적용하므로 서로 다를 수 있습니다.",
  },
  {
    title: "주택담보대출",
    description:
      "전액 분할상환은 향후 1년 실제 원금, 일부 분할상환은 실제 분할원금과 만기상환분의 연 환산액, 일시상환은 실제 만기(최대 10년)로 나눈 원금을 사용합니다.",
  },
  {
    title: "신용대출",
    description:
      "무거치·월/분기 균등분할·총액 40% 이상·5~10년 요건을 모두 충족하면 실제 약정만기, 아니면 5년으로 원금을 나눕니다.",
  },
  {
    title: "비주택·보증금담보",
    description:
      "오피스텔 외 비주택담보는 8년, 전세보증금담보는 4년을 산정만기로 사용합니다. 전세자금대출과 혼동하지 마세요.",
  },
  {
    title: "공식 스트레스 DSR",
    description:
      "2026년 8월 9일 확인 정책에 따라 대출 종류·지역·규제지역·금리유형·신용대출 잔액을 판정하고 최종 스트레스 금리를 공식 부채산정 엔진에 적용합니다.",
  },
  {
    title: "2026년 하반기 지역 기준",
    description:
      "수도권 또는 규제지역 주담대·오피스텔담보대출은 기본 3.0%p·3단계 100%, 지방 비규제지역은 기본 1.5%p·2단계 50%를 적용합니다.",
  },
  {
    title: "금리유형 적용비율",
    description:
      "변동형은 100%이며 혼합형·주기형은 고정기간 또는 변동주기와 전체 만기의 비율에 따라 적용비율이 달라집니다. 미적용 구간은 0%p와 이유를 표시합니다.",
  },
  {
    title: "사용자 금리상승 시나리오",
    description:
      "사용자가 직접 입력한 가산금리로 계산하는 별도 비교값입니다. 공식 정책 자동판정 결과와 같은 의미가 아닙니다.",
  },
] as const;

export const dsrCautions = [
  "이 계산기는 예상 계산용이며 실제 금융기관 심사 결과와 다를 수 있습니다.",
  "DSR 적용 대상, 예외, 소득 인정 방식, 대출별 원리금 산정 방식은 금융기관·업권·상품·차주 상황에 따라 달라질 수 있습니다.",
  "공식 스트레스 금리는 DSR 심사 산정용 가산금리이며 실제 약정금리에 추가로 부과되는 이자가 아닙니다.",
  "2026년 하반기 정책 유효기간은 2026년 7월 1일부터 12월 31일까지이며, 이후 정책을 자동 추정하지 않습니다.",
  "사용자 금리상승 시나리오는 공식 스트레스 DSR과 구분되는 참고용 비교값입니다.",
  "기본 40%는 은행권 차주단위 DSR의 대표 기준입니다. 비은행권 기준과 규제 예외는 다를 수 있습니다.",
  "전세자금대출, 예·적금담보대출, 보험계약대출 등 DSR 적용 제외 대출은 신규대출 선택 항목에서 지원하지 않습니다.",
  "이 결과만으로 대출 실행이나 금융기관 심사 통과를 단정할 수 없습니다.",
] as const;

export const dsrFaqs: DsrFaq[] = [
  {
    question: "DSR은 어떻게 계산하나요?",
    answer:
      "DSR은 연간 금융부채 원리금 상환액을 연소득으로 나눈 비율입니다. 이 계산기는 기존 대출 연간 DSR 원리금과 신규 대출의 공식 산정 연간 원금·이자를 합산해 일반 DSR을 계산합니다.",
  },
  {
    question: "스트레스 DSR이란 무엇인가요?",
    answer:
      "향후 금리상승으로 원리금 부담이 늘어날 가능성을 DSR 심사에 반영하는 제도입니다. 계산기는 2026년 8월 9일 확인 정책으로 적용 대상과 최종 스트레스 금리를 자동 판정합니다.",
  },
  {
    question: "스트레스 금리가 실제 이자에 더해지나요?",
    answer:
      "아니요. 스트레스 금리는 실제 대출 약정금리에 추가로 부과되는 이자가 아니라 미래 금리상승 위험을 DSR 산정에 반영하기 위한 심사용 가산금리입니다.",
  },
  {
    question: "수도권과 지방의 스트레스 금리가 왜 다른가요?",
    answer:
      "2026년 하반기 수도권 또는 규제지역 주담대·오피스텔담보대출은 기본 3.0%p와 3단계를 적용합니다. 지방 비규제지역 담보대출은 2026년 12월 31일까지 기본 1.5%p와 2단계 50%를 유지합니다.",
  },
  {
    question: "변동·혼합·주기형은 왜 적용비율이 다른가요?",
    answer:
      "금리가 바뀔 위험의 크기가 다르기 때문입니다. 변동형은 100%를 적용하고 혼합형과 주기형은 고정기간 또는 변동주기가 전체 만기에서 차지하는 비율이 높을수록 낮은 적용비율을 사용합니다.",
  },
  {
    question: "신용대출은 언제 스트레스 DSR이 적용되나요?",
    answer:
      "기존 대출과 신규 대출을 합친 전체 신용대출 잔액이 1억원을 초과할 때 적용됩니다. 정확히 1억원이면 미적용이며, 만기 5년 이상 완전 고정금리는 0%, 3년 이상 5년 미만 완전 고정금리는 60%, 그 밖에는 100%를 적용합니다.",
  },
  {
    question: "금리상승 시나리오와 공식 스트레스 DSR은 무엇이 다른가요?",
    answer:
      "공식 스트레스 DSR은 지역·대출 종류·금리유형·잔액 조건을 정책표로 자동 판정합니다. 금리상승 시나리오는 사용자가 원하는 가산금리를 직접 입력해 비교하는 별도 참고값입니다.",
  },
  {
    question: "계약상 납입액과 DSR 산정 원리금은 왜 다른가요?",
    answer:
      "DSR은 대출 종류와 상환형태별 공식 산정만기로 원금을 환산합니다. 따라서 실제 약정에 따른 향후 1년 납입액과 DSR 분자에 반영되는 연간 원리금이 다를 수 있습니다.",
  },
  {
    question: "만기일시상환은 원금도 DSR에 포함하나요?",
    answer:
      "네. 이 계산기는 이자뿐 아니라 대출 종류별 공식 산정만기로 나눈 연간 원금도 포함합니다. 주택담보 일시상환은 실제 만기를 최대 10년까지만, 신용대출 인정요건 미충족은 5년을 적용합니다.",
  },
  {
    question: "전세자금대출도 계산할 수 있나요?",
    answer:
      "전세자금대출은 DSR 적용 제외 범위가 있어 신규대출 선택 항목에서 지원하지 않습니다. 현재 제공하는 전세보증금담보대출은 임차인이 지급한 보증금을 담보로 받는 별도 대출이며 4년 산정만기를 적용합니다.",
  },
  {
    question: "계산 결과가 대출 가능을 의미하나요?",
    answer:
      "아니요. 이 결과는 예상 계산용이며 실제 금융기관 심사 결과와 다를 수 있습니다. 소득 인정, 담보, 신용, 규제 예외, 상품 조건 등이 함께 심사됩니다.",
  },
];

export const dsrSources = [
  ...DSR_POLICY.sources.map((source) => ({
    ...source,
    category: "debtService" as const,
    verifiedAt: dsrPolicySummary.verifiedAt,
  })),
  ...DSR_STRESS_POLICY.sources.map((source) => ({
    ...source,
    category: "stressPolicy" as const,
    verifiedAt: dsrPolicySummary.verifiedAt,
  })),
];

export const dsrExampleItems = [
  { label: "연소득", value: formatWon(dsrExampleInput.annualIncome) },
  {
    label: "기존 대출 연간 DSR 원리금",
    value: formatWon(dsrExampleInput.existingAnnualDebtPayment),
  },
  { label: "신규 대출 금액", value: formatWon(dsrExampleInput.newLoanPrincipal) },
  { label: "신규 대출 금리", value: formatRate(dsrExampleInput.annualInterestRate) },
  {
    label: "기준 DSR",
    value: formatRate(dsrExampleResult.base.dsrRate),
  },
  {
    label: "공식 스트레스 DSR",
    value: formatRate(dsrExampleResult.officialStressed.dsrRate),
  },
  {
    label: "사용자 금리상승 시나리오 DSR",
    value: formatRate(dsrExampleResult.stressed.dsrRate),
  },
];

export const dsrWebApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "DSR 계산기 2026",
  description:
    "공식 부채산정 기준의 일반 DSR과 2026년 하반기 정책 자동판정 공식 스트레스 DSR, 사용자 금리상승 시나리오를 구분해 계산합니다.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  browserRequirements: "JavaScript가 지원되는 웹 브라우저",
};

export const dsrBreadcrumbJsonLd = {
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
      name: "DSR 계산기 2026",
      item: "https://gyesanbox.kr/calculators/dsr/",
    },
  ],
};

export const dsrFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: dsrFaqs.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
};
