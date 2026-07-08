import { calculateDsr } from "@/lib/calculators/dsr";
import { DSR_POLICY } from "@/lib/calculators/dsr/constants";
import type { DsrInput } from "@/lib/calculators/dsr/types";
import { formatRate, formatWon } from "./dsrClientUtils";

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
  repaymentType: "levelPayment",
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
  defaultStressRate: formatRate(DSR_POLICY.defaultStressInterestRate),
};

export const dsrCriteria = [
  {
    title: "DSR 계산식",
    description:
      "전체 DSR은 기존 대출 연간 원리금과 신규 대출 예상 연간 원리금을 더한 뒤 연소득으로 나눠 계산합니다.",
  },
  {
    title: "스트레스 금리",
    description:
      "스트레스 DSR 비교에서는 신규 대출 금리에만 입력한 스트레스 금리를 더해 원리금을 다시 계산합니다.",
  },
  {
    title: "원리금균등상환",
    description:
      "월 상환액 공식을 사용하며 0% 금리는 대출금액을 전체 개월 수로 나눕니다. DSR용 연간 원리금은 월 상환액의 12개월분입니다.",
  },
  {
    title: "원금균등상환",
    description:
      "첫 달 월 상환액과 평균 월 상환액을 구분하며, DSR용 연간 원리금은 평균 월 상환액 × 12로 계산합니다.",
  },
  {
    title: "만기일시상환",
    description:
      "DSR용 연간 원리금은 월 이자 × 12로 계산하며 만기 원금 상환 부담은 별도로 확인해야 합니다.",
  },
] as const;

export const dsrCautions = [
  "이 계산기는 예상 계산용이며 실제 금융기관 심사 결과와 다를 수 있습니다.",
  "DSR 적용 대상, 예외, 소득 인정 방식, 대출별 원리금 산정 방식은 금융기관·업권·상품·차주 상황에 따라 달라질 수 있습니다.",
  "스트레스 금리는 실제 대출 금리에 더해지는 금리가 아니라 DSR 산정에서 금리변동 위험을 반영하기 위한 비교용 입력값입니다.",
  "대출 가능 확정이나 승인 보장을 의미하지 않습니다.",
] as const;

export const dsrFaqs: DsrFaq[] = [
  {
    question: "DSR은 어떻게 계산하나요?",
    answer:
      "DSR은 연간 금융부채 원리금 상환액을 연소득으로 나눈 비율입니다. 이 계산기는 기존 대출 연간 원리금과 신규 대출 예상 연간 원리금을 합산해 예상 DSR을 계산합니다.",
  },
  {
    question: "스트레스 DSR은 무엇인가요?",
    answer:
      "스트레스 DSR은 금리변동 위험을 반영하기 위해 DSR 산정 때 일정 수준의 가산금리를 적용해 보는 방식입니다. 이 계산기는 신규 대출 금리에 입력한 스트레스 금리를 더해 비교합니다.",
  },
  {
    question: "원금균등상환의 연간 원리금은 어떻게 보나요?",
    answer:
      "원금균등상환은 월 납입액이 매달 달라지므로 첫 달 월 상환액과 평균 월 상환액을 함께 보여줍니다. MVP 계산에서는 평균 월 상환액 × 12를 DSR용 연간 원리금으로 사용합니다.",
  },
  {
    question: "만기일시상환은 원금도 DSR에 포함하나요?",
    answer:
      "현재 계산기는 만기 전 기간의 연간 이자 부담을 DSR용 연간 상환액으로 계산하고, 만기 원금 상환 부담은 별도 안내합니다. 실제 심사 산정 방식은 금융기관과 상품별 기준을 확인해야 합니다.",
  },
  {
    question: "계산 결과가 대출 가능을 의미하나요?",
    answer:
      "아니요. 이 결과는 예상 계산용이며 실제 금융기관 심사 결과와 다를 수 있습니다. 소득 인정, 담보, 신용, 규제 예외, 상품 조건 등이 함께 심사됩니다.",
  },
];

export const dsrSources = DSR_POLICY.sources.map((source) => ({
  ...source,
  verifiedAt: dsrPolicySummary.verifiedAt,
}));

export const dsrExampleItems = [
  { label: "연소득", value: formatWon(dsrExampleInput.annualIncome) },
  {
    label: "기존 대출 연간 원리금",
    value: formatWon(dsrExampleInput.existingAnnualDebtPayment),
  },
  { label: "신규 대출 금액", value: formatWon(dsrExampleInput.newLoanPrincipal) },
  { label: "신규 대출 금리", value: formatRate(dsrExampleInput.annualInterestRate) },
  {
    label: "기준 DSR",
    value: formatRate(dsrExampleResult.base.dsrRate),
  },
  {
    label: "스트레스 DSR",
    value: formatRate(dsrExampleResult.stressed.dsrRate),
  },
];

export const dsrWebApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "DSR 계산기 2026",
  description:
    "연소득, 기존 대출 연간 원리금, 신규 대출 조건과 스트레스 금리를 입력해 예상 DSR 비율을 계산합니다.",
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
