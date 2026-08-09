import { BROKERAGE_FEE_POLICY_VERIFIED_AT } from "./brokerage-fee";

export interface BrokerageFeeContentItem {
  label: string;
  value: string;
}

export interface BrokerageFeeFormula {
  title: string;
  formula: string;
}

export interface BrokerageFeeFaq {
  question: string;
  answer: string;
}

export const brokerageFeePolicySources = [
  "공인중개사법 제32조 중개보수 등",
  "공인중개사법 시행규칙 제20조 중개보수 및 실비의 한도 등",
  "공인중개사법 시행규칙 별표 1 주택 중개보수 상한요율",
  "공인중개사법 시행규칙 별표 2 오피스텔 중개보수 요율",
  "서울특별시 부동산 중개보수 안내",
  "경기부동산포털 부동산 중개보수 요율표",
  "경기도 부동산 중개보수 등에 관한 조례 별표 1",
] as const;

export const brokerageFeeExampleInput: BrokerageFeeContentItem[] = [
  { label: "거래유형", value: "월세" },
  { label: "보증금", value: "10,000,000원" },
  { label: "월세", value: "400,000원" },
  { label: "1차 환산 거래금액", value: "50,000,000원" },
  { label: "적용 거래금액", value: "50,000,000원" },
  { label: "적용 구간", value: "임대차 5천만원 이상 ~ 1억원 미만" },
];

export const brokerageFeeExampleResult: BrokerageFeeContentItem[] = [
  { label: "상한요율", value: "0.4%" },
  { label: "한도액", value: "300,000원" },
  { label: "부가세 별도 상한보수", value: "200,000원" },
  { label: "부가세 포함 예상 금액", value: "220,000원" },
];

export const brokerageFeeFormulas: BrokerageFeeFormula[] = [
  {
    title: "매매·전세 거래금액",
    formula: "입력한 매매금액 또는 전세보증금",
  },
  {
    title: "월세 1차 환산 거래금액",
    formula: "보증금 + 월세 × 100",
  },
  {
    title: "월세 5천만원 미만 재계산",
    formula: "1차 환산 거래금액이 5천만원 미만이면 보증금 + 월세 × 70",
  },
  {
    title: "상한보수",
    formula: "거래금액 × 상한요율, 한도액이 있으면 한도액 이하로 적용",
  },
  {
    title: "부가세 포함 예상 금액",
    formula: "부가세 별도 보수 × 1.1",
  },
  {
    title: "협의보수",
    formula: "거래금액 × 협의요율, 한도액이 있으면 한도액 이하로 적용",
  },
];

export const brokerageFeeExclusions = [
  "상가",
  "토지",
  "분양권 별도 산식",
  "공장",
  "주택 요건을 충족하지 않는 오피스텔",
  "시·도별 특수 조례 예외",
  "실비",
  "계약 해제·무효·취소에 따른 지급 여부",
  "사업자 유형별 실제 부가세 청구 여부",
] as const;

export const brokerageFeeFaqs: BrokerageFeeFaq[] = [
  {
    question: "이 계산기는 어떤 거래를 계산하나요?",
    answer:
      "주택의 매매·교환, 전세, 월세 중개보수 상한액을 계산합니다. 상가, 토지, 분양권, 주택 요건을 충족하지 않는 오피스텔은 1차 범위에서 제외합니다.",
  },
  {
    question: "부동산 중개수수료와 중개보수는 같은 뜻인가요?",
    answer:
      "일상적으로는 중개수수료, 복비라고도 부르지만 법령에서는 중개보수라는 표현을 사용합니다. 이 페이지에서는 검색 편의를 위해 두 표현을 함께 설명합니다.",
  },
  {
    question: "월세 거래금액은 어떻게 환산하나요?",
    answer:
      "먼저 보증금에 월세의 100배를 더합니다. 그 금액이 5천만원 미만이면 보증금에 월세의 70배를 더한 금액을 최종 거래금액으로 사용합니다.",
  },
  {
    question: "부가세 포함 금액이 실제 청구액인가요?",
    answer:
      "아니요. 부가세 포함 금액은 단순 예상값입니다. 개업공인중개사의 사업자 유형, 계약 내용, 실제 청구 방식에 따라 달라질 수 있습니다.",
  },
  {
    question: "협의요율은 무엇인가요?",
    answer:
      "중개의뢰인과 개업공인중개사가 상한요율 범위 안에서 협의하는 요율입니다. 계산기에서는 적용 상한요율을 넘는 협의요율을 입력하면 오류로 처리합니다.",
  },
  {
    question: "한도액은 언제 적용되나요?",
    answer:
      "일부 낮은 거래금액 구간에는 한도액이 있습니다. 거래금액에 상한요율을 곱한 값이 한도액보다 크면 한도액 이하의 금액으로 표시합니다.",
  },
  {
    question: "전국 어디서나 같은가요?",
    answer:
      "주택 중개보수는 법령상 상한과 시·도 조례를 함께 확인해야 합니다. 이 계산기는 2026-08-09 확인 기준의 주택 상한요율표를 바탕으로 한 참고 계산입니다.",
  },
  {
    question: "오피스텔도 계산할 수 있나요?",
    answer:
      "오피스텔은 전용면적과 주거 설비 등 법령상 요건에 따라 별도 요율이 적용될 수 있습니다. 이번 1차 계산기는 주택 매매·전세·월세에 한정합니다.",
  },
  {
    question: "결과 금액을 그대로 내면 되나요?",
    answer:
      "아니요. 결과는 입력값에 따른 상한액과 예상액 안내입니다. 실제 지급액은 계약서, 협의요율, 부가세 청구 여부, 지역 조례를 함께 확인해야 합니다.",
  },
];

export const brokerageFeeWebApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "부동산 중개보수 계산기",
  description:
    "주택 매매, 전세, 월세 거래금액으로 중개보수 상한액, 부가세 포함 예상 금액, 협의요율 적용 금액을 계산합니다.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
};

export const brokerageFeeBreadcrumbJsonLd = {
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
      name: "부동산 중개보수 계산기",
      item: "https://gyesanbox.kr/calculators/brokerage-fee/",
    },
  ],
};

export const brokerageFeeFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: brokerageFeeFaqs.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
};

export const brokerageFeePolicySummary = {
  verifiedAt: BROKERAGE_FEE_POLICY_VERIFIED_AT,
  note: "주택 매매·교환 및 임대차 중개보수 상한요율 기준",
};
