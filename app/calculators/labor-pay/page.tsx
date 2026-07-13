import type { Metadata } from "next";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { LaborPayCalculator } from "@/components/calculators/LaborPayCalculator";
import { LaborPayContent } from "@/components/calculators/LaborPayContent";
import { CalculatorHeroImage } from "@/components/common/CalculatorHeroImage";
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
const ogTitle = "주휴수당 계산기 2026 - 알바 주휴수당과 주급 계산";
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
    <section className="page-section labor-pay-page">
      <style>
        {`
          @media (max-width: 560px) {
            body:has(.labor-pay-page) .site-header__inner {
              align-items: flex-start;
              flex-direction: column;
              gap: 8px;
              padding-block: 14px;
            }

            body:has(.labor-pay-page) .site-header nav {
              justify-content: flex-start;
            }

            .labor-pay-page,
            .labor-pay-heading,
            .labor-pay-heading p,
            .labor-pay-heading span {
              min-width: 0;
              overflow-wrap: anywhere;
              word-break: break-all;
            }

            .labor-pay-page * {
              overflow-wrap: anywhere;
              word-break: break-all;
            }

            .labor-pay-heading .seller-margin-meta {
              display: grid;
              gap: 6px;
            }
          }
        `}
      </style>
      <JsonLdScripts items={jsonLdItems} />

      <CalculatorHeroImage src={seo.imagePath} alt={seo.imageAlt} />

      <div className="page-heading labor-pay-heading">
        <p className="page-heading__eyebrow">Labor pay</p>
        <h1>주휴수당 계산기</h1>
        <p>
          근무시간, 시급, 개근 여부를 입력해 예상 주휴수당과 주휴 포함
          주급을 계산하는 계산기입니다.
        </p>
        <div className="seller-margin-meta">
          <span>계산 기준일: {laborPayBaseDate}</span>
          <span>
            계산 결과는 입력값 기준 참고용이며 실제 임금 판단과 다를 수
            있습니다.
          </span>
        </div>
      </div>

      <LaborPayCalculator />
      <LaborPayContent />
    </section>
  );
}
