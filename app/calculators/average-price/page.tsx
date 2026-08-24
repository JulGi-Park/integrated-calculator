import type { Metadata } from "next";
import Link from "next/link";
import { AveragePriceCalculator } from "@/components/calculators/AveragePriceCalculator";
import { AveragePriceContent } from "@/components/calculators/AveragePriceContent";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import {
  averagePriceBreadcrumbJsonLd,
  averagePriceFaqJsonLd,
  averagePriceWebApplicationJsonLd,
} from "@/lib/calculators/average-price/content";

const title = "물타기·평단가 계산기 | 추가매수 시나리오 비교";
const description =
  "추가매수 전후의 보유수량·평균단가·총 투입원금 변화와 두 가지 추가매수 시나리오를 비교합니다.";
const ogUrl = "https://gyesanbox.kr/calculators/average-price/";
const ogImage = "https://gyesanbox.kr/og/average-price.png";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: ogUrl,
  },
  openGraph: {
    title,
    description,
    url: ogUrl,
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

export default function AveragePricePage() {
  const jsonLdItems = [
    averagePriceWebApplicationJsonLd,
    averagePriceBreadcrumbJsonLd,
    averagePriceFaqJsonLd,
  ];

  return (
    <section className="page-section">
      <JsonLdScripts items={jsonLdItems} />

      <div className="page-heading seller-margin-heading">
        <p className="page-heading__eyebrow">Average price</p>
        <h1>물타기 계산기</h1>
        <p>
          현재 보유분과 추가매수 조건을 입력해 전후 수량·평균단가·총
          투입원금의 변화를 확인합니다. 두 조건을 입력하면 사용자 입력
          순서대로 비교하며, 현재가 입력 시 각 평균매입단가까지 필요한 가격
          변화율을 함께 계산합니다.
        </p>
        <div className="seller-margin-meta">
          <span>기능 확인일: 2026년 8월 24일</span>
          <span>수수료, 세금, 환율 등은 반영하지 않은 단순 계산값입니다.</span>
        </div>
      </div>

      <AveragePriceCalculator />
      <AveragePriceContent />

      <nav className="link-row seller-margin-links" aria-label="페이지 이동">
        <Link className="text-link" href="/calculators/">
          ← 계산기 목록
        </Link>
        <Link className="text-link" href="/">
          홈으로
        </Link>
      </nav>
    </section>
  );
}
