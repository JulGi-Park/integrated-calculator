import {
  calculateSavings,
  SAVINGS_CRITERION_DATE,
  type SavingsInput,
} from "@/lib/calculators/savings/savings";

export interface SavingsContentItem {
  label: string;
  value: string;
}

export interface SavingsFaq {
  question: string;
  answer: string;
}

export interface SavingsSource {
  organization: string;
  title: string;
  criterion: string;
  verifiedAt: string;
  href: string;
}

const wonFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 0,
});

function formatWon(value: number): string {
  return `${wonFormatter.format(value)}원`;
}

function formatPercent(value: number): string {
  return `${value.toLocaleString("ko-KR", { maximumFractionDigits: 3 })}%`;
}

export const savingsCriterionDateLabel = "2026년 8월 9일";

export const savingsCalculationCriteria = [
  {
    title: "입력값 기준의 참고 계산",
    description:
      "예금 적금 계산기는 사용자가 입력한 금액, 기간, 연 이율을 기준으로 단리 이자와 세후 만기 수령액을 계산합니다.",
  },
  {
    title: "예금 이자",
    description:
      "예금은 전체 예치금이 처음부터 끝까지 이자를 받는다고 보고 예치금 × 연 이율 × 기간 / 12로 세전 이자를 계산합니다.",
  },
  {
    title: "정기적금 이자",
    description:
      "정기적금은 매월 같은 금액을 납입한다고 가정하고, 납입 회차별 이자 발생 기간 차이를 기간 × (기간 + 1) / 2로 반영합니다.",
  },
  {
    title: "일반 과세",
    description:
      "일반 과세는 이자소득세 14%와 그 소득세액의 10%인 지방소득세를 나누어 계산해 합산 효과 15.4%로 표시합니다.",
  },
  {
    title: "비과세",
    description:
      "비과세를 선택하면 이자소득세와 지방소득세를 0원으로 계산합니다. 실제 비과세 가입 가능 여부는 상품 조건을 확인해야 합니다.",
  },
  {
    title: "원 단위 반올림",
    description:
      "세전 이자, 세금, 세후 이자, 만기 수령액은 원 단위로 반올림해 표시합니다.",
  },
] as const;

export const savingsExampleInput: SavingsInput = {
  productType: "installment",
  amount: 300000,
  termMonths: 12,
  annualInterestRate: 4,
  taxType: "general",
  interestType: "simple",
};

const savingsExampleResponse = calculateSavings(savingsExampleInput);

if (!savingsExampleResponse.success) {
  throw new Error("예금 적금 예시 입력이 현재 계산 정책을 통과하지 못했습니다.");
}

const savingsExampleResult = savingsExampleResponse.data;

export const savingsExampleInputItems: SavingsContentItem[] = [
  { label: "상품 유형", value: "정기적금" },
  { label: "월 납입액", value: formatWon(savingsExampleInput.amount) },
  { label: "기간", value: `${savingsExampleInput.termMonths}개월` },
  { label: "연 이율", value: formatPercent(savingsExampleInput.annualInterestRate) },
  { label: "과세 방식", value: "일반 과세" },
  { label: "이자 방식", value: "단리" },
];

export const savingsExampleResultItems: SavingsContentItem[] = [
  { label: "원금 합계", value: formatWon(savingsExampleResult.principalTotal) },
  { label: "세전 이자", value: formatWon(savingsExampleResult.grossInterest) },
  { label: "총 세금", value: formatWon(savingsExampleResult.totalTax) },
  { label: "세후 이자", value: formatWon(savingsExampleResult.netInterest) },
  { label: "만기 수령액", value: formatWon(savingsExampleResult.maturityAmount) },
];

export const savingsInterpretationCards = [
  {
    title: "예금과 적금은 이자 기간이 다름",
    description:
      "예금은 원금 전체가 처음부터 이자를 받지만, 정기적금은 매월 납입한 돈마다 이자를 받는 개월 수가 다릅니다.",
  },
  {
    title: "세전 이자와 세후 이자 구분",
    description:
      "세전 이자는 세금을 떼기 전 이자이며, 세후 이자는 이자소득세와 지방소득세를 뺀 뒤의 금액입니다.",
  },
  {
    title: "실제 지급액은 달라질 수 있음",
    description:
      "금융기관의 일수 계산, 원미만 처리, 우대금리 충족 여부, 중도해지 여부에 따라 실제 만기 수령액은 달라질 수 있습니다.",
  },
] as const;

