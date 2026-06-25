import { UNEMPLOYMENT_POLICY_2026 } from "@/lib/calculators/unemployment/policy";
import { calculateUnemploymentBenefit } from "@/lib/calculators/unemployment/unemployment";
import type { UnemploymentInput } from "@/lib/calculators/unemployment/types";

export interface UnemploymentTableRow {
  label: string;
  importance: string;
  calculatorCoverage: string;
  additionalCheck: string;
}

export interface UnemploymentCriteriaRow {
  item: string;
  currentCalculatorBasis: string;
  officialCheck: string;
}

export interface UnemploymentFaq {
  question: string;
  answer: string;
}

export interface UnemploymentSource {
  organization: string;
  title: string;
  checkedAt: string;
  href: string;
  criterion: string;
}

export interface UnemploymentRelatedCalculator {
  href: "/calculators/severance" | "/calculators/salary" | "/calculators/loan" | "/calculators/seller-margin";
  title: string;
  description: string;
}

const wonFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 0,
});

function formatWon(value: number): string {
  return `${wonFormatter.format(value)}원`;
}

function formatKoreanDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

export const unemploymentPolicyCheckedAt = "2026-06-25";
export const unemploymentUpperBasisDailyWage = 113_500;
export const unemploymentMinimumWage2026 = 10_320;
export const unemploymentStandardDailyHours = 8;
export const unemploymentMinimumWageBenefitRate = 80;

export const unemploymentExampleInput: UnemploymentInput = {
  wageInputType: "monthlyWage",
  wageAmount: 3_300_000,
  insuredMonths: 36,
  ageGroup: "under50",
  leavingReason: "involuntary",
};

const unemploymentExampleResponse =
  calculateUnemploymentBenefit(unemploymentExampleInput);

if (!unemploymentExampleResponse.success) {
  throw new Error("실업급여 계산 예시 입력이 현재 계산 정책을 통과하지 못했습니다.");
}

const unemploymentExampleResult = unemploymentExampleResponse.data;

export const unemploymentExampleInputItems = [
  { label: "임금 입력 방식", value: "월급 기준 간편 입력" },
  { label: "월급", value: formatWon(unemploymentExampleInput.wageAmount) },
  { label: "고용보험 가입기간", value: "36개월" },
  { label: "나이 구간", value: "50세 미만" },
  { label: "퇴직 사유", value: "비자발적 퇴사" },
] as const;

export const unemploymentExampleResultItems = [
  {
    label: "추정 1일 평균임금",
    value: formatWon(unemploymentExampleResult.estimatedAverageDailyWage),
  },
  {
    label: "계산 전 기준 급여액",
    value: formatWon(unemploymentExampleResult.baseDailyBenefit),
  },
  {
    label: "1일 예상 구직급여액",
    value: formatWon(unemploymentExampleResult.dailyBenefitAmount),
  },
  {
    label: "예상 소정급여일수",
    value: `${unemploymentExampleResult.prescribedBenefitDays}일`,
  },
  {
    label: "예상 총 지급액",
    value: formatWon(unemploymentExampleResult.estimatedTotalBenefit),
  },
] as const;

export const unemploymentInterpretationCards = [
  {
    title: "1일 구직급여액",
    description:
      "퇴직 전 평균임금 또는 입력한 1일 평균임금에 60%를 적용한 뒤, 2026년 공식 상한액과 하한액 범위로 조정한 하루 예상 금액입니다.",
  },
  {
    title: "상한액·하한액",
    description:
      "상한액은 급여기초 임금일액 상한 113,500원 × 60% = 68,100원, 하한액은 2026년 최저임금 10,320원 × 8시간 × 80% = 66,048원 기준입니다.",
  },
  {
    title: "소정급여일수",
    description:
      "고용보험 가입기간과 퇴직 당시 나이 구간에 따라 정해지는 예상 지급일수입니다. 실제 지급은 수급기간과 실업인정 절차의 영향을 받습니다.",
  },
  {
    title: "예상 총 지급액",
    description:
      "1일 예상 구직급여액에 예상 소정급여일수를 곱한 참고용 금액입니다. 이직확인서, 퇴직 사유와 고용센터 판단에 따라 실제 지급 여부와 시점은 달라질 수 있습니다.",
  },
] as const;

