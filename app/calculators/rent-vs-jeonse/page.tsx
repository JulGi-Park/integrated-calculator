import type { Metadata } from "next";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { RentVsJeonseCalculator } from "@/components/calculators/RentVsJeonseCalculator";
import { RentVsJeonseContent } from "@/components/calculators/RentVsJeonseContent";
import { CalculatorHeroImage } from "@/components/common/CalculatorHeroImage";
import {
  rentVsJeonseBreadcrumbJsonLd,
  rentVsJeonseFaqJsonLd,
  rentVsJeonseWebApplicationJsonLd,
} from "@/components/calculators/rentVsJeonseContentData";
import { PUBLIC_CALCULATOR_SEO } from "@/lib/seo/publicCalculatorSeo";

const seo = PUBLIC_CALCULATOR_SEO["rent-vs-jeonse"];
const { title, description } = seo;
const canonical = `https://gyesanbox.kr${seo.path}`;

export const metadata: Metadata = {
  title,
  description,
  robots: { index: true, follow: true },
  alternates: {
    canonical,
  },
  openGraph: {
    title,
    description,
    url: canonical,
    type: "website",
    images: [{ url: seo.image, width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [seo.image],
  },
};

export default function RentVsJeonsePage() {
  const jsonLdItems = [
    { ...rentVsJeonseWebApplicationJsonLd, image: seo.image },
    rentVsJeonseBreadcrumbJsonLd,
    rentVsJeonseFaqJsonLd,
  ];

  return (
    <section className="page-section">
      <JsonLdScripts items={jsonLdItems} />

      <CalculatorHeroImage src={seo.imagePath} alt={seo.imageAlt} />

      <div className="page-heading seller-margin-heading">
        <p className="page-heading__eyebrow">Housing cost comparison</p>
        <h1>전세 vs 월세 비교 계산기</h1>
        <p>{description}</p>
        <div className="seller-margin-meta">
          <span>참고용 예상 계산</span>
          <span>기준일: 2026-07-12</span>
          <span>입력한 가정에 따른 예상 비교입니다.</span>
        </div>
      </div>

      <RentVsJeonseCalculator />
      <RentVsJeonseContent />
    </section>
  );
}
