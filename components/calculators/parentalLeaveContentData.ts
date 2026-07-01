import {
  calculateParentalLeaveBenefit,
  PARENTAL_LEAVE_POLICY_2026,
} from "@/lib/calculators/parental-leave/parentalLeave";
import { formatWon } from "./parentalLeaveClientUtils";

export interface ParentalLeaveFaq {
  question: string;
  answer: string;
}

export interface ParentalLeaveSource {
  organization: string;
  title: string;
  checkedAt: string;
  href: string;
  criterion: string;
}

export const parentalLeavePolicyCheckedAt = "2026-07-01";

export const parentalLeaveExcludedItems = [
  "부모 함께 육아휴직제 6+6 특례 계산",
  "한부모 육아휴직 특례 계산",
  "사후지급 또는 제도 변경 전후 복합 케이스",
  "사업장별 별도 수당과 회사 내부 규정",
  "고용보험 피보험 단위기간 충족 여부 판정",
  "육아휴직 분할 사용, 복직 여부, 고용센터 심사 결과 판정",
] as const;

export const parentalLeaveCriteriaRows = [
  {
    item: "월 통상임금",
    currentCalculatorBasis: "육아휴직 개시일 기준 월 통상임금을 입력값으로 사용합니다.",
    officialCheck: "임금명세서, 취업규칙, 고용보험 신청 자료 확인",
  },
  {
    item: "1~3개월",
    currentCalculatorBasis: "통상임금 100%, 월 상한 250만원, 하한 70만원을 적용합니다.",
    officialCheck: "고용24 육아휴직급여 안내와 시행령 제95조",
  },
  {
    item: "4~6개월",
    currentCalculatorBasis: "통상임금 100%, 월 상한 200만원, 하한 70만원을 적용합니다.",
    officialCheck: "고용24 육아휴직급여 안내와 시행령 제95조",
  },
  {
    item: "7~12개월",
    currentCalculatorBasis: "통상임금 80%, 월 상한 160만원, 하한 70만원을 적용합니다.",
    officialCheck: "고용24 육아휴직급여 안내와 시행령 제95조",
  },
] as const;

const exampleResponse = calculateParentalLeaveBenefit({
  monthlyOrdinaryWage: 3_000_000,
  leaveMonths: 12,
});

if (!exampleResponse.success) {
  throw new Error("육아휴직급여 계산 예시 입력이 현재 계산 정책을 통과하지 못했습니다.");
}

export const parentalLeaveExample = {
  input: [
    { label: "월 통상임금", value: formatWon(3_000_000) },
    { label: "육아휴직 사용 개월 수", value: "12개월" },
  ],
  result: [
    {
      label: "1~3개월",
      value: "각 2,500,000원",
    },
    {
      label: "4~6개월",
      value: "각 2,000,000원",
    },
    {
      label: "7~12개월",
      value: "각 1,600,000원",
    },
    {
      label: "총 예상 수령액",
      value: formatWon(exampleResponse.data.totalEstimatedAmount),
    },
  ],
} as const;

export const parentalLeaveFaqs: ParentalLeaveFaq[] = [
  {
    question: "육아휴직급여 계산 결과가 확정 지급액인가요?",
    answer:
      "아닙니다. 이 계산기는 2026년 7월 1일 기준 일반 육아휴직급여 구간을 적용한 참고용 예상값입니다. 실제 지급 여부와 금액은 고용보험 가입 기간, 신청 요건, 고용센터 심사 결과에 따라 달라질 수 있습니다.",
  },
  {
    question: "월 통상임금은 어떤 금액을 입력해야 하나요?",
    answer:
      "육아휴직 개시일 기준 통상임금에 가까운 월 금액을 입력합니다. 수당 포함 여부는 개인별 임금 구조와 회사 규정에 따라 달라질 수 있어 공식 신청 자료로 확인해야 합니다.",
  },
  {
    question: "부모 함께 육아휴직제 6+6도 계산되나요?",
    answer:
      "이번 1차 계산기에는 포함하지 않습니다. 6+6 특례는 별도 상한과 요건이 있어 일반 육아휴직급여 결과와 다를 수 있습니다.",
  },
  {
    question: "한부모 육아휴직 특례도 반영되나요?",
    answer:
      "반영하지 않습니다. 한부모 특례는 일반 계산과 다른 지급 기준이 적용될 수 있으므로 고용24 또는 고용센터에서 별도 확인해야 합니다.",
  },
  {
    question: "12개월을 넘는 육아휴직도 계산할 수 있나요?",
    answer:
      "이번 계산기는 1개월부터 12개월까지의 일반 육아휴직급여만 계산합니다. 12개월 초과, 분할 사용, 복합 제도 적용은 계산 범위에 포함하지 않습니다.",
  },
  {
    question: "하한액은 언제 적용되나요?",
    answer:
      "구간별 지급률을 적용한 월 급여가 70만원보다 낮으면 하한액 70만원을 예상 지급액으로 표시합니다.",
  },
  {
    question: "고용보험 가입 기간도 자동 판정하나요?",
    answer:
      "아니요. 이 계산기는 금액만 계산하며 피보험 단위기간, 신청 기한, 복직 여부, 심사 결과는 자동 판단하지 않습니다.",
  },
] as const;

export const parentalLeaveSources: ParentalLeaveSource[] = [
  {
    organization: "고용24",
    title: "육아휴직급여 정책/제도 안내",
    checkedAt: parentalLeavePolicyCheckedAt,
    href: "https://m.work24.go.kr/cm/c/f/1100/selecSystInfo.do?currentPageNo=1&recordCountPerPage=10&systClId=SC00000251&systId=SI00000402",
    criterion: "일반 육아휴직급여 지급률, 상한액, 특례 안내",
  },
  {
    organization: "국가법령정보센터",
    title: "고용보험법 시행령 제95조 육아휴직 급여",
    checkedAt: parentalLeavePolicyCheckedAt,
    href: "https://www.law.go.kr/lsLawLinkInfo.do?chrClsCd=010202&lsJoLnkSeq=1000954744",
    criterion: "월별 지급액, 상한액, 하한액 법령 기준",
  },
] as const;

export const parentalLeaveWebApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "육아휴직급여 계산기",
  description:
    "월 통상임금과 육아휴직 사용 개월 수로 일반 육아휴직급여의 월별 예상액과 총 예상 수령액을 계산하는 참고용 도구입니다.",
  url: "/calculators/parental-leave",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  browserRequirements: "JavaScript가 지원되는 웹 브라우저",
} as const;

export const parentalLeaveBreadcrumbJsonLd = {
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
      name: "육아휴직급여 계산기",
      item: "https://gyesanbox.kr/calculators/parental-leave",
    },
  ],
} as const;

export const parentalLeaveFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: parentalLeaveFaqs.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
} as const;

export const parentalLeaveBasisSummary =
  `계산 기준일은 ${PARENTAL_LEAVE_POLICY_2026.basisDate}입니다. 일반 육아휴직급여는 1~3개월 통상임금 100% 상한 ${formatWon(
    2_500_000,
  )}, 4~6개월 통상임금 100% 상한 ${formatWon(
    2_000_000,
  )}, 7~12개월 통상임금 80% 상한 ${formatWon(
    1_600_000,
  )}을 적용하고, 모든 구간에 월 하한 ${formatWon(700_000)}을 적용합니다.`;