export const unemploymentChecklist = [
  "이직일 이전 기준기간의 피보험 단위기간이 180일 이상인지 확인합니다.",
  "회사에서 고용보험 피보험자격 상실 신고서와 이직확인서를 제출했는지 확인합니다.",
  "퇴직 사유가 수급자격 제한 사유에 해당하지 않는지 확인합니다.",
  "워크넷 또는 고용24 구직 등록과 수급자격 신청자 교육 절차를 확인합니다.",
  "실업인정일마다 재취업 활동을 증명할 준비가 되어 있는지 확인합니다.",
  "자발적 퇴사라면 정당한 이직 사유와 증빙 가능성을 고용센터에 확인합니다.",
] as const;

export const unemploymentExcludedItems = [
  "개별 사업장의 이직 사유 판단과 증빙 심사",
  "피보험 단위기간 180일의 일 단위 정밀 계산",
  "대기기간, 조기재취업수당, 취업촉진수당과 부정수급 판단",
  "실업인정일별 실제 지급일과 지급 보류 여부",
  "세부 법령 개정이나 고시 변경의 실시간 반영",
  "고용센터 심사 결과와 행정 처분 판단",
] as const;

export const unemploymentQuickCheckRows: UnemploymentTableRow[] = [
  {
    label: "피보험 단위기간",
    importance: "수급요건의 핵심 기준입니다.",
    calculatorCoverage: "가입 개월 수로 간단히 추정합니다.",
    additionalCheck: "180일 충족 여부는 공식 이력으로 확인 필요",
  },
  {
    label: "퇴직 사유",
    importance: "수급자격 제한 여부에 영향을 줍니다.",
    calculatorCoverage: "선택한 사유별 안내 상태를 표시합니다.",
    additionalCheck: "이직확인서와 증빙 확인 필요",
  },
  {
    label: "1일 평균임금",
    importance: "1일 구직급여액의 출발점입니다.",
    calculatorCoverage: "월급 ÷ 30 또는 직접 입력을 지원합니다.",
    additionalCheck: "퇴직 전 3개월 임금자료 확인 필요",
  },
  {
    label: "나이 구간",
    importance: "소정급여일수 표의 구간을 결정합니다.",
    calculatorCoverage: "50세 미만, 50세 이상 및 장애인 구간을 반영합니다.",
    additionalCheck: "이직 당시 기준 확인 필요",
  },
  {
    label: "실업인정",
    importance: "실제 지급이 이어지는 절차입니다.",
    calculatorCoverage: "금액 계산에는 직접 반영하지 않습니다.",
    additionalCheck: "고용센터 지정일과 재취업 활동 확인 필요",
  },
] as const;

export const unemploymentCriteriaRows: UnemploymentCriteriaRow[] = [
  {
    item: "1일 평균임금",
    currentCalculatorBasis: "월급 입력 시 30으로 나누어 추정하거나 직접 입력값을 사용합니다.",
    officialCheck: "퇴직 전 평균임금 자료로 재확인",
  },
  {
    item: "60% 계산",
    currentCalculatorBasis: "추정 1일 평균임금에 60%를 곱합니다.",
    officialCheck: "고용보험법 제46조 구직급여일액 산식",
  },
  {
    item: "상한액",
    currentCalculatorBasis: `급여기초 임금일액 상한 ${formatWon(unemploymentUpperBasisDailyWage)} × 60% = ${formatWon(UNEMPLOYMENT_POLICY_2026.dailyBenefitUpperLimit)}을 적용합니다.`,
    officialCheck: "고용노동부 상한액 인상 자료와 고용보험법 시행령 제68조",
  },
  {
    item: "하한액",
    currentCalculatorBasis: `2026년 최저임금 ${formatWon(unemploymentMinimumWage2026)} × ${unemploymentStandardDailyHours}시간 × ${unemploymentMinimumWageBenefitRate}% = ${formatWon(UNEMPLOYMENT_POLICY_2026.dailyBenefitLowerLimit)}을 적용합니다.`,
    officialCheck: "고용보험법 제45조·제46조와 2026년 최저임금 고시",
  },
  {
    item: "고용보험 가입기간",
    currentCalculatorBasis: "6개월 미만은 계산 제한으로 안내하고, 개월 수별 소정급여일수를 추정합니다.",
    officialCheck: "피보험 단위기간 180일과 수급 이력 확인",
  },
  {
    item: "나이 구간",
    currentCalculatorBasis: "50세 미만과 50세 이상 및 장애인 구간을 나눕니다.",
    officialCheck: "이직 당시 연령 기준 확인",
  },
  {
    item: "퇴직 사유",
    currentCalculatorBasis: "비자발, 계약만료, 권고사직, 자발, 예외 검토 등 안내 상태만 표시합니다.",
    officialCheck: "이직확인서와 고용센터 판단 확인",
  },
  {
    item: "이직확인서·실업인정",
    currentCalculatorBasis: "금액 산식에는 포함하지 않고 절차 안내로 제공합니다.",
    officialCheck: "고용24 민원현황과 실업인정 절차 확인",
  },
] as const;

