import { calculateSocialInsurance } from "@/lib/calculators/social-insurance/calculate";
import { SOCIAL_INSURANCE_POLICY_2026 } from "@/lib/calculators/social-insurance/constants";
import type { SocialInsuranceInput } from "@/lib/calculators/social-insurance/types";

export interface SocialInsuranceContentItem {
  label: string;
  value: string;
}

export interface SocialInsuranceFaq {
  question: string;
  answer: string;
}

export interface SocialInsuranceSource {
  organization: string;
  title: string;
  criterion: string;
  href: string;
}

function formatWon(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

function formatKoreanDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

function assertExample(input: SocialInsuranceInput) {
  const response = calculateSocialInsurance(input);

  if (!response.success) {
    throw new Error("4대보험 계산 예시 입력이 현재 계산 정책을 통과하지 못했습니다.");
  }

  return response.data;
}

const examples = [
  {
    title: "월 급여 300만원, 비과세 20만원",
    input: { monthlySalary: 3_000_000, nonTaxableAmount: 200_000 },
  },
  {
    title: "월 급여 250만원, 비과세 0원",
    input: { monthlySalary: 2_500_000, nonTaxableAmount: 0 },
  },
  {
    title: "국민연금 하한 적용",
    input: { monthlySalary: 300_000, nonTaxableAmount: 0 },
  },
  {
    title: "국민연금 상한 적용",
    input: { monthlySalary: 8_000_000, nonTaxableAmount: 0 },
  },
] as const;

export const socialInsuranceExamples = examples.map(({ title, input }) => {
  const result = assertExample(input);

  return {
    title,
    inputItems: [
      { label: "월 급여", value: formatWon(input.monthlySalary) },
      { label: "비과세 금액", value: formatWon(input.nonTaxableAmount) },
      { label: "과세기준급여", value: formatWon(result.taxableMonthlyPay) },
    ],
    resultItems: [
      { label: "국민연금", value: formatWon(result.employeePension) },
      { label: "건강보험", value: formatWon(result.employeeHealthInsurance) },
      { label: "장기요양보험", value: formatWon(result.employeeLongTermCare) },
      { label: "고용보험", value: formatWon(result.employeeEmploymentInsurance) },
      { label: "총 공제액", value: formatWon(result.totalEmployeeContribution) },
      {
        label: "공제 후 참고 금액",
        value: formatWon(result.afterContributionAmount),
      },
    ],
  };
});

const policy = SOCIAL_INSURANCE_POLICY_2026;

export const socialInsuranceCriteria = [
  {
    title: "과세기준급여",
    description:
      "월 급여에서 비과세 금액을 뺀 금액입니다. 4대보험 예상 공제액은 이 과세기준급여를 기준으로 계산합니다.",
  },
  {
    title: "국민연금",
    description: `근로자 부담률 ${policy.nationalPension.employeeRate * 100}%를 적용합니다. 신고 소득월액은 1,000원 미만을 버린 뒤 기준소득월액 ${formatWon(policy.nationalPension.standardMonthlyIncomeMinimum)}~${formatWon(policy.nationalPension.standardMonthlyIncomeMaximum)} 범위를 적용하고, 근로자 부담액은 10원 미만을 버립니다. 적용 기간은 ${formatKoreanDate(policy.nationalPension.effectiveFrom)}부터 ${formatKoreanDate(policy.nationalPension.effectiveTo)}까지입니다.`,
  },
  {
    title: "건강보험",
    description: `2026년 직장가입자 총 보험료율 ${policy.healthInsurance.totalRate * 100}% 중 근로자 부담분 ${policy.healthInsurance.employeeRate * 100}%를 과세기준급여에 적용합니다.`,
  },
  {
    title: "장기요양보험",
    description: `장기요양보험료는 건강보험료와 별도로 표시되는 공제이며, 본 계산기는 근로자 건강보험료 × ${policy.longTermCareInsurance.healthInsuranceRate * 100}% 방식으로 계산합니다.`,
  },
  {
    title: "고용보험",
    description: `실업급여 계정 근로자 부담률 ${policy.employmentInsurance.unemploymentBenefitEmployeeRate * 100}%를 적용합니다. 고용안정·직업능력개발 계정은 사업주 부담이므로 근로자 공제액에는 넣지 않습니다.`,
  },
  {
    title: "산재보험",
    description: policy.industrialAccidentInsurance.note,
  },
] as const;

export const socialInsuranceExceptions = [
  "건강보험 정산분과 장기요양보험 정산분",
  "국민연금 기준소득월액 신고액과 실제 월급의 차이",
  "비과세 항목 인정 범위와 회사 처리 방식의 차이",
  "입사일·퇴사일·휴직 등으로 인한 월 중도 적용",
  "고용보험 적용 제외 또는 특수 유형",
  "산재보험 업종별 요율과 사업장별 처리",
  "소득세와 지방소득세 등 이번 계산 범위 밖의 공제",
] as const;

export const socialInsuranceFaqs: SocialInsuranceFaq[] = [
  {
    question: "4대보험 계산기는 세전 월급 기준인가요?",
    answer:
      "네. 세전 월 급여를 입력하고, 매월 적용되는 비과세 금액이 있다면 따로 입력해 과세기준급여를 계산합니다.",
  },
  {
    question: "비과세 금액을 빼고 계산해야 하나요?",
    answer:
      "네. 본 계산기는 월 급여에서 비과세 금액을 뺀 과세기준급여를 보험료 계산 기준으로 사용합니다.",
  },
  {
    question: "국민연금은 왜 월급 전체로 계산되지 않나요?",
    answer:
      "국민연금은 기준소득월액 하한과 상한이 있습니다. 2026년 7월 7일 확인 기준으로 410,000원보다 낮으면 410,000원, 6,590,000원보다 높으면 6,590,000원을 기준으로 계산합니다.",
  },
  {
    question: "건강보험료와 장기요양보험료는 어떻게 다른가요?",
    answer:
      "건강보험료는 과세기준급여에 건강보험 근로자 부담률을 곱한 금액이고, 장기요양보험료는 산출된 건강보험료에 장기요양보험료율을 다시 곱한 금액입니다.",
  },
  {
    question: "장기요양보험료는 왜 건강보험료에 다시 곱하나요?",
    answer:
      "장기요양보험료는 건강보험료를 기준으로 부과되는 별도 보험료입니다. 그래서 화면과 계산식 모두 건강보험료 × 13.14% 방식으로 표시합니다.",
  },
  {
    question: "고용보험은 근로자와 회사가 똑같이 내나요?",
    answer:
      "실업급여 계정은 근로자와 사업주가 각각 0.9%를 부담합니다. 다만 고용안정·직업능력개발 계정은 사업주만 부담하므로 이 계산기의 근로자 공제액에는 포함하지 않습니다.",
  },
  {
    question: "산재보험은 왜 계산하지 않나요?",
    answer:
      "산재보험은 근로자 급여 공제 항목이 아니며 업종별 사업주 부담 보험료라 본 계산기에서는 자동 계산하지 않습니다.",
  },
  {
    question: "급여명세서와 계산 결과가 다른 이유는 무엇인가요?",
    answer:
      "회사 신고 보수월액, 비과세 처리, 건강보험 정산, 입퇴사일, 적용 제외 여부, 사업장 처리 방식에 따라 실제 공제액은 달라질 수 있습니다.",
  },
  {
    question: "연봉 실수령액 계산기와 어떤 차이가 있나요?",
    answer:
      "이 계산기는 월급 기준 4대보험 근로자 부담액만 빠르게 확인합니다. 연봉 실수령액 계산기는 소득세와 지방소득세까지 포함해 월 실수령액을 추정합니다.",
  },
];

export const socialInsuranceSources: SocialInsuranceSource[] = [
  {
    organization: "국민연금공단",
    title: "2026년도 국민연금 기준소득월액 상·하한액 조정 안내",
    criterion: "국민연금 보험료율, 기준소득월액 하한·상한과 적용 기간",
    href: "https://www.nps.or.kr/pnsgdnc/newgdnc/getOHAE0001M1.do?pstId=ZZ202600000000000147",
  },
  {
    organization: "국민건강보험공단",
    title: "2026년도 보험료율 인상 안내",
    criterion: "2026년 건강보험료율과 장기요양보험료 산정 기준",
    href: "https://edi.nhis.or.kr/portal/images/popup/20251204_pop01longdesc.html",
  },
  {
    organization: "고용노동부",
    title: "고용보험기금 소개",
    criterion: "실업급여 계정 근로자 부담 기준",
    href: "https://www.moel.go.kr/info/astmgmt/employ/employList.do",
  },
  {
    organization: "고용노동부",
    title: "2026년도 사업종류별 산재보험료율",
    criterion: "산재보험 업종별 사업주 부담 기준",
    href: "https://www.moel.go.kr/info/lawinfo/instruction/view.do?bbs_seq=20251201757",
  },
];

export const socialInsuranceWebApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "2026 4대보험 계산기",
  description:
    "2026년 기준 국민연금, 건강보험, 장기요양보험, 고용보험 근로자 부담 공제액을 월급과 비과세 금액으로 계산합니다.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  browserRequirements: "JavaScript가 지원되는 웹 브라우저",
};

export const socialInsuranceBreadcrumbJsonLd = {
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
      name: "2026 4대보험 계산기",
      item: "https://gyesanbox.kr/calculators/social-insurance/",
    },
  ],
};

export const socialInsuranceFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: socialInsuranceFaqs.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
};