export const savingsInterpretationNotes = [
  "자유적금은 납입 시점과 금액이 달라 실제 결과가 달라질 수 있으므로 1차 계산에서는 매월 동일 금액 납입 기준만 다룹니다.",
  "복리 계산, 중도해지 이자, 변동금리 자동 반영은 포함하지 않습니다.",
  "우대금리는 최종 적용받을 연 이율을 사용자가 직접 입력해야 합니다.",
  "세율과 제도는 기준일 이후 변경될 수 있습니다.",
] as const;

export const savingsExclusions = [
  "자유적금의 불규칙 납입 자동 계산",
  "복리 계산",
  "중도해지 이자 계산",
  "우대금리 조건 자동 판정",
  "변동금리 자동 반영",
  "금융기관별 일수 계산",
  "비과세종합저축 가입 가능 여부 판정",
  "특정 은행 상품 추천",
] as const;

export const savingsFaqs: SavingsFaq[] = [
  {
    question: "예금과 적금 이자는 왜 다르게 계산되나요?",
    answer:
      "예금은 예치금 전체가 처음부터 이자를 받지만, 정기적금은 매월 납입한 금액마다 이자를 받는 기간이 다릅니다. 그래서 같은 원금 합계와 금리라도 결과가 다를 수 있습니다.",
  },
  {
    question: "정기적금 이자가 월 납입액 × 개월 수 × 금리로 계산되지 않는 이유는 무엇인가요?",
    answer:
      "첫 달 납입액은 전체 기간에 가깝게 이자를 받지만 마지막 달 납입액은 짧은 기간만 이자를 받습니다. 이 계산기는 기간 × (기간 + 1) / 2를 사용해 납입 회차별 기간 차이를 반영합니다.",
  },
  {
    question: "세전 이자와 세후 이자는 무엇이 다른가요?",
    answer:
      "세전 이자는 세금을 빼기 전 이자이고, 세후 이자는 이자소득세와 지방소득세를 뺀 뒤 실제 수령액에 더해지는 이자입니다.",
  },
  {
    question: "일반 과세 기준 세율은 어떻게 적용되나요?",
    answer:
      "기준일 2026년 8월 9일 현재 일반 과세는 이자소득세 14%와 그 소득세액의 10%인 지방소득세를 나누어 계산합니다. 합산 효과는 이자액의 15.4%입니다.",
  },
  {
    question: "비과세종합저축이나 세금우대 상품도 계산할 수 있나요?",
    answer:
      "비과세를 선택해 세금을 0원으로 계산할 수는 있습니다. 다만 실제 가입 가능 여부, 한도, 특수 과세는 상품과 개인 조건에 따라 달라 별도 확인이 필요합니다.",
  },
  {
    question: "실제 은행 만기 수령액과 차이가 나는 이유는 무엇인가요?",
    answer:
      "금융기관별 일수 계산 방식, 원미만 처리, 납입일, 우대금리 충족 여부, 세율 변경, 상품 약관이 다를 수 있기 때문입니다. 결과는 입력값 기준의 참고 계산입니다.",
  },
  {
    question: "중도해지 이자도 계산되나요?",
    answer:
      "중도해지 이자는 계산하지 않습니다. 중도해지는 상품별 별도 금리와 기간 기준이 적용될 수 있으므로 금융기관 약관을 확인해야 합니다.",
  },
  {
    question: "우대금리는 어떻게 입력해야 하나요?",
    answer:
      "우대 조건을 실제로 충족한다고 판단되는 경우 기본금리와 우대금리를 더한 최종 연 이율을 입력하세요. 이 계산기는 우대 조건 충족 여부를 자동 판정하지 않습니다.",
  },
];

export const savingsSources: SavingsSource[] = [
  {
    organization: "법제처 국가법령정보센터",
    title: "소득세법 제129조",
    criterion: "이자소득 원천징수세율 14% 기준 확인",
    verifiedAt: savingsCriterionDateLabel,
    href: "https://www.law.go.kr/법령/소득세법/제129조",
  },
  {
    organization: "국세청",
    title: "원천징수 안내",
    criterion:
      "개인 지방소득세 특별징수는 소득세액의 10%를 함께 고려해야 한다는 안내 확인",
    verifiedAt: savingsCriterionDateLabel,
    href: "https://www.nts.go.kr/",
  },
];

export const savingsWebApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "예금 적금 계산기",
  description:
    "예금과 적금의 세전 이자, 세후 이자, 세금, 만기 수령액을 입력값 기준으로 계산합니다.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  browserRequirements: "JavaScript가 지원되는 웹 브라우저",
};

export const savingsBreadcrumbJsonLd = {
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
      item: "https://gyesanbox.kr/calculators",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "예금 적금 계산기",
      item: "https://gyesanbox.kr/calculators/savings",
    },
  ],
};

export const savingsFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: savingsFaqs.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
};

export { SAVINGS_CRITERION_DATE };
