export interface AveragePriceContentItem {
  label: string;
  value: string;
}

export interface AveragePriceFormula {
  title: string;
  formula: string;
}

export interface AveragePriceFaq {
  question: string;
  answer: string;
}

export const averagePriceExampleInput: AveragePriceContentItem[] = [
  { label: "현재 보유 수량", value: "10주" },
  { label: "현재 평균 단가", value: "50,000원" },
  { label: "추가 매수 수량", value: "5주" },
  { label: "추가 매수 단가", value: "40,000원" },
  { label: "현재가 또는 목표 매도가", value: "45,000원" },
];

export const averagePriceExampleResult: AveragePriceContentItem[] = [
  { label: "기존 투자금액", value: "500,000원" },
  { label: "추가 투자금액", value: "200,000원" },
  { label: "총 보유 수량", value: "15주" },
  { label: "총 투자금액", value: "700,000원" },
  { label: "신규 평균 단가", value: "46,666.67원" },
  { label: "예상 평가금액", value: "675,000원" },
  { label: "예상 손익", value: "-25,000원" },
  { label: "예상 수익률", value: "-3.57%" },
];

export const averagePriceFormulas: AveragePriceFormula[] = [
  { title: "기존 투자금액", formula: "현재 보유 수량 × 현재 평균 단가" },
  { title: "추가 투자금액", formula: "추가 매수 수량 × 추가 매수 단가" },
  { title: "총 보유 수량", formula: "현재 보유 수량 + 추가 매수 수량" },
  { title: "총 투자금액", formula: "기존 투자금액 + 추가 투자금액" },
  { title: "신규 평균 단가", formula: "총 투자금액 ÷ 총 보유 수량" },
  {
    title: "예상 평가금액",
    formula: "총 보유 수량 × 현재가 또는 목표 매도가",
  },
  { title: "예상 손익", formula: "예상 평가금액 - 총 투자금액" },
  { title: "예상 수익률", formula: "예상 손익 ÷ 총 투자금액 × 100" },
];

export const averagePriceExclusions = [
  "수수료",
  "세금",
  "환율",
  "슬리피지",
  "배당",
  "액면분할",
  "병합",
  "레버리지",
  "신용거래",
  "달러 환산",
  "거래소별 호가 단위",
] as const;

export const averagePriceFaqs: AveragePriceFaq[] = [
  {
    question: "주식과 코인 수량을 모두 입력할 수 있나요?",
    answer:
      "네. 현재 보유 수량과 추가 매수 수량은 소수 입력을 허용합니다. 국내주식, 해외주식, 코인처럼 수량 단위가 다른 경우에도 같은 평균단가 공식으로 계산합니다.",
  },
  {
    question: "현재가와 목표 매도가는 꼭 입력해야 하나요?",
    answer:
      "아니요. 현재가 또는 목표 매도가는 선택 입력입니다. 입력하지 않으면 평균단가와 총 투자금액까지만 계산하고, 입력하면 예상 평가금액·예상 손익·예상 수익률을 함께 계산합니다.",
  },
  {
    question: "수수료와 세금도 반영되나요?",
    answer:
      "아니요. 이 계산기는 수수료, 세금, 환율 등을 반영하지 않은 단순 평균단가 계산값을 제공합니다. 실제 손익은 거래 조건과 과세 기준에 따라 달라질 수 있습니다.",
  },
  {
    question: "달러나 환율 계산도 가능한가요?",
    answer:
      "1차 구현에서는 원화 기준 단가만 입력합니다. 해외주식처럼 외화 거래가 필요한 경우에는 환율과 수수료를 별도로 확인해야 합니다.",
  },
  {
    question: "신규 평균 단가는 어떻게 계산하나요?",
    answer:
      "기존 투자금액과 추가 투자금액을 더한 뒤, 현재 보유 수량과 추가 매수 수량을 더한 총 보유 수량으로 나눕니다.",
  },
  {
    question: "예상 수익률은 어떤 기준인가요?",
    answer:
      "현재가 또는 목표 매도가를 입력했을 때 예상 손익을 총 투자금액으로 나눈 비율입니다. 입력값을 기준으로 한 산술 계산이며 투자 판단을 대신하지 않습니다.",
  },
  {
    question: "결과가 실제 계좌 손익과 다를 수 있나요?",
    answer:
      "네. 실제 계좌에는 매매 수수료, 세금, 환율, 체결 가격 차이, 배당, 분할·병합 등이 반영될 수 있어 계산기 결과와 다를 수 있습니다.",
  },
];

export const averagePriceWebApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "물타기 계산기",
  description:
    "현재 보유 수량, 평균 단가, 추가 매수 수량과 단가를 입력해 신규 평균단가, 총 투자금액, 예상 손익을 계산합니다.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
};

export const averagePriceBreadcrumbJsonLd = {
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
      name: "물타기 계산기",
      item: "https://gyesanbox.kr/calculators/average-price",
    },
  ],
};

export const averagePriceFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: averagePriceFaqs.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
};
