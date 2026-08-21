import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WithholdingTaxCalculator } from "@/components/calculators/WithholdingTaxCalculator";
import { WithholdingTaxContent } from "@/components/calculators/WithholdingTaxContent";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { isWithholdingTaxCalculatorEnabled, WITHHOLDING_TAX_PUBLICATION } from "@/lib/calculators/withholding-tax";

export const metadata: Metadata = { title: "3.3% 원천징수 계산기 | 세전·실수령액 양방향 계산", description: "일반적인 인적용역 사업소득 기준으로 소득세 3%와 개인지방소득세를 나누어 계산하고, 실수령액에서 필요한 세전 금액도 확인합니다.", alternates: { canonical: WITHHOLDING_TAX_PUBLICATION.path } };

const jsonLd = [{ "@context": "https://schema.org", "@type": "WebApplication", name: "3.3% 원천징수 계산기", applicationCategory: "FinanceApplication", operatingSystem: "Web", url: WITHHOLDING_TAX_PUBLICATION.url }, { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "프리랜서면 무조건 3.3%를 떼나요?", acceptedAnswer: { "@type": "Answer", text: "모든 프리랜서와 모든 계약에 적용되는 것은 아니며 실제 소득 구분과 지급 조건에 따라 달라질 수 있습니다." } }] }] as const;

export default function WithholdingTaxPage() {
  if (!isWithholdingTaxCalculatorEnabled()) notFound();
  return <section className="page-section"><JsonLdScripts items={jsonLd} /><div className="page-heading seller-margin-heading"><p className="page-heading__eyebrow">Withholding tax</p><h1>3.3% 원천징수 계산기</h1><p>일반적인 국내 거주자 인적용역 사업소득을 기준으로 소득세 3%와 개인지방소득세를 나누어 계산합니다. 세전 지급액에서 예상 실수령액을 구하거나, 원하는 실수령액에서 필요한 세전 금액을 역산할 수 있습니다.</p><div className="seller-margin-meta"><span>입력값 기준 예상 계산</span><span>일반적인 인적용역 사업소득 기준</span><span>기준일: 2026-08-21</span></div></div><WithholdingTaxCalculator /><WithholdingTaxContent /></section>;
}