export const unemploymentFaqs: UnemploymentFaq[] = [
  {
    question: "실업급여 계산기는 실제 지급액과 같은가요?",
    answer:
      "아닙니다. 이 계산기는 입력값과 현재 계산기 적용 기준으로 예상 금액을 보여주는 참고용 도구입니다. 실제 지급 여부와 금액은 고용보험 이력, 퇴직 사유, 이직확인서와 실업인정 절차에 따라 달라질 수 있습니다.",
  },
  {
    question: "월급만 알아도 실업급여를 계산할 수 있나요?",
    answer:
      "간편 추정은 가능합니다. 다만 월급 기준은 월급을 30으로 나누어 1일 평균임금을 추정하므로, 퇴직 전 3개월 평균임금을 알고 있다면 1일 평균임금 직접 입력이 더 적합합니다.",
  },
  {
    question: "상한액과 하한액은 왜 적용되나요?",
    answer:
      "구직급여일액은 평균임금의 일정 비율로 계산되지만 일 단위 한도 범위 안에서 조정됩니다. 2026년 기준 상한액은 급여기초 임금일액 상한 113,500원에 60%를 곱한 68,100원이고, 하한액은 최저임금 10,320원에 8시간과 80%를 곱한 66,048원입니다.",
  },
  {
    question: "고용보험 가입기간이 6개월이면 바로 받을 수 있나요?",
    answer:
      "개월 수만으로 단정할 수 없습니다. 법령상 피보험 단위기간 180일 이상 등 여러 요건이 함께 필요하며, 실제 이력과 기준기간은 고용보험 또는 고용센터에서 확인해야 합니다.",
  },
  {
    question: "자발적 퇴사도 실업급여를 받을 수 있나요?",
    answer:
      "자발적 퇴사는 일반적으로 제한될 수 있습니다. 다만 임금체불, 질병, 통근 곤란 등 정당한 이직 사유가 인정될 가능성이 있는 경우에는 객관적 증빙을 갖추어 고용센터 확인을 받아야 합니다.",
  },
  {
    question: "계약만료와 권고사직은 어떻게 보나요?",
    answer:
      "계약만료와 권고사직은 비자발적 이직으로 검토될 수 있지만, 이직확인서에 적힌 사유와 실제 경위가 중요합니다. 계산기는 금액을 추정할 뿐 사유 판단을 대신하지 않습니다.",
  },
  {
    question: "이직확인서가 처리되지 않으면 어떻게 되나요?",
    answer:
      "수급자격 심사에 필요한 퇴직 사실과 이직 사유 확인이 늦어질 수 있습니다. 고용24 민원현황 또는 회사 담당자를 통해 처리 여부를 확인하는 것이 좋습니다.",
  },
  {
    question: "실업인정은 계산 결과와 어떤 관계가 있나요?",
    answer:
      "계산 결과는 예상 금액과 일수를 보여주지만, 실제 지급이 이어지려면 지정된 실업인정일마다 재취업 활동 등 요건을 확인받아야 합니다.",
  },
] as const;

