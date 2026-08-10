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
  productTerm: "3년 만기 자유적립식",
};

export const youthFutureSavingsCriteria = [
  {
    title: "가입 대상",
    description:
      "만 19~34세 청년이 대상이며 병역 이행기간은 최대 6년까지 연령 계산에서 제외될 수 있습니다. 개인소득과 가구소득 요건을 함께 확인하며, 이 계산기는 가입 가능 여부를 자동 판정하지 않습니다.",
  },
  {
    title: "소득 기준과 유형",
    description:
      "공식 안내상 총급여 7,500만원 이하 또는 종합소득금액 6,300만원 이하 등의 개인소득 기준과 기준 중위소득 200% 이하 가구소득 요건을 확인합니다. 일반형 6%·우대형 12% 적용 여부는 소득·가구·재직 요건을 포함해 서민금융진흥원이 판정합니다. 총급여 6,000만원 초과 7,500만원 이하 등 일부 대상은 정부기여금 없이 비과세만 적용될 수 있습니다.",
  },
  {
    title: "납입 한도와 기간",
    description:
      "월 최대 50만원을 납입하는 3년 만기 자유적립식 상품입니다. 이 계산기는 매월 같은 금액을 36개월 납입하는 경우를 기준으로 합니다.",
  },
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
      "일반형은 납입 원금의 6%, 우대형은 12%를 참고값으로 계산합니다. 실제 적용 유형은 자동 판정되며, 이 계산기는 정부기여금의 지급 시점과 별도 이자 효과를 반영하지 않습니다.",
  },
  {
    title: "과세",
    description:
      "비과세 선택 시 이자세를 0원으로, 일반과세 선택 시 이자소득세 15.4%를 적용합니다.",
  },
] as const;

