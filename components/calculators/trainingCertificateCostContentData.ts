import {
  calculateTrainingCertificateCost,
  type TrainingCertificateCostInput,
} from "@/lib/calculators/training-certificate-cost";

export const trainingCertificateCostSeo = {
  title:
    "내일배움카드 자비부담금 계산기 | 국비지원 자격증 취득비용 계산",
  description:
    "국비지원 자격증 과정의 내일배움카드 자비부담금에 시험 응시료, 교재·재료비와 교통비를 더해 실제 예상 취득비용을 계산합니다.",
  canonical:
    "https://gyesanbox.kr/calculators/training-certificate-cost/",
  reviewedAt: "2026-08-12",
} as const;

export const trainingCertificateCostExampleInput = {
  totalTrainingCost: 1_500_000,
  trainingSelfPayAmount: 300_000,
  examFee: 50_000,
  expectedExamAttempts: 2,
  textbookCost: 30_000,
  practiceMaterialCost: 50_000,
  transportationCost: 120_000,
  mealCost: 0,
  otherCost: 0,
} satisfies TrainingCertificateCostInput;

export const trainingCertificateCostExampleResult =
  calculateTrainingCertificateCost(trainingCertificateCostExampleInput);

export const trainingCertificateCostFormulaItems = [
  "훈련비 본인부담",
  "시험 응시비",
  "교재비",
  "실습·재료비",
  "교통비",
  "식비",
  "기타 비용",
] as const;

export const trainingCertificateCostFaqs = [
  {
    question: "국비지원 자격증은 정말 무료인가요?",
    answer:
      "과정과 참여 유형에 따라 훈련비 본인부담이 생길 수 있고, 훈련비 외에도 시험 응시료·교재비·재료비·교통비 등이 들 수 있습니다. 고용24에서 해당 과정의 자비부담액과 과정 안내를 확인한 뒤 예상 비용을 계산하세요.",
  },
  {
    question: "내일배움카드 자비부담금은 어떻게 확인하나요?",
    answer:
      "고용24의 훈련 통합검색에서 과정을 찾고 상세정보의 훈련비 영역에 있는 ‘자비부담액보기’를 확인하세요. 화면의 금액은 참여 유형에 따라 달라질 수 있으므로 본인에게 적용되는 금액을 확인해야 합니다.",
  },
  {
    question: "시험 응시료도 국비지원에 포함되나요?",
    answer:
      "과정별 안내가 다를 수 있으므로 일괄적으로 포함 여부를 판단할 수 없습니다. 이 계산기에서는 실제로 부담할 것으로 예상하는 1회 응시료와 응시 횟수를 사용자가 직접 입력합니다.",
  },
  {
    question: "교재비와 재료비도 계산할 수 있나요?",
    answer:
      "네. 교재비와 실습·재료비뿐 아니라 훈련기간의 교통비, 식비, 기타 비용도 입력할 수 있습니다. 발생하지 않는 항목은 비워 두면 0원으로 계산합니다.",
  },
  {
    question: "시험에 재응시하면 비용은 얼마나 늘어나나요?",
    answer:
      "입력한 1회 응시료만큼 예상 취득비용이 늘어납니다. 계산 결과에서 1회·2회·3회 응시 비용을 비교할 수 있지만 합격 가능성이나 실제 재응시 횟수는 예측하지 않습니다.",
  },
  {
    question: "계산 결과가 실제 결제금액과 같은가요?",
    answer:
      "아닙니다. 결과는 입력값 기준의 참고용 예상값입니다. 최종 지원조건과 자비부담액, 시험·교재 등 별도 비용은 해당 훈련과정과 시행기관의 최신 안내를 확인해야 합니다.",
  },
] as const;

export const trainingCertificateCostSources = [
  {
    organization: "고용24",
    title: "국민내일배움카드 발급안내",
    criterion:
      "훈련비 지원 구조, 본인부담금 결제, 참여 조건에 따른 자기 부담 차이 안내",
    href: "https://www.work24.go.kr/hr/h/a/1100/selectIssuGudn.do",
    verifiedAt: trainingCertificateCostSeo.reviewedAt,
  },
  {
    organization: "고용24",
    title: "훈련 통합검색",
    criterion:
      "훈련과정 검색, 본인부담금 표시와 과정 상세의 자비부담액보기 확인",
    href: "https://www.work24.go.kr/hr/a/a/1100/trnnCrsInf.do",
    verifiedAt: trainingCertificateCostSeo.reviewedAt,
  },
  {
    organization: "고용노동부",
    title: "2026년 국민내일배움카드 안내",
    criterion: "국민내일배움카드 훈련비 지원 제도의 최신 정책 개요",
    href: "https://www.moel.go.kr/news/cardinfo/view.do?bbs_seq=20260100681",
    verifiedAt: trainingCertificateCostSeo.reviewedAt,
  },
] as const;

export const trainingCertificateCostWebApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "국비지원 자격증 취득비용 계산기",
  description: trainingCertificateCostSeo.description,
  url: trainingCertificateCostSeo.canonical,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Any",
  browserRequirements: "JavaScript가 지원되는 웹 브라우저",
  dateModified: trainingCertificateCostSeo.reviewedAt,
} as const;

export const trainingCertificateCostBreadcrumbJsonLd = {
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
      name: "국비지원 자격증 취득비용 계산기",
      item: trainingCertificateCostSeo.canonical,
    },
  ],
} as const;

export const trainingCertificateCostFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: trainingCertificateCostFaqs.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
} as const;
