import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { RentConversionRateCalculator } from "@/components/calculators/RentConversionRateCalculator";
import { RentConversionRateContent } from "@/components/calculators/RentConversionRateContent";
import { isRentConversionRateCalculatorEnabled, RENT_CONVERSION_RATE_PUBLICATION } from "@/lib/calculators/rent-conversion-rate";
export const metadata: Metadata={title:"전월세 전환율 계산기 | 보증금·월세 환산과 법정 상한 비교",description:"보증금과 월세를 양방향으로 환산하고 실제 전환율을 계산해 2026년 기준 법정 전월세전환율 참고 상한과 비교합니다.",alternates:{canonical:RENT_CONVERSION_RATE_PUBLICATION.path}};
const jsonLd=[{"@context":"https://schema.org","@type":"WebApplication",name:"전월세 전환율 계산기",applicationCategory:"FinanceApplication",operatingSystem:"Web",url:RENT_CONVERSION_RATE_PUBLICATION.url},{"@context":"https://schema.org","@type":"FAQPage",mainEntity:[{"@type":"Question",name:"2026년 현재 법정 전월세전환율은 얼마인가요?",acceptedAnswer:{"@type":"Answer",text:"2026-08-21 기준 한국은행 기준금리 2.75%에 2%p를 더한 4.75%와 연 10% 중 낮은 비율을 참고합니다."}}]}] as const;
export default function RentConversionRatePage(){if(!isRentConversionRateCalculatorEnabled())notFound();return <section className="page-section"><JsonLdScripts items={jsonLd}/><div className="page-heading seller-margin-heading"><p className="page-heading__eyebrow">Rent conversion rate</p><h1>전월세 전환율 계산기</h1><p>보증금과 월세를 양방향으로 환산하고 실제 조건의 연 전환율을 확인합니다. 법정 전월세전환율 참고 상한과의 차이도 함께 보여드립니다.</p><div className="seller-margin-meta"><span>한국은행 기준금리 2.75%</span><span>현재 법정 참고 상한 4.75%</span><span>기준일: 2026-08-21</span></div></div><RentConversionRateCalculator/><RentConversionRateContent/></section>}
