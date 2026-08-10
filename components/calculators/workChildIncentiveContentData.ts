import { calculateWorkChildIncentive } from "@/lib/calculators/work-child-incentive";
import { WORK_CHILD_INCENTIVE_POLICY } from "@/lib/calculators/work-child-incentive/constants";
import type { WorkChildIncentiveInput } from "@/lib/calculators/work-child-incentive/types";

export interface WorkChildIncentiveFaq {
  question: string;
  answer: string;
}

export interface WorkChildIncentiveSource {
  organization: string;
  title: string;
  criterion: string;
  href: string;
}

const formatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 0,
});

function formatWon(value: number): string {
  return `${formatter.format(value)}원`;
}

export function formatKoreanDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

export const workChildIncentivePolicySummary = {
  verifiedAt: WORK_CHILD_INCENTIVE_POLICY.verifiedAt,
  incomeYear: `${WORK_CHILD_INCENTIVE_POLICY.incomeYear}년 부부합산 연간 총소득`,
  workIncomeLimits: "단독 2,200만원, 홑벌이 3,200만원, 맞벌이 4,400만원 미만",
  childIncomeLimit: "홑벌이·맞벌이 7,000만원 미만",
  propertyLimit: "가구원 합산 재산 2.4억원 미만",
  reduction: "재산 1.7억원 이상 2.4억원 미만 50%, 기한 후 신청 95% 반영",
  filingPeriod: "정기 2026년 5월 1일~6월 1일, 기한 후 6월 2일~12월 1일",
} as const;

export const workChildIncentiveExampleInput: WorkChildIncentiveInput = {
  applicationType: "both",
  householdType: "singleIncome",
  totalIncome: 28_000_000,
  totalSalary: 26_000_000,
  propertyAmount: 120_000_000,
  childCount: 2,
  childAgeEligible: true,
  spouseSalary: 0,
  filingType: "regular",
  hasTaxArrears: "no",
  hasChildTaxCredit: "no",
};

const exampleResponse = calculateWorkChildIncentive(workChildIncentiveExampleInput);

if (!exampleResponse.success) {
  throw new Error("근로·자녀장려금 예시 입력이 계산 정책을 통과하지 못했습니다.");
}

export const workChildIncentiveExampleItems = [
  { label: "신청 유형", value: "근로+자녀장려금" },
  { label: "가구 유형", value: "홑벌이" },
  { label: "부부합산 총소득", value: formatWon(workChildIncentiveExampleInput.totalIncome) },
  { label: "총급여액 등", value: formatWon(workChildIncentiveExampleInput.totalSalary) },
  { label: "재산 합계액", value: formatWon(workChildIncentiveExampleInput.propertyAmount) },
  { label: "부양자녀 수", value: `${workChildIncentiveExampleInput.childCount}명` },
  {
    label: "예상 근로장려금",
    value: formatWon(exampleResponse.data.work.estimatedAfterReduction),
  },
  {
    label: "예상 자녀장려금",
    value: formatWon(exampleResponse.data.child.estimatedAfterReduction),
  },
  {
    label: "최종 예상 수령액",
    value: formatWon(exampleResponse.data.totalEstimatedAmount),
  },
] as const;

export const workChildIncentiveCriteria = [
  {
    title: "근로장려금 소득 기준",
    description:
      "2026년 신청 기준 2025년 부부합산 총소득이 단독가구 2,200만원, 홑벌이가구 3,200만원, 맞벌이가구 4,400만원 미만인지 먼저 확인합니다.",
  },
  {
    title: "자녀장려금 소득 기준",
    description:
      "단독가구는 제외하고 홑벌이·맞벌이 가구의 부부합산 총소득 7,000만원 미만 여부와 부양자녀 18세 미만 기준을 함께 확인합니다.",
  },
  {
    title: "총소득과 총급여액 등의 차이",
    description:
      "총소득은 신청자격의 소득요건을 판단하는 부부합산 금액입니다. 총급여액 등은 근로·사업·종교인소득을 기준으로 장려금 산정과 배우자 300만원 가구유형 판정에 사용하므로 같은 숫자로 보지 않습니다.",
  },
  {
    title: "재산 기준",
    description:
      "2025년 6월 1일 현재 가구원 합산 재산이 2.4억원 미만이어야 하며, 부채는 재산가액에서 차감하지 않는 기준으로 안내합니다.",
  },
  {
    title: "감액 안내",
    description:
      "재산 1.7억원 이상 2.4억원 미만은 산정액의 50%, 기한 후 신청은 95%를 반영합니다. 체납액 충당과 자녀세액공제 중복 차감은 안내 문구로 표시합니다.",
  },
  {
    title: "2026년 신청 시기",
    description:
      "2025년 귀속 정기신청은 2026년 5월 1일~6월 1일이고, 기한 후 신청은 6월 2일~12월 1일입니다. 이 계산기는 기한 후를 선택하면 산정액의 95%를 반영하며, 반기신청은 별도 소득연도·정산 구조가 있어 안내용으로만 표시합니다.",
  },
  {
    title: "예상 산정 방식",
    description:
      "조세특례제한법의 가구 유형별 총급여액 구간 산식을 적용하고 재산·기한 후 신청 감액을 반영합니다. 실제 지급액은 법정 산정표의 구간별 금액과 국세청 심사 결과를 확인해야 합니다.",
  },
] as const;

