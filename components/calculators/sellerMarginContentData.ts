export interface SellerMarginContentItem {
  label: string;
  value: string;
}

export interface SellerMarginFormula {
  title: string;
  formula: string;
  note?: string;
}

export interface SellerMarginFaq {
  question: string;
  answer: string;
}

export const sellerMarginExampleInput: SellerMarginContentItem[] = [
  { label: "판매단가", value: "5,000원" },
  { label: "판매수량", value: "100개" },
  { label: "판매자 부담 할인금액", value: "2,000원" },
  { label: "고객에게 받은 배송비", value: "3,000원" },
  { label: "개당 원가", value: "1,500원" },
  { label: "플랫폼 수수료율", value: "3%" },
  { label: "결제 수수료율", value: "1%" },
  { label: "판매자 부담 배송비", value: "4,500원" },
  { label: "배분 광고비", value: "0원" },
  { label: "기타 비용", value: "0원" },
];

export const sellerMarginExampleResult: SellerMarginContentItem[] = [
  { label: "상품 판매금액", value: "500,000원" },
  { label: "결제금액", value: "501,000원" },
  { label: "상품 원가 총액", value: "150,000원" },
  { label: "플랫폼 수수료", value: "15,000원" },
  { label: "결제 수수료", value: "5,010원" },
  { label: "총수수료", value: "20,010원" },
  { label: "예상 정산금액", value: "480,990원" },
  { label: "총비용", value: "154,500원" },
  { label: "예상 순이익", value: "326,490원" },
  { label: "순이익률", value: "약 65.17%" },
  { label: "원가율", value: "30%" },
  { label: "총수수료율", value: "약 3.99%" },
];

export const sellerMarginFormulas: SellerMarginFormula[] = [
  { title: "상품 판매금액", formula: "판매단가 × 판매수량" },
  {
    title: "결제금액",
    formula: "상품 판매금액 - 판매자 부담 할인금액 + 고객에게 받은 배송비",
  },
  { title: "상품 원가 총액", formula: "개당 원가 × 판매수량" },
  {
    title: "플랫폼 수수료",
    formula: "상품 판매금액 × 플랫폼 수수료율 ÷ 100",
  },
  {
    title: "결제 수수료",
    formula: "결제금액 × 결제 수수료율 ÷ 100",
  },
  { title: "총수수료", formula: "플랫폼 수수료 + 결제 수수료" },
  {
    title: "예상 정산금액",
    formula: "결제금액 - 플랫폼 수수료 - 결제 수수료",
  },
  {
    title: "총비용",
    formula: "상품 원가 총액 + 판매자 부담 배송비 + 광고비 + 기타 비용",
  },
  { title: "예상 순이익", formula: "예상 정산금액 - 총비용" },
  {
    title: "순이익률",
    formula: "예상 순이익 ÷ 결제금액 × 100",
  },
  {
    title: "원가율",
    formula: "상품 원가 총액 ÷ 상품 판매금액 × 100",
  },
  {
    title: "총수수료율",
    formula: "총수수료 ÷ 결제금액 × 100",
  },
];

export const sellerMarginExclusions = [
  "부가가치세",
  "종합소득세",
  "법인세",
  "플랫폼별 수수료 과세 기준 차이",
  "쿠폰 비용 분담",
  "반품",
  "환불",
  "주문 취소",
  "원천징수",
  "정산 보류",
  "플랫폼별 지급 주기",
  "별도로 입력하지 않은 포장비",
  "주문별로 배분하지 않은 광고비",
  "광고비 변동",
  "플랫폼별 추가 서비스 수수료",
] as const;

export const sellerMarginFaqs: SellerMarginFaq[] = [
  {
    question: "마진과 순이익은 무엇이 다른가요?",
    answer:
      "마진은 판매금액에서 원가나 일부 비용을 제외한 차액을 넓게 표현할 때 사용됩니다. 이 계산기의 예상 순이익은 결제금액에서 플랫폼·결제 수수료와 입력한 원가·배송비·광고비·기타 비용을 차감한 세전 예상값입니다.",
  },
  {
    question: "개당 원가에는 무엇을 포함해야 하나요?",
    answer:
      "상품을 한 개 확보하거나 제조하는 데 직접 들어간 비용을 입력합니다. 매입가, 제조 원가 등을 포함할 수 있으며 포장비처럼 별도 관리할 비용은 기타 비용에 입력할 수 있습니다.",
  },
  {
    question: "플랫폼 수수료율은 어디에서 확인하나요?",
    answer:
      "이용 중인 판매 플랫폼의 판매자센터, 수수료 안내 또는 실제 정산 내역에서 확인해야 합니다. 카테고리, 결제수단, 광고상품과 부가서비스에 따라 수수료가 달라질 수 있습니다.",
  },
  {
    question: "배송비는 어떻게 입력하나요?",
    answer:
      "구매자에게 받은 배송비는 `고객에게 받은 배송비`에 입력하고, 판매자가 택배사 등에 실제 부담한 금액은 `판매자 부담 배송비`에 입력합니다. 무료배송이라면 고객에게 받은 배송비는 0원으로 입력합니다.",
  },
  {
    question: "광고비는 어떤 기준으로 입력하나요?",
    answer:
      "해당 주문 한 건에 배분할 광고비를 입력합니다. 주문별 광고비를 정확히 알기 어렵다면 일정 기간의 광고비를 같은 기간의 주문 수로 나눈 금액 등을 참고할 수 있지만, 실제 배분 기준은 운영 방식에 따라 달라집니다.",
  },
  {
    question: "부가가치세도 계산되나요?",
    answer:
      "아니요. 이 계산기는 부가가치세, 종합소득세, 법인세와 원천징수를 자동 계산하지 않습니다. 표시되는 순이익은 사용자가 입력한 비용만 반영한 세전 예상값입니다.",
  },
  {
    question: "계산 결과와 실제 정산액이 다른 이유는 무엇인가요?",
    answer:
      "플랫폼별 수수료 과세 기준, 쿠폰 분담, 반품·환불, 정산 보류, 추가 서비스 수수료, 절사·반올림 방식 등이 계산기에 자동 반영되지 않기 때문입니다. 실제 금액은 플랫폼 정산 내역을 우선 확인해야 합니다.",
  },
  {
    question: "적자 결과가 나오는 이유는 무엇인가요?",
    answer:
      "예상 정산금액보다 상품 원가, 판매자 부담 배송비, 광고비와 기타 비용의 합계가 크면 적자로 표시됩니다. 입력한 할인금액과 수수료율이 높아져도 예상 순이익이 감소할 수 있습니다.",
  },
];

export const sellerMarginWebApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "판매자 마진 계산기",
  description:
    "판매단가, 수량, 개당 원가, 할인, 배송비, 플랫폼·결제 수수료와 광고비를 입력해 예상 정산금액과 세전 순이익을 계산합니다.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
};

export const sellerMarginBreadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "홈" },
    { "@type": "ListItem", position: 2, name: "계산기 목록" },
    {
      "@type": "ListItem",
      position: 3,
      name: "판매자 마진 계산기",
    },
  ],
};

export const sellerMarginFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: sellerMarginFaqs.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
};
