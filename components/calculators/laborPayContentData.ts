export const laborPayBaseDate = "2026-07-10";
export const laborPayMinimumWageText = "2026년 최저임금 시간급 10,320원";

export const laborPayOfficialSources = [
  {
    organization: "국가법령정보센터",
    title: "근로기준법 제55조(휴일)",
    url: "https://www.law.go.kr/lsLinkCommonInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1015677471",
    supports: "1주 평균 1회 이상의 유급휴일 보장 기준",
  },
  {
    organization: "국가법령정보센터",
    title: "근로기준법 시행령 제30조(휴일)",
    url: "https://www.law.go.kr/LSW//lsLinkCommonInfo.do?chrClsCd=010202&lspttninfSeq=148916",
    supports: "1주 동안의 소정근로일 개근 요건",
  },
  {
    organization: "고용노동부 고객상담센터",
    title: "주휴수당 지급기준",
    url: "https://1350.moel.go.kr/rtmview.do?id=1000059852",
    supports: "4주 평균 1주 소정근로시간 15시간 이상과 개근 요건",
  },
  {
    organization: "고용노동부",
    title: "2026년 적용 최저임금 고시",
    url: "https://www.moel.go.kr/info/lawinfo/instruction/view.do?bbs_seq=20250800121",
    supports: "2026년 적용 최저임금액 고시",
  },
  {
    organization: "최저임금위원회",
    title: "연도별 최저임금 결정현황",
    url: "https://www.minimumwage.go.kr/minWage/policy/decisionMain.do",
    supports: "2026년 시간급 10,320원, 8시간 일급 82,560원, 209시간 월 환산액 2,156,880원",
  },
] as const;

export const laborPayFormulas = [
  {
    title: "주휴시간",
    formula: "1주 소정근로시간 / 40 × 8, 최대 8시간",
  },
  {
    title: "주휴수당",
    formula: "주휴시간 × 시급",
  },
  {
    title: "기본 근로수당",
    formula: "1주 실제 근로시간 × 시급",
  },
  {
    title: "주휴 포함 예상 주급",
    formula: "기본 근로수당 + 주휴수당",
  },
] as const;

export const laborPayExampleInput = [
  { label: "시급", value: "10,320원" },
  { label: "1주 소정근로시간", value: "20시간" },
  { label: "1주 실제 근로시간", value: "20시간" },
  { label: "개근 여부", value: "개근" },
] as const;

export const laborPayExampleResult = [
  { label: "예상 주휴시간", value: "4시간" },
  { label: "예상 주휴수당", value: "41,280원" },
  { label: "주휴 포함 예상 주급", value: "247,680원" },
] as const;

export const laborPayExclusions = [
  "근로자성, 근로계약 형태, 휴일 대체, 결근·지각·조퇴 처리 기준",
  "퇴사하는 주, 교대근무, 단시간 근로자의 실제 사업장 운영 기준",
  "세금·4대보험 공제, 연장·야간·휴일근로수당, 이미 지급된 고정수당",
] as const;

export const laborPayFaqs = [
  {
    question: "주휴수당은 주 15시간만 넘으면 무조건 받을 수 있나요?",
    answer:
      "아닙니다. 4주 평균 1주 소정근로시간이 15시간 이상이고, 소정근로일을 개근했는지 등을 함께 봐야 합니다.",
  },
  {
    question: "결근하면 주휴수당을 받을 수 없나요?",
    answer:
      "소정근로일을 개근하지 않은 주는 주휴수당 대상이 아닐 수 있습니다. 결근 사유와 사업장 기준을 함께 확인해야 합니다.",
  },
  {
    question: "지각이나 조퇴가 있으면 어떻게 되나요?",
    answer:
      "지각·조퇴만으로 항상 제외된다고 단정할 수는 없습니다. 근로계약, 취업규칙, 실제 임금 산정 방식을 확인해야 합니다.",
  },
  {
    question: "주휴수당 계산식은 어떻게 되나요?",
    answer:
      "기본식은 주휴시간 = 1주 소정근로시간 / 40 × 8, 주휴수당 = 주휴시간 × 시급입니다. 계산기는 주휴시간을 최대 8시간으로 제한합니다.",
  },
  {
    question: "알바도 주휴수당을 받을 수 있나요?",
    answer:
      "아르바이트도 근로자에 해당하고 요건을 충족하면 주휴수당 대상이 될 수 있습니다.",
  },
  {
    question: "5인 미만 사업장도 해당되나요?",
    answer:
      "주휴수당은 사업장 규모와 무관하게 문제될 수 있습니다. 다만 구체적인 적용은 근로계약과 실제 근무 형태를 확인해야 합니다.",
  },
  {
    question: "시급이 최저임금보다 낮으면 어떻게 표시되나요?",
    answer:
      "2026년 최저임금 10,320원보다 낮은 시급을 입력하면 확인 필요 경고를 표시합니다. 법 위반 확정 표현은 하지 않습니다.",
  },
  {
    question: "퇴사하는 주에도 주휴수당이 나오나요?",
    answer:
      "퇴사일, 소정근로일, 다음 주 근로 예정 여부 등 사정에 따라 판단이 달라질 수 있어 고용노동부나 노무 전문가 확인이 필요합니다.",
  },
  {
    question: "실제 급여명세서와 계산 결과가 다른 이유는 무엇인가요?",
    answer:
      "세금, 4대보험, 사업장 지급 방식, 근무표 변경, 이미 포함된 수당 등이 반영되지 않아 실제 지급액과 다를 수 있습니다.",
  },
] as const;

export const laborPayWebApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "주휴수당 계산기",
  url: "https://gyesanbox.kr/calculators/labor-pay/",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description:
    "근무시간, 시급, 개근 여부를 입력해 예상 주휴수당과 주휴 포함 주급을 계산하는 계산기",
};

export const laborPayBreadcrumbJsonLd = {
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
      name: "주휴수당 계산기",
      item: "https://gyesanbox.kr/calculators/labor-pay/",
    },
  ],
};

export const laborPayFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: laborPayFaqs.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
};
