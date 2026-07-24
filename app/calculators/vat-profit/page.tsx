import type { Metadata } from "next";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { VatProfitCalculator } from "@/components/calculators/VatProfitCalculator";
import { VatProfitContent } from "@/components/calculators/VatProfitContent";
import { CompactCalculatorHero } from "@/components/common/CompactCalculatorHero";
import {
  vatProfitBaseDate,
  vatProfitBreadcrumbJsonLd,
  vatProfitFaqJsonLd,
  vatProfitWebApplicationJsonLd,
} from "@/components/calculators/vatProfitContentData";
import { PUBLIC_CALCULATOR_SEO } from "@/lib/seo/publicCalculatorSeo";

const seo = PUBLIC_CALCULATOR_SEO["vat-profit"];
const { title, description } = seo;
const canonical = `https://gyesanbox.kr${seo.path}`;
const ogTitle = "부가세 계산기 - 공급가액·합계금액 부가가치세 계산";
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

export default function VatProfitPage() {
  const jsonLdItems = [
    { ...vatProfitWebApplicationJsonLd, image: ogImage },
    vatProfitBreadcrumbJsonLd,
    vatProfitFaqJsonLd,
  ];

  return (
    <section className="page-section">
      <JsonLdScripts items={jsonLdItems} />

      <CompactCalculatorHero
        eyebrow="VAT"
        title="부가세 계산기"
        description={
          <>
          공급가액 또는 부가세 포함 합계금액을 입력해 매출세액과 예상
          납부세액을 계산하는 계산기입니다.
          </>
        }
        meta={
          <>
          <span>계산 기준일: {vatProfitBaseDate}</span>
          <span>
            계산 결과는 일반과세자 기본 세율 10% 기준 참고용이며 실제 신고
            결과와 다를 수 있습니다.
          </span>
          </>
        }
      />

      <VatProfitCalculator />
      <VatProfitContent />
    </section>
  );
}
