export interface RoasContentItem {
  label: string;
  value: string;
}

export interface RoasFormula {
  title: string;
  formula: string;
}

export interface RoasFaq {
  question: string;
  answer: string;
}

export const roasExampleInput: RoasContentItem[] = [
  { label: "광고비", value: "100,000원" },
  { label: "광고 매출", value: "500,000원" },
  { label: "상품 원가", value: "250,000원" },
  { label: "기타 비용", value: "50,000원" },
];

export const roasExampleResult: RoasContentItem[] = [
  { label: "ROAS", value: "500%" },
  { label: "광고 후 순이익", value: "100,000원" },
  { label: "공헌이익률", value: "40%" },
  { label: "손익분기 ROAS", value: "250%" },
];

export const roasFormulas: RoasFormula[] = [
  { title: "ROAS", formula: "광고 매출 ÷ 광고비 × 100" },
  { title: "광고비 비중", formula: "광고비 ÷ 광고 매출 × 100" },
  {
    title: "광고 후 순이익",
    formula: "광고 매출 - 상품 원가 - 기타 비용 - 광고비",
  },
  {
    title: "광고비 제외 공헌이익",
    formula: "광고 매출 - 상품 원가 - 기타 비용",
  },
  {
    title: "공헌이익률",
    formula: "광고비 제외 공헌이익 ÷ 광고 매출",
  },
  { title: "손익분기 ROAS", formula: "100 ÷ 공헌이익률" },
];

export const roasInterpretations = [
  "ROAS가 높아도 상품 원가와 기타 비용을 반영하면 실제 순이익은 낮을 수 있습니다.",
  "ROAS 100%는 광고비와 광고 매출만 비교한 기준이며 순이익 기준 손익분기점이 아닙니다.",
  "공헌이익률이 낮은 상품은 더 높은 ROAS가 필요합니다.",
  "목표 ROAS를 입력한 경우 실제 ROAS와 비교해 목표 달성 여부를 표시합니다.",
  "실제 광고 플랫폼의 전환 매출 집계 방식, 기여 기간, 환불, 취소, 부가세 포함 여부에 따라 결과가 달라질 수 있습니다.",
] as const;

export const roasExclusions = [
  "광고 플랫폼별 전환 기여 기간 차이",
  "환불, 취소, 교환",
  "부가세 포함 또는 제외 기준",
  "카드 수수료, PG 수수료, 플랫폼 수수료",
  "쿠폰, 적립금, 무료배송 부담",
  "광고 매체별 보고서 집계 방식 차이",
  "실제 정산일 기준 차이",
] as const;

export const roasFaqs: RoasFaq[] = [
  {
    question: "ROAS 100%면 이익인가요?",
    answer:
      "아니요. ROAS 100%는 광고비와 광고 매출이 같다는 뜻입니다. 상품 원가, 배송비, 수수료와 기타 비용을 빼면 순이익은 음수일 수 있습니다.",
  },
  {
    question: "ROAS와 마진율은 같은 뜻인가요?",
    answer:
      "다릅니다. ROAS는 광고비 대비 광고 매출 비율이고, 마진율은 매출에서 원가와 비용을 뺀 이익 비율을 보는 지표입니다.",
  },
  {
    question: "광고비만 넣으면 정확한 수익을 알 수 있나요?",
    answer:
      "광고비와 광고 매출만으로는 ROAS만 확인할 수 있습니다. 수익을 보려면 상품 원가와 기타 비용을 함께 입력해야 합니다.",
  },
  {
    question: "상품 원가를 모르면 어떻게 계산하나요?",
    answer:
      "상품 원가를 모르면 0원으로 둘 수 있지만, 이 경우 광고 후 순이익과 손익분기 ROAS가 실제보다 좋게 보일 수 있습니다.",
  },
  {
    question: "손익분기 ROAS는 어떤 의미인가요?",
    answer:
      "입력한 원가와 기타 비용 구조에서 광고 후 순이익이 0원이 되기 위해 필요한 최소 ROAS입니다.",
  },
  {
    question: "광고 플랫폼의 실제 결과와 차이가 나는 이유는 무엇인가요?",
    answer:
      "플랫폼마다 전환 기여 기간, 매출 집계 기준, 환불과 취소 반영 시점, 부가세 포함 여부가 다르기 때문입니다.",
  },
  {
    question: "목표 ROAS는 어떻게 정해야 하나요?",
    answer:
      "상품의 공헌이익률, 고정비, 성장 목표와 재고 상황을 함께 보고 정해야 합니다. 손익분기 ROAS보다 낮은 목표는 순이익 기준으로 위험할 수 있습니다.",
  },
  {
    question: "부가세와 환불은 반영되나요?",
    answer:
      "자동 반영되지 않습니다. 부가세, 환불, 취소, 교환, 수수료는 필요한 경우 기타 비용이나 별도 자료로 직접 보정해야 합니다.",
  },
];

export const roasWebApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ROAS 계산기",
  description:
    "광고비와 광고 매출을 입력해 ROAS, 광고비 비중, 광고 후 순이익, 손익분기 ROAS를 계산합니다.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
};

export const roasBreadcrumbJsonLd = {
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
      name: "ROAS 계산기",
      item: "https://gyesanbox.kr/calculators/roas",
    },
  ],
};

export const roasFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: roasFaqs.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
};
