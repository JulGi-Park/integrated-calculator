import type { Metadata } from "next";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { VatProfitCalculator } from "@/components/calculators/VatProfitCalculator";
import { VatProfitContent } from "@/components/calculators/VatProfitContent";
import {
  vatProfitBaseDate,
  vatProfitBreadcrumbJsonLd,
  vatProfitFaqJsonLd,
  vatProfitWebApplicationJsonLd,
} from "@/components/calculators/vatProfitContentData";

const canonical = "https://gyesanbox.kr/calculators/vat-profit/";
const ogTitle = "부가세 계산기 - 공급가액·합계금액 부가가치세 계산";
const ogDescription =
  "공급가액 또는 부가세 포함 합계금액을 입력해 매출세액, 합계금액, 매입세액 차감 후 예상 납부세액을 계산합니다.";
const ogImage = "https://gyesanbox.kr/og/calculators.png";

export const metadata: Metadata = {
  title: "부가세 계산기 | 공급가액·합계금액 부가가치세 계산",
  description:
    "공급가액 또는 부가세 포함 합계금액을 입력해 매출세액, 합계금액, 매입세액 차감 후 예상 납부세액을 계산합니다.",
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
    vatProfitWebApplicationJsonLd,
    vatProfitBreadcrumbJsonLd,
    vatProfitFaqJsonLd,
  ];

  return (
    <section className="page-section">
      <JsonLdScripts items={jsonLdItems} />

      <div className="page-heading">
        <p className="page-heading__eyebrow">VAT</p>
        <h1>부가세 계산기</h1>
        <p>
          공급가액 또는 부가세 포함 합계금액을 입력해 매출세액과 예상
          납부세액을 계산하는 계산기입니다.
        </p>
        <div className="seller-margin-meta">
          <span>계산 기준일: {vatProfitBaseDate}</span>
          <span>
            계산 결과는 일반과세자 기본 세율 10% 기준 참고용이며 실제 신고
            결과와 다를 수 있습니다.
          </span>
        </div>
      </div>

      <VatProfitCalculator />
      <VatProfitContent />
    </section>
  );
}
