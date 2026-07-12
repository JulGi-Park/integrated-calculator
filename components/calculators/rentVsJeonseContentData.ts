import type { JsonLdItem } from "@/components/common/JsonLdScripts";
import { RENT_VS_JEONSE_LEGAL_REFERENCE } from "@/lib/calculators/rent-vs-jeonse/rent-vs-jeonse";

export interface RentVsJeonseFaq {
  question: string;
  answer: string;
}

export interface RentVsJeonseSource {
  organization: string;
  title: string;
  criterion: string;
  verifiedAt: string;
  href: string;
}

export const rentVsJeonseCriteria = [
  "이 계산기는 계약서에 적힌 납부액을 대신 계산하는 도구가 아닙니다.",
  "전세대출 이자, 월세, 보증금 차이, 관리비, 기회비용을 비교해 전세와 월세의 예상 부담을 비교합니다.",
  "전세보증금 중 대출이 아닌 자기자본은 다른 곳에 예치하거나 운용했을 때의 기회비용이 있을 수 있습니다.",
  "월세보증금도 같은 방식으로 기회비용을 반영합니다.",
  "법정 전월세전환율은 보증금을 월세로 전환할 때 참고할 수 있는 기준이며, 실제 계약·분쟁 판단은 별도 확인이 필요합니다.",
] as const;

export const rentVsJeonseLegalReferencePoints = [
  "기준일: 2026-07-12",
  "법정 참고 구조는 연 10%와 한국은행 기준금리 + 시행령상 가산 이율 중 낮은 비율입니다.",
  "기본값은 한국은행 기준금리 2.50%, 시행령상 가산 이율 2.00%, 법정 상한율 10.00%, 기본 참고 전환율 4.50%입니다.",
  "기준금리는 변동될 수 있으므로 입력 영역에서 직접 수정해 계산할 수 있습니다.",
  "전월세전환율 설명은 참고용이며, 실제 계약·증액 제한·분쟁 판단을 확정하지 않습니다.",
] as const;

export const rentVsJeonseExample = [
  "전세보증금 2억 원, 전세대출금 1억 5천만 원, 전세대출금리 연 3.8%인 경우를 가정할 수 있습니다.",
  "월세는 보증금 5천만 원, 월세 70만 원, 관리비 10만 원으로 두고, 보증금 기회비용 금리는 연 2.5%, 거주기간은 24개월로 볼 수 있습니다.",
  "이 조건에서는 전세대출 이자, 전세 자기자본 기회비용, 월세와 관리비를 함께 비교해야 실제 월 부담 차이를 볼 수 있습니다.",
] as const;

export const rentVsJeonseExclusions = [
  "중개보수",
  "이사비",
  "보증보험료",
  "대출 중도상환수수료",
  "월세 세액공제",
  "전세자금대출 소득공제",
  "임대료 증액 제한 분쟁",
  "특약 조건",
  "관리비 세부 항목",
  "보증금 미반환 위험",
  "지역별 시세 변동",
  "개인 신용도와 대출 한도",
  "실제 대출 승인 여부",
] as const;

