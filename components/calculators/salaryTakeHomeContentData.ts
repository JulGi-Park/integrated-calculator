import { calculateSalaryTakeHome } from "@/lib/calculators/salary-take-home/salary-take-home";
import { SALARY_TAKE_HOME_POLICY_2026 } from "@/lib/calculators/salary-take-home/policy";
import type { SalaryTakeHomeInput } from "@/lib/calculators/salary-take-home/types";

export interface SalaryTakeHomeContentItem {
  label: string;
  value: string;
}

export interface SalaryTakeHomeFaq {
  question: string;
  answer: string;
}

export interface SalaryTakeHomeSource {
  organization: string;
  title: string;
  criterion: string;
  href: string;
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

function formatPercentFromBasisPoints(value: number): string {
  return `${value / 100}%`;
}

export const salaryTakeHomeExampleInput: SalaryTakeHomeInput = {
  annualSalary: 50_000_000,
  monthlyNonTaxableAmount: 200_000,
  dependentCount: 1,
  childCount: 0,
};

const salaryTakeHomeExampleResponse = calculateSalaryTakeHome(
  salaryTakeHomeExampleInput,
);

if (!salaryTakeHomeExampleResponse.success) {
  throw new Error("연봉 계산 예시 입력이 현재 계산 정책을 통과하지 못했습니다.");
}

export const salaryTakeHomeExampleInputItems: SalaryTakeHomeContentItem[] = [
  { label: "연봉", value: formatWon(salaryTakeHomeExampleInput.annualSalary) },
  {
    label: "월 비과세액",
    value: formatWon(salaryTakeHomeExampleInput.monthlyNonTaxableAmount),
  },
  {
    label: "공제대상 가족 수",
    value: `${salaryTakeHomeExampleInput.dependentCount}명`,
  },
  {
    label: "간이세액표상 자녀 수",
    value: `${salaryTakeHomeExampleInput.childCount}명`,
  },
];

const exampleResult = salaryTakeHomeExampleResponse.data;

export const salaryTakeHomeExampleResultItems: SalaryTakeHomeContentItem[] = [
  { label: "월 급여", value: formatWon(exampleResult.monthlyGrossSalary) },
  {
    label: "월 비과세액",
    value: formatWon(salaryTakeHomeExampleInput.monthlyNonTaxableAmount),
  },
  {
    label: "월 과세 급여",
    value: formatWon(exampleResult.monthlyTaxableSalary),
  },
  { label: "국민연금", value: formatWon(exampleResult.nationalPension) },
  { label: "건강보험", value: formatWon(exampleResult.healthInsurance) },
  {
    label: "장기요양보험",
    value: formatWon(exampleResult.longTermCareInsurance),
  },
  {
    label: "고용보험",
    value: formatWon(exampleResult.employmentInsurance),
  },
  { label: "소득세", value: formatWon(exampleResult.incomeTax) },
  { label: "지방소득세", value: formatWon(exampleResult.localIncomeTax) },
  {
    label: "월 공제 합계",
    value: formatWon(exampleResult.totalMonthlyDeductions),
  },
  {
    label: "월 예상 실수령액",
    value: formatWon(exampleResult.estimatedMonthlyTakeHome),
  },
  {
    label: "연간 예상 실수령액",
    value: formatWon(exampleResult.estimatedAnnualTakeHome),
  },
];

const policy = SALARY_TAKE_HOME_POLICY_2026;
const employeeHealthInsuranceRate =
  policy.healthInsurance.totalRateBasisPoints /
  policy.healthInsurance.employeeShareDenominator;

export const salaryTakeHomeCalculationCriteria = [
  {
    title: "월 급여",
    description:
      "퇴직금을 제외한 연봉을 12개월로 나누고, 원 미만이 생기면 버립니다.",
  },
  {
    title: "월 과세 급여",
    description:
      "월 급여에서 입력한 월 비과세액을 차감합니다. 이 값은 보험료와 소득세 계산의 기초가 되며, 국민연금에는 별도의 기준소득월액 상·하한과 1,000원 단위 처리가 적용됩니다.",
  },
  {
    title: "국민연금",
    description: `사업장가입자 근로자 부담률 ${formatPercentFromBasisPoints(policy.nationalPension.employeeRateBasisPoints)}를 적용합니다. 기준소득월액은 1,000원 미만을 버린 뒤 ${formatWon(policy.nationalPension.standardMonthlyIncomeMinimum)}~${formatWon(policy.nationalPension.standardMonthlyIncomeMaximum)} 범위로 제한하고 보험료의 10원 미만을 버립니다.`,
  },
  {
    title: "건강보험",
    description: `직장가입자 총 보험료율 ${formatPercentFromBasisPoints(policy.healthInsurance.totalRateBasisPoints)}의 절반인 근로자 부담분 ${formatPercentFromBasisPoints(employeeHealthInsuranceRate)}를 월 과세 급여에 적용하고 원 미만을 버립니다.`,
  },
  {
    title: "장기요양보험",
    description: `건강보험과 구분되는 공제입니다. 근로자 건강보험료 × 소득 대비 장기요양보험료율 0.9448% ÷ 건강보험료율 7.19%로 계산하고 원 미만을 버립니다.`,
  },
  {
    title: "고용보험",
    description: `월 과세 급여에 근로자 부담률 ${formatPercentFromBasisPoints(policy.employmentInsurance.employeeRateBasisPoints)}를 적용하고 원 미만을 버립니다. 사업주 부담분과 산재보험은 제외합니다.`,
  },
  {
    title: "근로소득세",
    description: `${formatKoreanDate(policy.incomeTax.tableEffectiveFrom)} 개정 근로소득 간이세액표에서 월 과세 급여, 본인을 포함한 공제대상 가족 수, 간이세액표상 자녀 수를 반영한 100% 원천징수 기준 금액을 계산하고 10원 미만을 버립니다.`,
  },
  {
    title: "지방소득세",
    description: `산출된 소득세의 ${policy.localIncomeTax.percentageOfIncomeTax}%를 계산하고 10원 미만을 버립니다.`,
  },
  {
    title: "월 공제 합계",
    description:
      "국민연금, 건강보험, 장기요양보험, 고용보험, 소득세, 지방소득세의 합계입니다.",
  },
  {
    title: "월 예상 실수령액",
    description: "월 급여에서 월 공제 합계를 차감한 예상 금액입니다.",
  },
  {
    title: "연간 예상 실수령액",
    description:
      "월 예상 실수령액을 12배한 값입니다. 월별 상여나 변동 급여를 반영한 실제 연간 지급액은 아닙니다.",
  },
] as const;

export const salaryTakeHomeExclusions = [
  "퇴직금",
  "비정기 상여금",
  "성과급",
  "연장·야간·휴일근로수당",
  "회사별 추가 공제",
  "노조비",
  "회사가 별도 공제하는 식대",
  "사내대출 상환",
  "연말정산 환급·추가 납부",
  "중도 입사·퇴사",
  "휴직",
  "월별 급여 변동",
  "일용근로자",
  "사업소득자·프리랜서",
  "보험료 감면",
  "두루누리 등 보험료 지원",
  "특수한 가입 상태",
  "실제 신고 보수월액과 입력값의 차이",
  "회사별 원천징수 선택 비율 차이",
] as const;

export const salaryTakeHomeFaqs: SalaryTakeHomeFaq[] = [
  {
    question: "연봉에 퇴직금이 포함되나요?",
    answer:
      "현재 계산기는 퇴직금을 제외한 연봉을 기준으로 합니다. 제시받은 연봉에 퇴직금이 포함돼 있다면 퇴직금을 제외한 세전 연봉을 입력해 주세요.",
  },
  {
    question: "공제대상 가족 수에는 본인도 포함하나요?",
    answer:
      "네. 공제대상 가족 수에는 근로자 본인을 포함합니다. 기본값 1명은 공제대상 가족이 본인만 있는 경우입니다.",
  },
  {
    question: "자녀 수는 어떤 기준으로 입력하나요?",
    answer:
      "간이세액표상 자녀 수는 공제대상 가족 중 8세 이상 20세 이하이며 관련 소득 요건을 충족하는 자녀 수입니다. 모든 미성년 자녀 수를 그대로 입력하는 항목은 아닙니다.",
  },
  {
    question: "비과세액은 얼마를 입력해야 하나요?",
    answer:
      "매월 급여에 실제 포함되는 비과세 금액을 입력합니다. 적용 금액은 근로자마다 다를 수 있으므로 회사 급여명세서나 근로계약서를 확인해 주세요.",
  },
  {
    question: "실제 급여명세서와 결과가 다른 이유는 무엇인가요?",
    answer:
      "실제 신고 보수월액, 회사별 급여 처리, 상여금과 변동 수당, 추가 공제, 보험료 정산, 원천징수 방식, 개인별 감면과 지원에 따라 차이가 생길 수 있습니다.",
  },
  {
    question: "상여금과 성과급도 계산되나요?",
    answer:
      "아니요. 이번 계산은 입력한 연봉을 12개월로 나눈 일반 월 급여를 기준으로 하며 비정기 상여금과 성과급은 별도로 반영하지 않습니다.",
  },
  {
    question: "국민연금 상한을 넘는 연봉은 어떻게 계산되나요?",
    answer: `국민연금은 월 소득 전체에 계속 비례하지 않고 현재 적용 중인 기준소득월액 상한 ${formatWon(policy.nationalPension.standardMonthlyIncomeMaximum)}까지만 산정 기준에 반영합니다. 이 상한은 ${formatKoreanDate(policy.nationalPension.ceilingEffectiveFrom)}부터 ${formatKoreanDate(policy.nationalPension.ceilingEffectiveTo)}까지의 기준입니다.`,
  },
  {
    question: "2026년 7월 국민연금 기준이 변경되면 자동 반영되나요?",
    answer: `자동 반영되지 않습니다. 현재 계산기는 ${formatKoreanDate(policy.verifiedAt)}에 확인한 기준과 ${formatKoreanDate(policy.nationalPension.ceilingEffectiveTo)}까지 적용되는 상·하한을 사용합니다. ${formatKoreanDate("2026-07-01")} 이후에는 공식 기준을 다시 확인해 코드와 정책 데이터를 갱신해야 합니다.`,
  },
];

export const salaryTakeHomeSources: SalaryTakeHomeSource[] = [
  {
    organization: "국민연금공단",
    title: "2026년 보험료율 안내",
    criterion: "국민연금 보험료율과 근로자 부담률",
    href: "https://www.nps.or.kr/pnsgdnc/nscvrgdata/getOHAE0002M1.do?menuId=MN24000898&pstId=ZZ202500000000001465",
  },
  {
    organization: "국민연금공단",
    title: "2025년 7월 기준소득월액 상·하한 반영 자료",
    criterion: "현재 적용 중인 기준소득월액 상한·하한과 적용 기간",
    href: "https://www.nps.or.kr/pnsinfo/databbs/getOHAF0272M1Detail.do?menuId=MN24001000&pstId=ZZ202500000000000352",
  },
  {
    organization: "국민건강보험공단",
    title: "직장보험료 부과·산정",
    criterion: "건강보험과 장기요양보험 산정 기준",
    href: "https://www.nhis.or.kr/nhis/minwon/wbhapa01000m01.do?mode=view&articleNo=10946883",
  },
  {
    organization: "국가법령정보센터",
    title: "고용보험 및 산업재해보상보험의 보험료징수 등에 관한 법률 시행령",
    criterion: "고용보험 근로자 부담 기준과 산재보험 제외",
    href: "https://www.law.go.kr/법령/고용보험및산업재해보상보험의보험료징수등에관한법률시행령",
  },
  {
    organization: "국세청",
    title: "근로소득 간이세액표 안내",
    criterion: "2026년 근로소득 간이세액표와 가족·자녀 기준",
    href: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=2226&cntntsId=7669",
  },
  {
    organization: "국가법령정보센터",
    title: "소득세법 시행령 별표 2",
    criterion: "근로소득 간이세액표 법적 근거",
    href: "https://www.law.go.kr/법령/소득세법시행령",
  },
  {
    organization: "국가법령정보센터",
    title: "지방세법",
    criterion: "지방소득세 계산 기준",
    href: "https://www.law.go.kr/법령/지방세법",
  },
];

export const salaryTakeHomeWebApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "연봉 실수령액 계산기",
  description:
    "연봉과 비과세액, 공제대상 가족 수를 입력해 2026년 국민연금·건강보험·고용보험·소득세를 반영한 월급 실수령액을 계산합니다.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  browserRequirements: "JavaScript가 지원되는 웹 브라우저",
};

export const salaryTakeHomeBreadcrumbJsonLd = {
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
      name: "연봉 실수령액 계산기",
      item: "https://gyesanbox.kr/calculators/salary",
    },
  ],
};

export const salaryTakeHomeFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: salaryTakeHomeFaqs.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
};
