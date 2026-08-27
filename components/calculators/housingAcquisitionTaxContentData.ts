export const housingAcquisitionTaxSeo = {
  title: "주택 취득세 계산기 | 주택 수·조정대상지역별 취득세",
  description: "개인 명의 국내 주택의 일반 유상취득을 기준으로 취득세·지방교육세·농어촌특별세 예상액을 계산합니다.",
  canonical: "https://gyesanbox.kr/calculators/housing-acquisition-tax/",
} as const;

export const housingAcquisitionTaxFaqs = [
  { question: "생애최초 취득세 감면도 계산되나요?", answer: "아니요. 무주택 이력, 배우자 조건, 주택가액과 취득일 등 추가 확인이 필요하므로 이 계산기는 감면액을 자동 반영하지 않습니다." },
  { question: "일시적 2주택은 어떻게 입력하나요?", answer: "일시적 2주택의 처분기한·기존 주택 조건 등은 자동 판단하지 않습니다. 이 계산 결과를 확정세액으로 사용하지 말고 관할 지방자치단체에 확인하세요." },
  { question: "조정대상지역 여부는 언제 기준인가요?", answer: "취득일 기준으로 확인해 직접 선택해야 합니다. 지정·해제 시점과 개별 예외는 계산기에 포함하지 않습니다." },
  { question: "전용 85㎡ 이하면 농어촌특별세가 없나요?", answer: "이 계산기의 국내 주택 일반 기준에서는 85㎡ 초과 여부로 농어촌특별세를 나눕니다. 비도시지역 등 면적 예외는 별도 확인이 필요합니다." },
  { question: "취득세 외 비용도 합산되나요?", answer: "아니요. 중개보수, 국민주택채권, 등기·법무 비용, 대출비용은 포함하지 않습니다." },
] as const;

export const housingAcquisitionTaxSources = [
  { organization: "국가법령정보센터", title: "지방세법 제11조", criterion: "주택 유상취득 기본세율과 6억 초과 9억원 이하 산식", href: "https://law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1026497579" },
  { organization: "국가법령정보센터", title: "지방세법 제13조의2", criterion: "조정대상지역·다주택 취득 중과세율", href: "https://www.law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1033360867" },
  { organization: "국가법령정보센터", title: "지방세법 제151조", criterion: "주택 취득 관련 지방교육세", href: "https://www.law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1031196225" },
  { organization: "서울특별시 ETAX", title: "지방세 모의계산 - 취득세", criterion: "주택 수·면적별 취득세, 지방교육세, 농어촌특별세 안내", href: "https://etax.seoul.go.kr/AcqutaxCalcAction.view" },
] as const;

const faqEntity = housingAcquisitionTaxFaqs.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } }));

export const housingAcquisitionTaxWebApplicationJsonLd = { "@context": "https://schema.org", "@type": "WebApplication", name: "주택 취득세 계산기", applicationCategory: "FinanceApplication", operatingSystem: "Web", url: housingAcquisitionTaxSeo.canonical } as const;
export const housingAcquisitionTaxBreadcrumbJsonLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "홈", item: "https://gyesanbox.kr/" }, { "@type": "ListItem", position: 2, name: "계산기", item: "https://gyesanbox.kr/calculators/" }, { "@type": "ListItem", position: 3, name: "주택 취득세 계산기", item: housingAcquisitionTaxSeo.canonical }] } as const;
export const housingAcquisitionTaxFaqJsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqEntity } as const;
