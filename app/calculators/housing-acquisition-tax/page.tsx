import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { HousingAcquisitionTaxCalculator } from "@/components/calculators/HousingAcquisitionTaxCalculator";
import { HousingAcquisitionTaxContent } from "@/components/calculators/HousingAcquisitionTaxContent";
import { housingAcquisitionTaxBreadcrumbJsonLd, housingAcquisitionTaxFaqJsonLd, housingAcquisitionTaxSeo, housingAcquisitionTaxWebApplicationJsonLd } from "@/components/calculators/housingAcquisitionTaxContentData";

export const metadata: Metadata = {
  title: housingAcquisitionTaxSeo.title,
  description: housingAcquisitionTaxSeo.description,
  robots: { index: false, follow: false },
  alternates: { canonical: housingAcquisitionTaxSeo.canonical },
};

export default function HousingAcquisitionTaxPage() {
  if (process.env.NEXT_PUBLIC_ENABLE_HOUSING_ACQUISITION_TAX_CALCULATOR !== "true") notFound();
  return <section className="page-section"><JsonLdScripts items={[housingAcquisitionTaxWebApplicationJsonLd, housingAcquisitionTaxBreadcrumbJsonLd, housingAcquisitionTaxFaqJsonLd]} /><div className="page-heading seller-margin-heading"><p className="page-heading__eyebrow">Housing acquisition tax</p><h1>주택 취득세 계산기</h1><p>개인 명의 국내 주택을 정상 유상취득하는 경우를 기준으로, 취득세와 지방교육세·농어촌특별세를 나누어 계산합니다.</p><div className="seller-margin-meta"><span>주택 수·지역별 세율</span><span>감면·예외 자동판단 제외</span><span>정책 확인일: 2026-08-27</span></div></div><HousingAcquisitionTaxCalculator /><HousingAcquisitionTaxContent /></section>;
}

export const dynamic = "force-static";
