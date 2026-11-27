import type { Metadata } from "next";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { LaborPayCalculator } from "@/components/calculators/LaborPayCalculator";
import { LaborPayContent } from "@/components/calculators/LaborPayContent";
import { CompactCalculatorHero } from "@/components/common/CompactCalculatorHero";
import designTokens from "@/components/calculators/LaborPayDesignTokens.module.css";
import {
  laborPayBaseDate,
  laborPayBreadcrumbJsonLd,
  laborPayFaqJsonLd,
  laborPayWebApplicationJsonLd,
} from "@/components/calculators/laborPayContentData";
import { PUBLIC_CALCULATOR_SEO } from "@/lib/seo/publicCalculatorSeo";

const seo = PUBLIC_CALCULATOR_SEO["labor-pay"];
const { title, description } = seo;
const canonical = `https://gyesanbox.kr${seo.path}`;
const ogTitle = title;
const ogDescription = description;
const ogImage = seo.image;

export const metadata: Metadata = {
  title,
  description,
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical,
  },
  openGraph: {
    title: ogTitle,
    description: ogDescription,
    url: canonical,
    type: "website",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: ogTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: ogTitle,
    description: ogDescription,
    images: [ogImage],
  },
};

export default function LaborPayPage() {
  const jsonLdItems = [
    { ...laborPayWebApplicationJsonLd, image: ogImage },
    laborPayBreadcrumbJsonLd,
    laborPayFaqJsonLd,
  ];

  return (
    <section className={`page-section labor-pay-page ${designTokens.scope}`}>
      <JsonLdScripts items={jsonLdItems} />

      <CompactCalculatorHero
        className="labor-pay-heading"
        eyebrow="Labor pay"
        title="주휴수당·알바 주급 계산기"
        description={
          <>
          시급과 계약에서 정한 근무시간, 실제 근무시간, 개근 여부를 입력해
          예상 주휴수당과 주휴 포함 주급을 확인하세요. 계약상 근무시간이
          주마다 다르면 4주 평균도 입력할 수 있습니다.
          </>
        }
        meta={
          <>
          <span>계산 기준일: {laborPayBaseDate}</span>
          <span>
            계산 결과는 입력값 기준 참고용이며 실제 임금 판단과 다를 수
            있습니다.
          </span>
          </>
        }
      />

      <LaborPayCalculator />
      <LaborPayContent />
    </section>
  );
}