export const unemploymentSources: UnemploymentSource[] = [
  {
    organization: "고용24",
    title: "실업급여(상용직) 정책/제도 안내",
    checkedAt: unemploymentPolicyCheckedAt,
    href: "https://m.work24.go.kr/cm/c/f/1100/selecSystInfo.do?systClId=SC00000254&systCnntId=&systId=SI00000411",
    criterion: "신청 절차, 이직확인서, 실업인정 흐름",
  },
  {
    organization: "고용노동부",
    title: "고용보험법 시행령 등 일부개정령안 국무회의 심의",
    checkedAt: unemploymentPolicyCheckedAt,
    href: "https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=18736",
    criterion: "2026년 구직급여 상한액 68,100원 인상과 급여기초 임금일액 상한 113,500원",
  },
  {
    organization: "국가법령정보센터",
    title: "고용보험법 제45조 급여의 기초가 되는 임금일액",
    checkedAt: unemploymentPolicyCheckedAt,
    href: "https://www.law.go.kr/LSW//lsLawLinkInfo.do?chrClsCd=010202&lsId=001761&lsJoLnkSeq=1000770542&print=print",
    criterion: "기초일액 산정, 최저기초일액, 대통령령 상한 근거",
  },
  {
    organization: "국가법령정보센터",
    title: "고용보험법 제46조 구직급여일액",
    checkedAt: unemploymentPolicyCheckedAt,
    href: "https://www.law.go.kr/LSW//lsLawLinkInfo.do?chrClsCd=010202&lsId=001761&lsJoLnkSeq=1000770549&print=print",
    criterion: "기초일액 60%와 최저기초일액 80% 산식",
  },
  {
    organization: "국가법령정보센터",
    title: "고용보험법 시행령 제68조 급여기초 임금일액의 상한액",
    checkedAt: unemploymentPolicyCheckedAt,
    href: "https://www.law.go.kr/lsLinkProc.do?chrClsCd=010202&datClsCd=010102&gubun=admRul&joNo=006800000&lsId=41988&lsNm=%EA%B3%A0%EC%9A%A9%EB%B3%B4%ED%97%98%EB%B2%95%EC%8B%9C%ED%96%89%EB%A0%B9&mode=10",
    criterion: "급여기초 임금일액 상한 113,500원",
  },
  {
    organization: "국가법령정보센터",
    title: "고용보험법 제40조 구직급여의 수급 요건",
    checkedAt: unemploymentPolicyCheckedAt,
    href: "https://www.law.go.kr/lsLawLinkInfo.do?chrClsCd=010202&lsJoLnkSeq=900111129",
    criterion: "피보험 단위기간 180일, 재취업 노력, 이직 사유 요건",
  },
  {
    organization: "고용노동부",
    title: "2026년 적용 최저임금 고시",
    checkedAt: unemploymentPolicyCheckedAt,
    href: "https://www.moel.go.kr/info/lawinfo/instruction/view.do?bbs_seq=20250800121",
    criterion: "2026년 시간급 최저임금 고시 확인",
  },
  {
    organization: "최저임금위원회",
    title: "2026년 적용 최저임금 고시",
    checkedAt: unemploymentPolicyCheckedAt,
    href: "https://www.minimumwage.go.kr/customer/notice/view.do?bultnId=4657",
    criterion: "2026년 시간급 10,320원 안내",
  },
] as const;

export const unemploymentRelatedCalculators: UnemploymentRelatedCalculator[] = [
  {
    href: "/calculators/severance",
    title: "퇴직금 계산기",
    description: "입사일과 퇴직 전 임금으로 예상 퇴직금을 계산합니다.",
  },
  {
    href: "/calculators/salary",
    title: "연봉·월급 실수령액 계산기",
    description: "4대보험과 간이세액표 기준 실수령액을 확인합니다.",
  },
  {
    href: "/calculators/loan",
    title: "대출이자 계산기",
    description: "상환방식별 월 납입액과 총이자를 비교합니다.",
  },
  {
    href: "/calculators/seller-margin",
    title: "판매자 마진 계산기",
    description: "판매가, 원가, 수수료 기준 순이익과 마진율을 계산합니다.",
  },
] as const;

export const unemploymentWebApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "실업급여 계산기",
  description:
    "월급 또는 1일 평균임금으로 구직급여 상한액·하한액 적용 여부, 수급기간과 예상 총액을 계산하는 참고용 도구입니다.",
  url: "/calculators/unemployment",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  browserRequirements: "JavaScript가 지원되는 웹 브라우저",
} as const;

export const unemploymentBreadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "홈", item: "/" },
    { "@type": "ListItem", position: 2, name: "계산기", item: "/calculators" },
    {
      "@type": "ListItem",
      position: 3,
      name: "실업급여 계산기",
      item: "/calculators/unemployment",
    },
  ],
} as const;

export const unemploymentFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: unemploymentFaqs.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
} as const;

export const unemploymentBasisSummary =
  `현재 계산기 기준일은 ${formatKoreanDate(
    UNEMPLOYMENT_POLICY_2026.basisDate,
  )}이며, 2026년 공식 기준인 상한액 ${formatWon(
    UNEMPLOYMENT_POLICY_2026.dailyBenefitUpperLimit,
  )}, 하한액 ${formatWon(
    UNEMPLOYMENT_POLICY_2026.dailyBenefitLowerLimit,
  )}을 계산 상수로 사용합니다. 상한액 산식은 ${formatWon(
    unemploymentUpperBasisDailyWage,
  )} × 60% = ${formatWon(
    UNEMPLOYMENT_POLICY_2026.dailyBenefitUpperLimit,
  )}, 하한액 산식은 ${formatWon(
    unemploymentMinimumWage2026,
  )} × ${unemploymentStandardDailyHours}시간 × ${unemploymentMinimumWageBenefitRate}% = ${formatWon(
    UNEMPLOYMENT_POLICY_2026.dailyBenefitLowerLimit,
  )}입니다.`;
