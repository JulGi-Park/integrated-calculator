import { calculateCarCost, type CarCostInput } from "@/lib/calculators/car-cost/car-cost";

export interface CarCostContentItem {
  label: string;
  value: string;
}

export interface CarCostFaq {
  question: string;
  answer: string;
}

export interface CarCostSource {
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

function formatKm(value: number): string {
  return `${wonFormatter.format(value)}km`;
}

function formatLiter(value: number): string {
  return `${value.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}L`;
}

export const carCostCalculationCriteria = [
  {
    title: "입력값 기준 비교 계산",
    description:
      "자동차 유지비 계산기는 법정 금액 확정 계산기가 아니라 사용자가 직접 입력한 비용으로 월 자동차 유지비를 비교하는 계산기입니다.",
  },
  {
    title: "월 유류 사용량",
    description: "월 유류 사용량은 월 주행거리를 연비로 나누어 계산합니다.",
  },
  {
    title: "월 유류비",
    description: "월 유류비는 월 유류 사용량에 유류 단가를 곱해 계산합니다.",
  },
  {
    title: "월 고정비",
    description:
      "월 고정비는 연 보험료의 월 환산액, 연 자동차세의 월 환산액, 월 주차비를 더한 값입니다.",
  },
  {
    title: "월 변동비",
    description:
      "월 변동비는 월 유류비, 월 정비·소모품 비용, 월 통행료, 월 기타 비용을 더한 값입니다.",
  },
  {
    title: "선택 비용",
    description:
      "할부금과 감가상각비는 포함을 선택한 경우에만 월 총 부담액에 더합니다. 차량 구매비, 리스료 등은 별도 판단이 필요합니다.",
  },
  {
    title: "1km당 비용",
    description:
      "1km당 비용은 월 유류비, 월 운행 유지비, 월 총 부담액을 각각 월 주행거리로 나누어 계산합니다.",
  },
  {
    title: "연간 환산",
    description: "연간 비용은 월 비용에 12를 곱해 단순 환산합니다.",
  },
] as const;

export const carCostExampleInput: CarCostInput = {
  monthlyDistanceKm: 1000,
  fuelEfficiencyKmPerL: 12,
  fuelPricePerL: 1700,
  annualInsuranceCost: 900000,
  annualCarTax: 300000,
  monthlyMaintenanceCost: 50000,
  monthlyParkingCost: 100000,
  monthlyTollCost: 30000,
  monthlyEtcCost: 20000,
  includeLoanPayment: true,
  monthlyLoanPayment: 300000,
  includeDepreciation: false,
  monthlyDepreciationCost: 0,
};

const carCostExampleResponse = calculateCarCost(carCostExampleInput);

if (!carCostExampleResponse.success) {
  throw new Error("자동차 유지비 예시 입력이 현재 계산 정책을 통과하지 못했습니다.");
}

const carCostExampleResult = carCostExampleResponse.data;

export const carCostExampleInputItems: CarCostContentItem[] = [
  { label: "월 주행거리", value: formatKm(carCostExampleInput.monthlyDistanceKm) },
  { label: "연비", value: `${carCostExampleInput.fuelEfficiencyKmPerL}km/L` },
  { label: "유류 단가", value: `${formatWon(carCostExampleInput.fuelPricePerL)}/L` },
  { label: "연 보험료", value: formatWon(carCostExampleInput.annualInsuranceCost) },
  { label: "연 자동차세", value: formatWon(carCostExampleInput.annualCarTax) },
  { label: "월 정비비", value: formatWon(carCostExampleInput.monthlyMaintenanceCost) },
  { label: "월 주차비", value: formatWon(carCostExampleInput.monthlyParkingCost) },
  { label: "월 통행료", value: formatWon(carCostExampleInput.monthlyTollCost) },
  { label: "월 기타 비용", value: formatWon(carCostExampleInput.monthlyEtcCost) },
  { label: "선택 비용", value: "월 할부금 포함, 감가상각 미포함" },
];

export const carCostExampleResultItems: CarCostContentItem[] = [
  { label: "월 유류 사용량", value: formatLiter(carCostExampleResult.monthlyFuelUsageL) },
  { label: "월 운행 유지비", value: formatWon(carCostExampleResult.monthlyOperatingCost) },
  { label: "월 총 부담액", value: formatWon(carCostExampleResult.monthlyTotalCost) },
  { label: "연 총 부담액", value: formatWon(carCostExampleResult.annualTotalCost) },
  { label: "1km당 총 부담", value: formatWon(carCostExampleResult.totalCostPerKm) },
];

export const carCostInterpretationCards = [
  {
    title: "고정비와 변동비를 분리해서 보기",
    description:
      "보험료, 자동차세, 주차비처럼 주행거리와 직접 연동되지 않는 항목과 유류비처럼 주행에 따라 달라지는 항목을 나누어 볼 수 있습니다.",
  },
  {
    title: "총 부담액은 선택 비용 포함 결과",
    description:
      "운행 유지비에는 할부금과 감가상각을 넣지 않고, 월 총 부담액에는 사용자가 포함한 선택 비용만 더합니다.",
  },
  {
    title: "실제 비용은 조건에 따라 달라짐",
    description:
      "차량 상태, 정비 주기, 보험 조건, 유가, 주차 환경에 따라 실제 지출은 계산 결과와 다를 수 있습니다.",
  },
] as const;

export const carCostInterpretationNotes = [
  "비용 절감이나 특정 차량 선택의 결과를 보장하지 않습니다.",
  "월 주행거리가 길수록 유류비와 1km당 비용 차이가 크게 보일 수 있습니다.",
  "기름값 계산기처럼 유류비만 보는 것이 아니라 보험료, 자동차세, 주차비, 정비비까지 함께 봅니다.",
  "차 유지비 계산 결과는 입력한 금액을 기준으로 한 단순 추정값입니다.",
] as const;

export const carCostExclusions = [
  "자동차 구매 가격 자동 계산",
  "취득세 자동 계산",
  "자동차세 자동 계산",
  "보험료 자동 계산",
  "전기차 충전비 자동 계산",
  "내연기관·전기차 비교",
  "리스·렌트 견적 비교",
  "차량 모델명 기반 자동 계산",
  "지역별 유가 자동 연동",
  "실제 정비비 확정 산정",
] as const;

export const carCostFaqs: CarCostFaq[] = [
  {
    question: "자동차 유지비에는 어떤 항목을 넣어야 하나요?",
    answer:
      "유류비, 보험료, 자동차세, 주차비, 정비·소모품 비용, 통행료, 기타 비용을 넣을 수 있습니다. 할부금과 감가상각비는 총 부담액까지 보고 싶을 때 선택으로 포함합니다.",
  },
  {
    question: "유류비는 월 사용량으로 넣는 게 좋나요, 월 유류비로 넣는 게 좋나요?",
    answer:
      "이 계산기는 월 주행거리, 연비, 유류 단가로 월 유류 사용량과 월 유류비를 계산합니다. 이미 월 유류비만 알고 있다면 주행거리와 연비, 단가를 실제 지출에 맞게 조정해 비교용으로 사용할 수 있습니다.",
  },
  {
    question: "자동차세와 보험료는 월 비용으로 어떻게 나누나요?",
    answer:
      "연 보험료와 연 자동차세를 각각 12로 나누어 월 환산액으로 보여줍니다. 실제 납부 시점은 다를 수 있으므로 월평균 비교용으로만 보세요.",
  },
  {
    question: "할부금이나 리스료도 포함해야 하나요?",
    answer:
      "차량 보유의 전체 현금 부담을 보려면 포함할 수 있습니다. 다만 운행 자체의 유지비와 구분하기 위해 이 계산기는 할부금과 감가상각비를 선택 비용으로 따로 표시합니다.",
  },
  {
    question: "1km당 비용은 어떤 의미인가요?",
    answer:
      "월 비용을 월 주행거리로 나눈 값입니다. 유류비만 본 1km당 유류비, 운행 유지비 기준, 선택 비용까지 포함한 총 부담 기준을 나누어 확인할 수 있습니다.",
  },
  {
    question: "실제 지출과 계산 결과가 다른 이유는 무엇인가요?",
    answer:
      "보험 조건, 정비 주기, 유가, 주차 환경, 운전 습관, 차량 상태가 모두 다르기 때문입니다. 계산 결과는 입력값 기준의 예상치입니다.",
  },
  {
    question: "전기차나 하이브리드 차량도 사용할 수 있나요?",
    answer:
      "하이브리드는 연비와 유류 단가를 직접 입력해 비교할 수 있습니다. 전기차 충전비 자동 계산과 내연기관·전기차 비교는 현재 포함하지 않습니다.",
  },
  {
    question: "감가상각비는 꼭 넣어야 하나요?",
    answer:
      "꼭 넣을 필요는 없습니다. 월 현금 지출만 보고 싶다면 제외하고, 차량 가치 하락까지 총 부담으로 보고 싶다면 사용자가 정한 월 감가상각비를 포함하세요.",
  },
];

export const carCostSources: CarCostSource[] = [
  {
    organization: "위택스",
    title: "위택스",
    criterion:
      "자동차세 등 지방세 조회와 납부는 개인 조건과 지자체 안내에 따라 공식 채널에서 확인해야 합니다.",
    verifiedAt: "2026년 8월 9일",
    href: "https://www.wetax.go.kr/main.do",
  },
  {
    organization: "한국석유공사 오피넷",
    title: "오피넷",
    criterion:
      "유가 정보는 시점과 지역에 따라 달라지므로 한국석유공사 오피넷 등에서 직접 확인할 수 있습니다.",
    verifiedAt: "2026년 8월 9일",
    href: "https://www.opinet.co.kr/",
  },
  {
    organization: "개별 보험사·정비업체",
    title: "개별 견적 확인 필요",
    criterion:
      "보험료와 정비비는 운전자 조건, 차량 상태, 주행거리, 정비 항목에 따라 달라집니다.",
    verifiedAt: "2026년 8월 9일",
    href: "https://gyesanbox.kr/calculators/car-cost",
  },
];

export const carCostWebApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "자동차 유지비 계산기",
  description:
    "유류비, 보험료, 자동차세, 주차비, 정비비 등을 입력해 월간·연간 자동차 유지비와 1km당 비용을 계산합니다.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  browserRequirements: "JavaScript가 지원되는 웹 브라우저",
};

export const carCostBreadcrumbJsonLd = {
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
      name: "자동차 유지비 계산기",
      item: "https://gyesanbox.kr/calculators/car-cost",
    },
  ],
};

export const carCostFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: carCostFaqs.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
};