export const rentVsJeonseFaqs: RentVsJeonseFaq[] = [
  {
    question: "전세 vs 월세 비교 계산기는 무엇을 비교하나요?",
    answer:
      "전세대출 이자, 전세 자기자본 기회비용, 월세, 관리비, 월세보증금 기회비용을 입력값 기준으로 비교해 월 부담과 거주기간 총비용을 보여줍니다.",
  },
  {
    question: "계약서 금액만 보면 되는 것 아닌가요?",
    answer:
      "계약서의 월 납부액도 중요하지만, 전세보증금에 묶이는 자기자본과 월세보증금의 기회비용까지 고려하면 부담 구조가 달라질 수 있습니다.",
  },
  {
    question: "전세대출 이자를 넣어야 하나요?",
    answer:
      "전세대출을 이용한다면 월 이자 비용이 전세의 주요 부담이므로 입력하는 것이 좋습니다. 대출이 없다면 전세대출금을 0원으로 입력할 수 있습니다.",
  },
  {
    question: "보증금 기회비용은 왜 계산하나요?",
    answer:
      "보증금으로 묶인 돈은 예금, 상환, 투자 등 다른 용도로 사용할 수 없으므로 그에 해당하는 예상 비용을 비교에 반영하기 위한 항목입니다.",
  },
  {
    question: "관리비도 넣어야 하나요?",
    answer:
      "월세 부담을 실제 현금흐름에 가깝게 보려면 매월 반복되는 관리비를 함께 입력하는 것이 좋습니다. 단, 관리비 세부 항목 변동은 별도로 확인해야 합니다.",
  },
  {
    question: "전월세전환율은 법적으로 확정된 값인가요?",
    answer:
      "이 페이지의 전월세전환율은 기준일 현재 법정 상한 구조를 반영한 참고값입니다. 실제 계약, 증액 제한, 분쟁 판단은 공식 기관이나 전문가 확인이 필요합니다.",
  },
  {
    question: "계산 결과가 실제 계약에서 그대로 적용되나요?",
    answer:
      "아니요. 결과는 입력값 기준 예상 비교입니다. 실제 계약 조건, 대출 조건, 세금 혜택, 수수료, 보증금 반환 위험 등에 따라 달라질 수 있습니다.",
  },
  {
    question: "월세 세액공제나 이사비도 포함되나요?",
    answer:
      "현재 계산에는 월세 세액공제, 전세자금대출 소득공제, 이사비, 중개보수, 보증보험료 등이 포함되지 않습니다.",
  },
];

export const rentVsJeonseSources: RentVsJeonseSource[] = [
  {
    organization: "국가법령정보센터",
    title: "주택임대차보호법 제7조의2",
    criterion: "차임 등 증감청구권과 전월세전환 관련 법률 기준",
    verifiedAt: "2026년 7월 12일",
    href: "https://www.law.go.kr/LSW/lsLinkCommonInfo.do?ancYnChk=&chrClsCd=&lsJoLnkSeq=1031475575",
  },
  {
    organization: "국가법령정보센터",
    title: "주택임대차보호법 시행령 제9조",
    criterion: "월차임 전환 시 산정률 기준",
    verifiedAt: "2026년 7월 12일",
    href: "https://www.law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lspttninfSeq=130111",
  },
  {
    organization: "한국은행",
    title: "한국은행 기준금리 추이",
    criterion: "전월세전환율 참고 계산에 쓰는 기준금리 확인",
    verifiedAt: "2026년 7월 12일",
    href: "https://www.bok.or.kr/portal/bbs/P0000559/view.do?menuNo=200690&nttId=10098188",
  },
  {
    organization: "한국부동산원·LH 임대차분쟁조정위원회",
    title: "전월세전환 계산기",
    criterion: "보증금을 월차임으로 전환할 때 참고하는 공식 계산 도구",
    verifiedAt: "2026년 7월 12일",
    href: "https://www.hldcc.or.kr/",
  },
];

export const rentVsJeonseWebApplicationJsonLd: JsonLdItem = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "전세 vs 월세 비교 계산기",
  description:
    "전세대출 이자, 월세, 관리비, 보증금 기회비용을 입력해 전세와 월세의 월 부담과 거주기간 총비용을 비교합니다.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  browserRequirements: "JavaScript가 지원되는 웹 브라우저",
  url: "https://gyesanbox.kr/calculators/rent-vs-jeonse/",
};

export const rentVsJeonseBreadcrumbJsonLd: JsonLdItem = {
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
      name: "전세 vs 월세 비교 계산기",
      item: "https://gyesanbox.kr/calculators/rent-vs-jeonse/",
    },
  ],
};

export const rentVsJeonseFaqJsonLd: JsonLdItem = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: rentVsJeonseFaqs.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
};

export const rentVsJeonsePolicySummary = {
  referenceDate: RENT_VS_JEONSE_LEGAL_REFERENCE.referenceDate,
  referenceDateText: "2026년 7월 12일",
  baseRate: "2.50%",
  legalAdditionalRate: "2.00%",
  maxLegalRate: "10.00%",
  legalReferenceRate: "4.50%",
};