export const workChildIncentiveExceptions = [
  "신청 안내문 수령 여부",
  "가구원 구성의 세부 판정",
  "재산 평가액과 전세금 간주 방식",
  "사업소득·종교인소득 세부 조정",
  "자녀세액공제 중복 차감액",
  "체납액 충당 여부",
  "허위 신청에 따른 환수·제한",
  "반기 신청 정산 결과",
] as const;

export const workChildIncentiveFaqs: WorkChildIncentiveFaq[] = [
  {
    question: "2026년 근로·자녀장려금은 몇 년 소득으로 계산하나요?",
    answer:
      "2026년 정기신청과 기한 후 신청은 2025년 귀속 소득을 기준으로 합니다. 재산은 2025년 6월 1일 현재 가구원 합산 재산을 확인합니다. 2026년에 발생한 소득을 넣는 반기신청은 근로소득자만 대상으로 하며, 이 계산기에서는 안내용으로만 표시합니다.",
  },
  {
    question: "근로장려금 소득기준은 얼마인가요?",
    answer:
      "2025년 부부합산 총소득 기준으로 단독가구는 2,200만원, 홑벌이가구는 3,200만원, 맞벌이가구는 4,400만원 미만이어야 합니다. 지급액 산정에는 총소득과 다른 총급여액 등을 사용하므로 두 입력값을 구분해 확인해야 합니다.",
  },
  {
    question: "맞벌이와 홑벌이는 어떻게 구분하나요?",
    answer:
      "맞벌이가구는 신청인과 배우자의 총급여액 등이 각각 300만원 이상인 경우입니다. 배우자의 총급여액 등이 300만원 미만이면 홑벌이가구로 보며, 배우자가 없어도 부양자녀 또는 70세 이상 직계존속 요건을 충족하면 홑벌이가구가 될 수 있습니다.",
  },
  {
    question: "이 계산 결과가 실제 지급액과 같나요?",
    answer:
      "아니요. 입력값과 공개 기준을 바탕으로 한 예상 계산이며 실제 지급 여부와 지급액은 국세청 심사 결과에 따라 달라질 수 있습니다.",
  },
  {
    question: "자녀장려금은 단독가구도 계산되나요?",
    answer:
      "단독가구는 자녀장려금 예상 계산에서 제외됩니다. 근로+자녀장려금을 선택해도 단독가구라면 근로장려금만 예상 계산하고 자녀장려금 제외 사유를 표시합니다.",
  },
  {
    question: "부채를 재산에서 빼고 입력하면 되나요?",
    answer:
      "재산 기준 안내에서는 부채를 재산가액에서 차감하지 않는 것으로 봅니다. 입력할 때도 가구원 합산 재산가액을 기준으로 확인해 주세요.",
  },
  {
    question: "전세보증금도 재산에 포함되나요?",
    answer:
      "네. 재산 판단에는 전세금도 포함됩니다. 주택 전세금은 간주전세금과 실제 전세금 중 작은 금액, 상가 전세금은 실제 전세금을 기준으로 평가합니다. 이 계산기는 세부 재산을 자동 평가하지 않으므로 국세청 기준으로 합산한 재산가액을 입력해야 합니다.",
  },
  {
    question: "근로장려금과 자녀장려금을 같이 받을 수 있나요?",
    answer:
      "홑벌이 또는 맞벌이 가구가 각각의 소득·재산·부양자녀 요건을 충족하면 함께 신청할 수 있습니다. 자녀장려금은 부양자녀 18세 미만 요건과 부부합산 총소득 7,000만원 미만 기준을 별도로 확인하며, 단독가구는 대상이 아닙니다.",
  },
  {
    question: "기한 후 신청은 어떻게 반영하나요?",
    answer:
      "2026년 기한 후 신청 기간은 6월 2일~12월 1일입니다. 기한 후 신청을 선택하면 예상 산정액의 95%를 반영합니다. 실제 적용 여부와 세부 금액은 심사 과정에서 달라질 수 있습니다.",
  },
  {
    question: "계산기가 모든 신청 제외 사유를 판정하나요?",
    answer:
      "아니요. 이 계산기는 입력한 소득·재산·가구유형 기준의 예상 계산 도구입니다. 국적, 다른 거주자의 부양자녀 해당 여부, 전문직 사업, 고소득 상용근로자 등 신청 제외 사유와 가구원·재산의 세부 평가는 국세청 자료로 별도 확인해야 합니다.",
  },
  {
    question: "자녀세액공제를 받았으면 어떻게 되나요?",
    answer:
      "자녀세액공제와 중복되는 경우 자녀장려금에서 차감될 수 있어 결과의 감액 사유에 안내합니다. 정확한 차감액은 실제 심사 자료를 확인해야 합니다.",
  },
  {
    question: "홈택스 계산해보기와 완전히 같은가요?",
    answer:
      "같은 공식 기준을 참고하지만 홈택스 모의계산이나 국세청 심사를 대체하지 않습니다. 이 계산기는 신청 전 자가진단과 예상 범위 확인에 초점을 둡니다.",
  },
];

