import type { Metadata } from "next";
import Link from "next/link";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { SellerMarginCalculator } from "@/components/calculators/SellerMarginCalculator";
import { SellerMarginContent } from "@/components/calculators/SellerMarginContent";
import { CalculatorHeroImage } from "@/components/common/CalculatorHeroImage";
import { PUBLIC_CALCULATOR_SEO } from "@/lib/seo/publicCalculatorSeo";
import {
  sellerMarginBreadcrumbJsonLd,
  sellerMarginFaqJsonLd,
  sellerMarginWebApplicationJsonLd,
} from "@/components/calculators/sellerMarginContentData";

const seo = PUBLIC_CALCULATOR_SEO["seller-margin"];
const { title, description } = seo;
const ogTitle =
  "판매자 마진 계산기 - 판매가·수수료·원가 기준 순이익 확인";
const ogDescription =
  "판매가, 원가, 플랫폼 수수료, 배송비, 광고비를 입력하면 예상 마진율과 순이익을 계산할 수 있습니다.";
const ogUrl = seo.path.startsWith("/") ? `https://gyesanbox.kr${seo.path}` : seo.path;
const ogImage = seo.image;

export const metadata: Metadata = {
  title,
  description,
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: ogUrl,
  },
  openGraph: {
    title: ogTitle,
    description: ogDescription,
    url: ogUrl,
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

export default function SellerMarginPage() {
  const jsonLdItems = [
    { ...sellerMarginWebApplicationJsonLd, image: ogImage },
    sellerMarginBreadcrumbJsonLd,
    sellerMarginFaqJsonLd,
  ];

  return (
    <section className="page-section seller-margin-page">
      <JsonLdScripts items={jsonLdItems} />

      <CalculatorHeroImage src={seo.imagePath} alt={seo.imageAlt} />

      <div className="page-heading seller-margin-heading">
        <p className="page-heading__eyebrow">Seller margin</p>
        <h1>판매자 마진 계산기</h1>
        <p>
          판매단가, 수량, 원가, 수수료와 비용을 입력해 주문 기준 예상
          정산금액과 순이익을 계산할 수 있습니다.
        </p>
        <div className="seller-margin-meta">
          <span>계산 기준일: 2026년 6월 18일</span>
          <span>
            계산 결과는 입력값을 기준으로 산출한 세전 예상값이며 실제 플랫폼
            정산액과 다를 수 있습니다.
          </span>
        </div>
      </div>

      <SellerMarginCalculator />
      <SellerMarginContent />

      <nav className="link-row seller-margin-links" aria-label="페이지 이동">
        <a className="text-link" href="/calculators/">
          ← 계산기 목록
        </a>
        <Link className="text-link" href="/">
          홈으로
        </Link>
      </nav>
    </section>
  );
}
