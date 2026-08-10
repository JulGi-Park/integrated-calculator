import type { Metadata } from "next";
import { RoasCalculator } from "@/components/calculators/RoasCalculator";
import { RoasContent } from "@/components/calculators/RoasContent";
import {
  roasBreadcrumbJsonLd,
  roasFaqJsonLd,
  roasWebApplicationJsonLd,
} from "@/components/calculators/roasContentData";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import pageStyles from "./RoasPage.module.css";

const ogTitle = "ROAS 계산기 - 광고비 대비 매출과 광고수익률 계산";
const ogDescription =
  "광고비와 광고 매출을 입력해 광고수익률(ROAS)과 손익분기 ROAS를 계산합니다.";
const ogUrl = "https://gyesanbox.kr/calculators/roas/";
const ogImage = "https://gyesanbox.kr/og/roas.png";

export const metadata: Metadata = {
  title: "ROAS 계산기 - 광고비 대비 매출과 손익분기 ROAS 계산 | 계산박스",
  description:
    "광고비와 광고 매출을 입력해 ROAS, 광고비 비중, 광고 후 순이익, 손익분기 ROAS를 계산해보세요.",
  alternates: {
    canonical: ogUrl,
  },
  openGraph: {
    title: ogTitle,
    description: ogDescription,
    url: ogUrl,
    type: "website",
    images: [{ url: ogImage, width: 1200, height: 630, alt: ogTitle }],
  },
  twitter: {
    card: "summary_large_image",
    title: ogTitle,
    description: ogDescription,
    images: [ogImage],
  },
};

export default function RoasPage() {
  const jsonLdItems = [
    roasWebApplicationJsonLd,
    roasBreadcrumbJsonLd,
    roasFaqJsonLd,
  ];

  return (
    <section className="page-section">
      <JsonLdScripts items={jsonLdItems} />

      <div className={`page-heading seller-margin-heading ${pageStyles.heading}`}>
        <p className="page-heading__eyebrow">ROAS</p>
        <h1>ROAS 계산기</h1>
        <p>
          광고비와 광고 매출을 입력해 ROAS, 광고비 비중, 광고 후 순이익,
          손익분기 ROAS를 계산하는 계산기입니다.
        </p>
        <div className="seller-margin-meta">
          <span>계산 기준일: 2026-08-09</span>
          <span>
            계산 결과는 입력값 기준의 단순 예상값이며 광고 플랫폼 보고서와
            실제 정산 자료가 우선합니다.
          </span>
        </div>
      </div>

      <RoasCalculator />
      <RoasContent />
    </section>
  );
}