export const youthFutureSavingsCautions = [
  "이 계산기는 가입 가능 여부를 판정하지 않습니다.",
  "실제 금리와 우대조건은 취급 금융기관이 정하므로, 입력 금리를 정부가 확정한 단일 금리로 보지 마세요.",
  "중도해지, 납입 누락, 납입일 차이, 기여금 지급 제한은 반영하지 않습니다.",
  "금융위원회 보도자료의 예시는 약식 표기이며, 이 계산기는 월 납입 원금의 단리 예상 이자와 정부기여금 원금을 분리해 보수적으로 계산합니다.",
  "정부기여금과 비과세는 가입자 요건 및 상품 조건 충족 여부에 따라 달라질 수 있으며, 일반형·우대형 선택은 참고용입니다.",
  "금융위원회가 제시한 연 7% 예시는 일반형 약 2,110만원, 우대형 약 2,227만원이지만 실제 은행의 일수·납입일 계산과 이 계산기의 단리 근사값은 다를 수 있습니다.",
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
      "이 계산기는 일반형 6%, 우대형 12%를 납입 원금 기준의 참고값으로 계산합니다. 실제 적용 유형은 개인소득·가구소득·재직 요건 등을 포함해 서민금융진흥원이 판정하므로, 계산기 선택값이 가입 결과를 뜻하지는 않습니다.",
  },
  {
    question: "청년미래적금 가입 조건은 어떻게 되나요?",
    answer:
      "공식 안내상 만 19~34세 청년이 대상이며, 병역 이행기간은 최대 6년까지 연령 계산에서 제외될 수 있습니다. 개인소득과 가구소득 요건을 함께 확인하므로, 가입 가능 여부는 취급 금융기관 또는 서민금융진흥원 안내로 확인해야 합니다.",
  },
  {
    question: "월 얼마까지, 얼마나 납입할 수 있나요?",
    answer:
      "청년미래적금은 월 최대 50만원을 납입하는 3년 만기 자유적립식 상품입니다. 이 계산기는 매월 같은 금액을 36개월 납입한다고 가정해 예상액을 보여줍니다.",
  },
  {
    question: "소득에 따라 정부기여금이 달라지나요?",
    answer:
      "네. 공식 안내에는 일반형 6%, 우대형 12%와 함께 소득·가구·재직 요건이 제시되어 있습니다. 예를 들어 총급여 6,000만원 초과 7,500만원 이하 등 일부 대상은 정부기여금 없이 비과세만 적용될 수 있어, 이 계산기는 소득구간을 자동 판정하지 않습니다.",
  },
  {
    question: "비과세를 선택하면 실제로 세금이 없나요?",
    answer:
      "계산 결과에서는 이자세를 0원으로 처리하지만, 실제 비과세 적용 여부는 가입자 요건과 상품 조건 충족 여부에 따라 달라질 수 있습니다.",
  },
  {
    question: "은행별 금리는 같은가요?",
    answer:
      "아닙니다. 금리와 우대조건은 취급 금융기관의 상품 조건에 따라 달라질 수 있습니다. 이 계산기의 연 이자율은 예상 금리를 직접 입력하는 값이며, 실제 적용 금리를 보장하지 않습니다.",
  },
  {
    question: "중도해지하면 정부기여금과 비과세는 어떻게 되나요?",
    answer:
      "일반 중도해지 때는 정부기여금과 비과세 혜택을 받을 수 없다는 공식 안내가 있습니다. 특별중도해지 등 예외와 실제 처리 기준은 취급 금융기관의 최신 약관을 확인해야 하며, 이 계산기는 중도해지금액을 계산하지 않습니다.",
  },
  {
    question: "청년도약계좌와 동시에 가입하거나 갈아탈 수 있나요?",
    answer:
      "청년도약계좌와의 중복 가입은 제한됩니다. 2026년 첫 신청 기간에는 일정 요건 아래 전환 절차가 별도로 안내됐으므로, 현재 가능 여부와 조건은 서민금융진흥원 및 취급 금융기관 공지를 확인해야 합니다. 이 계산기는 두 상품의 전환 손익을 비교하지 않습니다.",
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
    organization: "서민금융진흥원",
    title: "청년미래적금 상품 안내",
    criterion:
      "현재 운영 기준: 3년 자유적립식, 월 최대 50만원, 일반형 6%·우대형 12% 정부기여금, 이자소득 비과세 및 금융기관별 금리 안내",
    verifiedAt: youthFutureSavingsPolicySummary.verifiedAt,
    href: "https://www.kinfa.or.kr/financialProduct/youthFutureSavings.do",
  },
  {
    organization: YOUTH_FUTURE_SAVINGS_POLICY.officialSourceName,
    title: YOUTH_FUTURE_SAVINGS_POLICY.officialSourceTitle,
    criterion:
      "월 최대 50만원, 3년 만기 자유적립식, 납입액의 6% 또는 12% 정부기여금, 이자소득세 면제 안내",
    verifiedAt: youthFutureSavingsPolicySummary.verifiedAt,
    href: YOUTH_FUTURE_SAVINGS_POLICY.officialSourceUrl,
  },
  {
    organization: "대한민국 정책브리핑",
    title: "청년미래적금 Q&A ② 가입 요건·정부기여금",
    criterion:
      "개인·가구소득 기준, 일반형·우대형 적용 요건, 정부기여금 없이 비과세만 적용되는 구간 안내",
    verifiedAt: youthFutureSavingsPolicySummary.verifiedAt,
    href: "https://www.korea.kr/multi/visualNewsView.do?newsId=148966817",
  },
  {
    organization: "대한민국 정책브리핑",
    title: "청년미래적금 Q&A ① 청년도약계좌·중도해지",
    criterion:
      "청년도약계좌와의 관계, 일반 중도해지 시 정부기여금·비과세 처리 안내",
    verifiedAt: youthFutureSavingsPolicySummary.verifiedAt,
    href: "https://www.korea.kr/multi/visualNewsView.do?newsId=148966732",
  },
] as const;

export const youthFutureSavingsWebApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "청년미래적금 계산기",
  description:
    "청년미래적금의 월 납입액, 기간, 예상 이자율, 정부기여금 참고 유형과 과세 여부를 입력해 예상 만기금액을 계산합니다.",
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
