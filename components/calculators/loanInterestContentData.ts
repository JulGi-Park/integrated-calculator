import {
  calculateLoanRepaymentComparison,
} from "@/lib/calculators/loan/loan-repayment";
import { LOAN_REPAYMENT_POLICY } from "@/lib/calculators/loan/policy";
import type {
  LoanRepaymentInput,
  LoanRepaymentType,
} from "@/lib/calculators/loan/types";

export interface LoanInterestContentItem {
  label: string;
  value: string;
}

export interface LoanInterestFaq {
  question: string;
  answer: string;
}

export interface LoanInterestSource {
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

function formatRate(value: number): string {
  return `${value}%`;
}

function formatTerm(value: number): string {
  return `${wonFormatter.format(value)}개월`;
}

function formatKoreanDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

function getTypeLabel(type: LoanRepaymentType): string {
  switch (type) {
    case "equalPayment":
      return "원리금균등상환";
    case "equalPrincipal":
      return "원금균등상환";
    case "bullet":
      return "만기일시상환";
  }
}

export const loanInterestQuickComparison = [
  {
    title: "원리금균등상환",
    points: [
      "원금과 이자의 합계가 대체로 일정합니다.",
      "월별 자금 계획을 세우기 비교적 쉽습니다.",
      "마지막 회차는 잔액 보정으로 몇 원 차이가 날 수 있습니다.",
    ],
  },
  {
    title: "원금균등상환",
    points: [
      "매월 같은 기본 원금을 상환합니다.",
      "초기 납입액이 크고 이후 점차 감소합니다.",
      "동일 조건에서는 일반적으로 총이자가 상대적으로 적을 수 있습니다.",
    ],
  },
  {
    title: "만기일시상환",
    points: [
      "기간 중에는 이자를 납부합니다.",
      "마지막 회차에 원금 전액을 상환합니다.",
      "기간 중 부담은 작지만 만기 원금 부담이 큽니다.",
    ],
  },
] as const;

export const loanInterestCalculationCriteria = {
  common: [
    {
      title: "월 이율",
      description: "연이율을 12와 100으로 나눠 월 이율로 바꿉니다.",
    },
    {
      title: "이자 계산 기준",
      description:
        "이자는 각 방식의 해당 회차 납부 전 잔액을 기준으로 계산합니다.",
    },
    {
      title: "원 단위 처리",
      description: "금액은 원 단위 half-up 반올림으로 처리합니다.",
    },
    {
      title: "마지막 회차 보정",
      description:
        "마지막 회차 원금은 남은 잔액 전액으로 보정해 원금 합계가 최초 대출원금과 일치하도록 맞춥니다.",
    },
    {
      title: "총이자와 총상환액",
      description:
        "총이자는 월별 이자의 합계이고, 총상환액은 대출원금과 총이자의 합계입니다.",
    },
  ],
  equalPayment: [
    "표준 월 상환 공식을 사용합니다.",
    "매월 납입액은 대체로 일정합니다.",
    "초기에는 이자 비중이 크고 시간이 갈수록 원금 비중이 늘어납니다.",
    "마지막 회차는 남은 잔액 보정으로 정기 납입액과 차이가 날 수 있습니다.",
  ],
  equalPrincipal: [
    "대출원금을 전체 개월 수로 나눠 기본 월 원금을 정합니다.",
    "남은 잔액에 월 이율을 적용해 회차별 이자를 계산합니다.",
    "잔액이 줄어들수록 이자와 월 납입액도 함께 감소합니다.",
    "나머지 원금은 마지막 회차에서 보정합니다.",
  ],
  bullet: [
    "만기 전까지 원금 상환액은 0원입니다.",
    "매월 원금 전체에 대한 이자만 납부합니다.",
    "마지막 회차에 원금 전액과 해당 월 이자를 함께 납부합니다.",
  ],
  special: [
    "0% 금리도 별도 처리해 정상 계산합니다.",
    "1개월 대출도 첫 회차이자와 원금 전액을 함께 계산합니다.",
    "총이자와 첫 달 부담은 입력값과 반올림 조건에 따라 동률이 나올 수 있습니다.",
  ],
} as const;

export const loanInterestExampleInput: LoanRepaymentInput = {
  principal: 100_000_000,
  annualInterestRate: 4,
  termMonths: 120,
};

const loanInterestExampleResponse = calculateLoanRepaymentComparison(
  loanInterestExampleInput,
);

if (!loanInterestExampleResponse.success) {
  throw new Error("대출 계산 예시 입력이 현재 계산 정책을 통과하지 못했습니다.");
}

const loanInterestExampleResult = loanInterestExampleResponse.data;

export const loanInterestExampleInputItems: LoanInterestContentItem[] = [
  { label: "대출원금", value: formatWon(loanInterestExampleInput.principal) },
  {
    label: "연이율",
    value: formatRate(loanInterestExampleInput.annualInterestRate),
  },
  {
    label: "기간",
    value: formatTerm(loanInterestExampleInput.termMonths),
  },
];

export const loanInterestExampleResultItems = (
  [
    "equalPayment",
    "equalPrincipal",
    "bullet",
  ] as LoanRepaymentType[]
).map((type) => {
  const repayment = loanInterestExampleResult[type];
  const first = repayment.schedule[0];
  const last = repayment.schedule[repayment.schedule.length - 1];

  return {
    title: getTypeLabel(type),
    items: [
      { label: "첫 달 납입액", value: formatWon(first.monthlyPayment) },
      {
        label: type === "bullet" ? "마지막 달 납입액" : "마지막 달 납입액",
        value: formatWon(last.monthlyPayment),
      },
      { label: "총이자", value: formatWon(repayment.totalInterest) },
      { label: "총상환액", value: formatWon(repayment.totalPayment) },
      {
        label: "월 납입액 특징",
        value:
          type === "equalPayment"
            ? "대체로 일정"
            : type === "equalPrincipal"
              ? "점차 감소"
              : "이자만 내다가 만기 상환",
      },
    ] satisfies LoanInterestContentItem[],
  };
});

export const loanInterestInterpretationCards = [
  {
    title: "총이자가 적다는 의미",
    description:
      "전체 기간에 부담하는 이자 합계가 작다는 뜻이지만, 초기 납입 부담까지 함께 작다는 뜻은 아닙니다.",
  },
  {
    title: "첫 달 부담이 적다는 의미",
    description:
      "대출 초기에 필요한 현금 유출이 작다는 뜻이며, 이후 총이자나 만기 부담과는 별도로 봐야 합니다.",
  },
  {
    title: "일정한 월 납입액의 장점",
    description:
      "월별 자금 계획을 세우기 쉬워지지만, 마지막 회차는 잔액 보정으로 몇 원 차이가 날 수 있습니다.",
  },
] as const;

export const loanInterestInterpretationNotes = [
  "초기 부담이 작은 방식이 전체 비용까지 항상 가장 작다고 단정할 수는 없습니다.",
  "만기일시상환은 기간 중 납입액이 작아 보여도 마지막 달에 원금 전액을 준비해야 합니다.",
  "원금균등상환은 일반적으로 총이자가 적을 수 있지만 입력값과 반올림 조건에 따라 동률이 나올 수 있습니다.",
  "0% 금리나 특수한 경계값에서는 총이자·첫 달 부담 결과가 같아질 수 있습니다.",
  "월별 현금흐름과 만기 자금 계획을 함께 보고 판단해야 하며 계산 결과만으로 상품이나 상환방식을 결정하면 안 됩니다.",
] as const;

export const loanInterestExclusions = [
  "거치기간",
  "중도상환",
  "중도상환수수료",
  "변동금리",
  "금리 변경",
  "연체이자",
  "인지세",
  "보증료",
  "취급수수료",
  "대출 실행일과 납부일",
  "월별 실제 일수",
  "윤년",
  "우대금리 조건",
  "일부 원금 상환",
  "DSR·DTI·LTV",
  "금융회사별 절사·반올림 방식",
] as const;

export const loanInterestFaqs: LoanInterestFaq[] = [
  {
    question: "대출이자는 어떻게 계산하나요?",
    answer:
      "연이율을 월 이율로 바꾸고 각 회차의 납부 전 잔액에 적용해 이자를 계산합니다. 이 계산기는 원 단위 half-up 반올림과 마지막 회차 잔액 보정 정책을 사용합니다.",
  },
  {
    question: "원리금균등과 원금균등의 차이는 무엇인가요?",
    answer:
      "원리금균등은 매월 원금과 이자의 합계가 대체로 일정한 방식이고, 원금균등은 같은 기본 원금을 나누어 갚아 월 납입액이 점차 감소하는 방식입니다.",
  },
  {
    question: "총이자가 가장 적은 상환방식은 무엇인가요?",
    answer:
      "일반적으로는 원금균등상환의 총이자가 더 적을 수 있지만, 입력값과 반올림 조건에 따라 동률이 발생할 수 있으므로 항상 단정할 수는 없습니다.",
  },
  {
    question: "월 납입액이 일정한 상환방식은 무엇인가요?",
    answer:
      "원리금균등상환은 월 납입액이 대체로 일정합니다. 다만 마지막 회차는 남은 잔액 보정 때문에 몇 원 차이가 날 수 있습니다.",
  },
  {
    question: "만기일시상환은 마지막 달에 얼마를 내나요?",
    answer:
      "마지막 회차에는 대출원금 전액과 해당 월 이자를 함께 납부합니다. 그래서 기간 중에는 이자만 내더라도 만기에는 큰 원금 부담이 생깁니다.",
  },
  {
    question: "0% 금리도 계산할 수 있나요?",
    answer:
      "네. 0% 금리도 별도 처리해 계산하며, 이 경우 총이자는 0원이고 상환방식에 따라 원금 배분만 달라집니다.",
  },
  {
    question: "거치기간과 중도상환수수료도 반영되나요?",
    answer:
      "아니요. 현재 계산기는 거치기간, 중도상환, 중도상환수수료를 반영하지 않습니다.",
  },
  {
    question: "실제 은행 상환금액과 계산 결과가 다른 이유는 무엇인가요?",
    answer:
      "실제 금융회사는 실행일, 납부일, 월별 일수, 상품 조건, 절사·반올림 방식이 다를 수 있습니다. 이 계산 결과는 입력값과 현재 계산 정책에 따른 예상치입니다.",
  },
];

export const loanInterestSources: LoanInterestSource[] = [
  {
    organization: "한국주택금융공사",
    title: "월별상환원리금",
    criterion: "월별 상환원리금을 확인할 수 있는 공식 계산 페이지",
    verifiedAt: "2026년 6월 22일",
    href: "https://www.hf.go.kr/ko/sub01/sub01_06_03.do",
  },
  {
    organization: "한국주택금융공사",
    title: "(특성별) 상품소개",
    criterion:
      "보금자리론 상환방식으로 원리금 균등, 원금 균등, 체증식 분할상환을 안내하는 공식 설명",
    verifiedAt: "2026년 6월 22일",
    href: "https://www.hf.go.kr/ko/sub01/sub01_01_02.do",
  },
  {
    organization: "서민금융진흥원",
    title: "대출 이자 계산기",
    criterion:
      "원금균등상환, 원리금균등상환, 만기일시상환의 정의와 계산 결과가 참고용이라는 안내",
    verifiedAt: "2026년 6월 22일",
    href: "https://www.kinfa.or.kr/financialProduct/learnMorePopup.do",
  },
];

export const loanInterestWebApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "대출 이자 계산기",
  description:
    "대출금액과 연이율, 기간을 입력해 월 납입액과 총이자를 계산하고 원리금균등·원금균등·만기일시상환 결과를 비교합니다.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  browserRequirements: "JavaScript가 지원되는 웹 브라우저",
};

export const loanInterestBreadcrumbJsonLd = {
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
      name: "대출 이자 계산기",
      item: "https://gyesanbox.kr/calculators/loan/",
    },
  ],
};

export const loanInterestFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: loanInterestFaqs.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
};

export const loanInterestPolicySummary = {
  verifiedAt: formatKoreanDate(LOAN_REPAYMENT_POLICY.verifiedAt),
  principalLimit: formatWon(LOAN_REPAYMENT_POLICY.maximumPrincipal),
};
