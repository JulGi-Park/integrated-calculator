export const vatProfitBaseDate = "2026-07-10";
export const vatProfitRateText = "일반과세자 기본 부가가치세율 10%";

export const vatProfitOfficialSources = [
  {
    organization: "국가법령정보센터",
    title: "부가가치세법",
    url: "https://www.law.go.kr/법령/부가가치세법",
    supports: "부가가치세 과세 구조와 세율 확인",
  },
  {
    organization: "국세청",
    title: "부가가치세 안내",
    url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7693&mi=2272",
    supports: "신고, 납부, 과세유형별 안내 확인",
  },
] as const;

export const vatProfitFormulas = [
  {
    title: "공급가액 기준",
    formula: "매출세액 = 공급가액 × 10%, 합계금액 = 공급가액 + 매출세액",
  },
  {
    title: "합계금액 기준",
    formula: "공급가액 = 합계금액 ÷ 1.1, 매출세액 = 합계금액 - 공급가액",
  },
  {
    title: "예상 납부세액",
    formula: "예상 납부세액 = 매출세액 - 사용자가 입력한 매입세액",
  },
] as const;

export const vatProfitExampleInput = [
  { label: "입력 기준", value: "공급가액" },
  { label: "매출 공급가액", value: "1,000,000원" },
  { label: "매입세액", value: "30,000원" },
] as const;

export const vatProfitExampleResult = [
  { label: "매출세액", value: "100,000원" },
  { label: "합계금액", value: "1,100,000원" },
  { label: "예상 납부세액", value: "70,000원" },
] as const;

export const vatProfitExclusions = [
  "간이과세자 업종별 부가가치율, 면세·영세율, 수출입, 신용카드 발행세액공제",
  "불공제 매입세액, 의제매입세액, 공통매입세액 안분, 예정·확정 신고 조정",
  "가산세, 납부지연, 환급 심사, 전자세금계산서 발급 여부와 실제 신고서 항목",
] as const;

export const vatProfitFaqs = [
  {
    question: "부가세 계산기는 실제 신고서와 같은 결과인가요?",
    answer:
      "아닙니다. 이 계산기는 공급가액 또는 합계금액에서 기본 매출세액을 계산하고 사용자가 입력한 매입세액만 차감하는 참고 도구입니다.",
  },
  {
    question: "합계금액을 입력하면 공급가액은 어떻게 역산하나요?",
    answer:
      "일반과세자 기본 세율 10%를 기준으로 합계금액을 1.1로 나누어 공급가액을 계산하고, 합계금액에서 공급가액을 뺀 금액을 매출세액으로 표시합니다.",
  },
  {
    question: "매입세액을 입력하면 모두 공제되나요?",
    answer:
      "계산기는 입력한 매입세액을 그대로 차감합니다. 실제 신고에서는 불공제 항목, 사업 관련성, 증빙, 과세유형에 따라 공제 가능 금액이 달라질 수 있습니다.",
  },
  {
    question: "예상 납부세액이 음수이면 환급인가요?",
    answer:
      "계산상 매입세액이 매출세액보다 크다는 의미입니다. 실제 환급 여부는 신고서, 증빙, 세무서 검토에 따라 달라질 수 있습니다.",
  },
  {
    question: "간이과세자도 사용할 수 있나요?",
    answer:
      "간이과세자는 업종별 부가가치율과 납부면제 기준 등 별도 규정이 있어 이 계산기의 일반과세자 기본식과 다를 수 있습니다.",
  },
  {
    question: "원 단위 반올림 기준은 무엇인가요?",
    answer:
      "계산기는 중간 금액을 원 단위로 반올림해 표시합니다. 실제 신고·납부 과정의 절사 또는 조정 기준과 다를 수 있습니다.",
  },
  {
    question: "판매자 마진 계산기 결과와 연결되나요?",
    answer:
      "판매자 마진 계산기는 세전 순이익을 계산하고, 부가세 계산기는 매출세액과 입력 매입세액 기준 예상 납부세액을 따로 계산합니다.",
  },
  {
    question: "공식 출처는 어디를 기준으로 하나요?",
    answer:
      "부가가치세법과 국세청 부가가치세 안내를 기준으로 기본 구조를 설명하되, 최신 신고 기준은 국세청 안내와 세무 전문가 확인을 권장합니다.",
  },
] as const;

export const vatProfitWebApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "부가세 계산기",
  url: "https://gyesanbox.kr/calculators/vat-profit/",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description:
    "공급가액 또는 합계금액 기준으로 매출세액과 입력 매입세액 차감 후 예상 납부세액을 계산하는 부가세 계산기",
};

export const vatProfitBreadcrumbJsonLd = {
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
      name: "부가세 계산기",
      item: "https://gyesanbox.kr/calculators/vat-profit/",
    },
  ],
};

export const vatProfitFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: vatProfitFaqs.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
};
