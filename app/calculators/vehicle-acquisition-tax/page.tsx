import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { VehicleAcquisitionTaxCalculator } from "@/components/calculators/VehicleAcquisitionTaxCalculator";
import { VehicleAcquisitionTaxContent, vehicleAcquisitionTaxFaqs } from "@/components/calculators/VehicleAcquisitionTaxContent";
import { isVehicleAcquisitionTaxCalculatorEnabled, VEHICLE_ACQUISITION_TAX_PATH, VEHICLE_ACQUISITION_TAX_POLICY } from "@/lib/calculators/vehicle-acquisition-tax";

const canonical = `https://gyesanbox.kr${VEHICLE_ACQUISITION_TAX_PATH}`;
export const metadata: Metadata = { title: "자동차 취득세 계산기 | 신차·중고차 예상 취득세", description: "차량 유형, 신차·중고차 취득가격과 시가표준액을 기준으로 자동차 취득세와 지원되는 차량 감면을 계산합니다.", alternates: { canonical } };
export default function VehicleAcquisitionTaxPage() {
  if (!isVehicleAcquisitionTaxCalculatorEnabled()) notFound();
  const jsonLd = [{ "@context": "https://schema.org", "@type": "WebApplication", name: "자동차 취득세 계산기", url: canonical, applicationCategory: "FinanceApplication", operatingSystem: "Any" }, { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: vehicleAcquisitionTaxFaqs.map(([name,text])=>({"@type":"Question",name,acceptedAnswer:{"@type":"Answer",text}})) }];
  return <section className="page-section"><JsonLdScripts items={jsonLd}/><div className="page-heading seller-margin-heading"><p className="page-heading__eyebrow">Vehicle acquisition tax</p><h1>자동차 취득세 계산기</h1><p>신차·중고차 차량 조건을 입력하면 과세표준, 기본 취득세와 지원되는 차량 자체 감면을 바탕으로 예상 취득세를 계산합니다.</p><div className="seller-margin-meta"><span>입력 조건 기준 예상 계산</span><span>중고차 시가표준액 반영</span><span>기준일: {VEHICLE_ACQUISITION_TAX_POLICY.checkedAt}</span></div></div><VehicleAcquisitionTaxCalculator/><VehicleAcquisitionTaxContent/></section>;
}
