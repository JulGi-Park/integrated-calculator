import type { Metadata } from "next";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { ParentalLeaveCalculator } from "@/components/calculators/ParentalLeaveCalculator";
import { ParentalLeaveContent } from "@/components/calculators/ParentalLeaveContent";
import { CalculatorHeroImage } from "@/components/common/CalculatorHeroImage";
import {
  parentalLeaveBreadcrumbJsonLd,
  parentalLeaveFaqJsonLd,
  parentalLeaveWebApplicationJsonLd,
} from "@/components/calculators/parentalLeaveContentData";
import { PARENTAL_LEAVE_POLICY_2026 } from "@/lib/calculators/parental-leave/parentalLeave";
import { PUBLIC_CALCULATOR_SEO } from "@/lib/seo/publicCalculatorSeo";

const seo = PUBLIC_CALCULATOR_SEO["parental-leave"];
const { title, description } = seo;

const canonical = `https://gyesanbox.kr${seo.path}`;
const ogImage = seo.image;

export const metadata: Metadata = {
  title,
  description,
  robots: { index: true, follow: true },
  alternates: { canonical },
  openGraph: {
    title,
    description,
    url: canonical,
    type: "website",
    images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
  },
};

export default function ParentalLeavePage() {
  const jsonLdItems = [
    { ...parentalLeaveWebApplicationJsonLd, image: ogImage },
    parentalLeaveBreadcrumbJsonLd,
    parentalLeaveFaqJsonLd,
  ];

  return (
    <section className="page-section">
      <JsonLdScripts items={jsonLdItems} />

      <CalculatorHeroImage src={seo.imagePath} alt={seo.imageAlt} />

      <div className="page-heading seller-margin-heading">
        <p className="page-heading__eyebrow">Parental leave benefit</p>
        <h1>육아휴직급여 계산기</h1>
        <p>
          월 통상임금과 육아휴직 사용 개월 수를 입력해 일반 육아휴직급여의
          월별 예상액과 총 예상 수령액을 확인합니다.
        </p>
        <div className="seller-margin-meta">
          <span>2026년 현행 기준</span>
          <span>계산 기준일: {PARENTAL_LEAVE_POLICY_2026.basisDate}</span>
          <span>확정 지급액이 아닌 예상값입니다.</span>
        </div>
      </div>

      <ParentalLeaveCalculator />
      <ParentalLeaveContent />
    </section>
  );
}