export const workChildIncentiveSources: WorkChildIncentiveSource[] = [
  {
    organization: "국세청",
    title: "2026년 근로·자녀장려금 신청자격",
    criterion: "2025년 소득과 재산을 기준으로 한 가구 유형별 신청요건",
    href: "https://g.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7783&mi=2452",
  },
  {
    organization: "국세청",
    title: "2026년 근로·자녀장려금 신청기간 및 방법",
    criterion: "2025년 귀속 정기·기한 후 신청 기간과 2026년 반기신청 대상",
    href: "https://s.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=238977&mi=40397",
  },
  {
    organization: "국세청",
    title: "자녀장려금 소개",
    criterion: "부양자녀 18세 미만, 1인당 50만~100만원과 소득 기준",
    href: "https://j.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7782&mi=2451",
  },
  {
    organization: "국세청",
    title: "근로·자녀장려금 심사 및 지급",
    criterion: "재산·기한 후 신청 감액, 체납 충당과 지급기한",
    href: "https://s.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7784&mi=2453",
  },
  {
    organization: "국가법령정보센터",
    title: "조세특례제한법 근로·자녀장려금 산정식",
    criterion: "가구 유형과 총급여액 구간별 법정 산식",
    href: "https://www.law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1024326045",
  },
  {
    organization: "국세청 홈택스",
    title: "근로·자녀장려금 모의계산",
    criterion: "신청요건 입력과 예상액 안내 흐름",
    href: "https://hometax.go.kr/websquare/websquare.html?tm2lIdx=4501000000&tm3lIdx=4501080000&tmIdx=45&w2xPath=%2Fui%2Fpp%2Findex_pp.xml",
  },
];

export const workChildIncentiveWebApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "근로·자녀장려금 계산기",
  description:
    "근로장려금과 자녀장려금의 신청 가능성, 소득 기준, 재산 기준, 예상 지급액을 확인하는 계산기입니다. 예상 계산용이며 실제 지급 여부와 지급액은 국세청 심사 결과에 따라 달라질 수 있습니다.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  browserRequirements: "JavaScript가 지원되는 웹 브라우저",
};

export const workChildIncentiveBreadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "홈", item: "https://gyesanbox.kr/" },
    {
      "@type": "ListItem",
      position: 2,
      name: "계산기 목록",
      item: "https://gyesanbox.kr/calculators/",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "근로·자녀장려금 계산기",
      item: "https://gyesanbox.kr/calculators/work-child-incentive/",
    },
  ],
};

export const workChildIncentiveFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: workChildIncentiveFaqs.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
};
