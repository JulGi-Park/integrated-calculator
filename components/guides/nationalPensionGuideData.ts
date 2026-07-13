const siteUrl = "https://gyesanbox.kr";

export const nationalPensionGuideFaqs = [
  {
    question: "2026년 7월에 국민연금 보험료율도 다시 올랐나요?",
    answer:
      "아닙니다. 2026년 보험료율 변화는 1월 적용분과 비교해야 합니다. 7월 급여명세서에서 새로 볼 수 있는 변화는 기준소득월액 상·하한과 정기결정일 수 있으므로, 두 시점을 한 번의 인상으로 합치면 원인을 잘못 판단할 수 있습니다.",
  },
  {
    question: "월급이 신규 상한보다 많으면 보험료가 계속 증가하나요?",
    answer:
      "직장가입자 국민연금은 신고된 기준소득월액에 상한을 적용합니다. 2026년 7월 이후 상한을 이미 넘는 구간에서는 그 상한까지만 산정 대상이 되므로, 같은 신고 기준이 유지되는 한 월급 증가분 전체가 국민연금 공제로 이어지지는 않습니다.",
  },
  {
    question: "월급이 그대로인데 기준소득월액이 달라질 수 있나요?",
    answer:
      "가능합니다. 사업장가입자는 전년도 해당 사업장에서 받은 소득총액을 기준으로 7월부터 다음 해 6월까지 적용하는 정기결정이 있을 수 있습니다. 따라서 이번 달 지급액만으로 신고 기준이 그대로라고 단정할 수 없습니다.",
  },
  {
    question: "상여금과 성과급이 국민연금에 반영될 수 있나요?",
    answer:
      "지급 성격과 사업장 신고 내용에 따라 기준소득월액에 영향을 줄 수 있습니다. 이 가이드는 개별 급여 항목의 포함 여부를 확정하지 않으므로, 급여명세서의 과세 항목과 사업장 신고 내용을 함께 확인해야 합니다.",
  },
  {
    question: "월급이 기존 상한 이하인데 공제액이 오른 이유는 무엇인가요?",
    answer:
      "상한 변경만으로 설명되지 않을 수 있습니다. 7월 정기결정, 전년도 소득총액, 상여·과세수당, 소급공제·정산, 또는 2025년 9% 요율과 비교한 결과인지 차례로 확인해 보세요.",
  },
  {
    question: "급여명세서와 계산기 결과가 다르면 무엇을 확인해야 하나요?",
    answer:
      "먼저 적용 월과 기준소득월액, 근로자 부담률, 소급·정산 항목을 비교하세요. 계산기는 입력값에 따른 예상치이고, 사업장 신고와 국민연금공단의 개별 결정이 실제 고지와 공제에 우선합니다.",
  },
] as const;

export const nationalPensionGuideFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: nationalPensionGuideFaqs.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
};

export const nationalPensionGuideBreadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "계산박스", item: `${siteUrl}/` },
    { "@type": "ListItem", position: 2, name: "가이드", item: `${siteUrl}/guides/` },
    {
      "@type": "ListItem",
      position: 3,
      name: "2026년 7월 국민연금 공제액 변화",
      item: `${siteUrl}/guides/national-pension-july-2026/`,
    },
  ],
};

export const nationalPensionGuideArticleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "2026년 7월 국민연금 공제액이 달라진 이유를 급여명세서에서 확인하는 법",
  description:
    "2026년 국민연금 보험료율과 7월 기준소득월액 상한 변경을 구분하고, 급여명세서의 기준소득월액·정기결정·소급공제 항목을 확인하는 방법을 안내합니다.",
  mainEntityOfPage: `${siteUrl}/guides/national-pension-july-2026/`,
  image: `${siteUrl}/og/policy.png`,
  datePublished: "2026-07-13",
  dateModified: "2026-07-13",
  author: { "@type": "Organization", name: "계산박스", url: `${siteUrl}/` },
  publisher: { "@type": "Organization", name: "계산박스", url: `${siteUrl}/` },
};

export const nationalPensionGuideSources = [
  {
    organization: "국민연금공단",
    title: "연금보험료 금액 및 보험료율",
    appliedAt: "기준소득월액 2026년 7월 1일~2027년 6월 30일 적용",
    checkedAt: "확인일: 2026년 7월 13일",
    href: "https://www.nps.or.kr/pnsinfo/ntpsklg/getOHAF0038M0.do?menuId=MN24001113&tab=tab5",
  },
  {
    organization: "국민연금공단",
    title: "사업장가입자의 기준소득월액 결정 방법 안내",
    appliedAt: "전년도 소득을 해당 연도 7월부터 다음 연도 6월까지 적용하는 정기결정 설명",
    checkedAt: "확인일: 2026년 7월 13일",
    href: "https://www.nps.or.kr/pnsinfo/ntpsklg/getOHAF0038M0.do?menuId=MN24001113&tab=tab5",
  },
  {
    organization: "국가법령정보센터",
    title: "국민연금법",
    appliedAt: "2026년 보험료율 단계 인상 관련 법령 확인",
    checkedAt: "확인일: 2026년 7월 13일",
    href: "https://www.law.go.kr/법령/국민연금법",
  },
] as const;
