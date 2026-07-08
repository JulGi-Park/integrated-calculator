import { calculateYouthFutureSavings } from "@/lib/calculators/youth-future-savings";
import { YOUTH_FUTURE_SAVINGS_POLICY } from "@/lib/calculators/youth-future-savings/constants";
import type { YouthFutureSavingsInput } from "@/lib/calculators/youth-future-savings/types";
import { formatPercent, formatWon } from "./youthFutureSavingsClientUtils";

export interface YouthFutureSavingsFaq {
  question: string;
  answer: string;
}

function formatKoreanDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

export const youthFutureSavingsExampleInput: YouthFutureSavingsInput = {
  monthlyDeposit: 500_000,
  termMonths: 36,
  annualInterestRate: 7,
  contributionType: "standard",
  taxType: "taxFree",
};

const exampleResponse = calculateYouthFutureSavings(
  youthFutureSavingsExampleInput,
);

if (!exampleResponse.success) {
  throw new Error("청년미래적금 예시 입력이 계산 정책을 통과하지 못했습니다.");
}

export const youthFutureSavingsExampleResult = exampleResponse.data;

export const youthFutureSavingsPolicySummary = {
  verifiedAt: formatKoreanDate(YOUTH_FUTURE_SAVINGS_POLICY.verifiedAt),
  monthlyLimit: formatWon(YOUTH_FUTURE_SAVINGS_POLICY.maximumMonthlyDeposit),
  defaultTerm: `${YOUTH_FUTURE_SAVINGS_POLICY.defaultTermMonths}개월`,
  standardRate: formatPercent(
    YOUTH_FUTURE_SAVINGS_POLICY.standardContributionRate,
  ),
  preferredRate: formatPercent(
    YOUTH_FUTURE_SAVINGS_POLICY.preferredContributionRate,
  ),
  taxRate: formatPercent(YOUTH_FUTURE_SAVINGS_POLICY.interestIncomeTaxRate),
};

export const youthFutureSavingsCriteria = [
  {
    title: "납입 원금",
    description: "월 납입액에 가입 개월 수를 곱해 총 납입 원금을 구합니다.",
  },
  {
    title: "예상 이자",
    description:
      "매월 같은 금액을 납입한다고 가정하고 단리 적금식으로 월별 납입액의 잔여 개월 이자를 합산합니다.",
  },
  {
    title: "정부기여금",
    description:
      "일반형은 납입 원금의 6%, 우대형은 12%를 기본값으로 두며 직접 입력 시 선택한 금액 또는 비율을 사용합니다. 이 1차 계산기는 정부기여금의 지급 시점과 별도 이자 효과를 반영하지 않습니다.",
  },
  {
    title: "과세",
    description:
      "비과세 선택 시 이자세를 0원으로, 일반과세 선택 시 이자소득세 15.4%를 적용합니다.",
  },
] as const;

export const youthFutureSavingsCautions = [
  "이 계산기는 가입 가능 여부를 판정하지 않습니다.",
  "실제 금리와 우대조건은 취급 금융기관의 상품 조건에 따라 달라질 수 있습니다.",
  "중도해지, 납입 누락, 납입일 차이, 기여금 지급 제한은 반영하지 않습니다.",
  "금융위원회 보도자료의 예시는 약식 표기이며, 이 계산기는 월 납입 원금의 단리 예상 이자와 정부기여금 원금을 분리해 보수적으로 계산합니다.",
  "정부기여금과 비과세는 가입자 요건 및 상품 조건 충족 여부에 따라 달라질 수 있습니다.",
] as const;

export const youthFutureSavingsFaqs: YouthFutureSavingsFaq[] = [
  {
    question: "청년미래적금 계산기는 무엇을 계산하나요?",
    answer:
      "월 납입액, 기간, 연 이자율, 정부기여금 방식과 과세 여부를 입력해 총 납입 원금, 예상 이자, 정부기여금, 이자세와 예상 만기수령액을 계산합니다.",
  },
  {
    question: "정부기여금 일반형과 우대형은 어떻게 다른가요?",
    answer:
      "MVP 계산 기준에서 일반형은 납입 원금의 6%, 우대형은 납입 원금의 12%를 정부기여금으로 계산합니다. 실제 적용 유형은 상품 요건과 심사 결과에 따라 달라질 수 있습니다.",
  },
  {
    question: "비과세를 선택하면 실제로 세금이 없나요?",
    answer:
      "계산 결과에서는 이자세를 0원으로 처리하지만, 실제 비과세 적용 여부는 가입자 요건과 상품 조건 충족 여부에 따라 달라질 수 있습니다.",
  },
  {
    question: "자유적립식인데 왜 매월 같은 금액으로 계산하나요?",
    answer:
      "1차 구현에서는 사용자가 빠르게 예상액을 볼 수 있도록 매월 동일 금액을 납입한다고 가정합니다. 실제 납입일과 월별 납입액이 다르면 결과가 달라질 수 있습니다.",
  },
  {
    question: "계산 결과가 실제 만기수령액과 다를 수 있나요?",
    answer:
      "네. 은행 금리, 우대조건, 가입일, 납입일, 중도해지, 원 단위 처리 방식, 정부기여금 지급 시점과 지급 요건에 따라 실제 수령액은 달라질 수 있습니다. 현재 계산기는 월 납입 원금의 단리 예상 이자와 정부기여금 원금을 분리해 계산합니다.",
  },
];

export const youthFutureSavingsSources = [
  {
    organization: YOUTH_FUTURE_SAVINGS_POLICY.officialSourceName,
    title: YOUTH_FUTURE_SAVINGS_POLICY.officialSourceTitle,
    criterion:
      "월 최대 50만원, 3년 만기 자유적립식, 납입액의 6% 또는 12% 정부기여금, 이자소득세 면제 안내",
    verifiedAt: youthFutureSavingsPolicySummary.verifiedAt,
    href: YOUTH_FUTURE_SAVINGS_POLICY.officialSourceUrl,
  },
] as const;

export const youthFutureSavingsWebApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "청년미래적금 계산기",
  description:
    "청년미래적금의 월 납입액, 기간, 이자율, 정부기여금과 과세 여부를 입력해 예상 만기수령액을 계산합니다.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  browserRequirements: "JavaScript가 지원되는 웹 브라우저",
};

export const youthFutureSavingsBreadcrumbJsonLd = {
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
      name: "청년미래적금 계산기",
      item: "https://gyesanbox.kr/calculators/youth-future-savings/",
    },
  ],
};

export const youthFutureSavingsFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: youthFutureSavingsFaqs.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
};
