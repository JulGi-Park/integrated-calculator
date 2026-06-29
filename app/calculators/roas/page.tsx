import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoasCalculator } from "@/components/calculators/RoasCalculator";
import { RoasContent } from "@/components/calculators/RoasContent";
import {
  roasBreadcrumbJsonLd,
  roasFaqJsonLd,
  roasWebApplicationJsonLd,
} from "@/components/calculators/roasContentData";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { isRoasCalculatorEnabled } from "@/lib/calculators/roas/roasVisibility";
import pageStyles from "./RoasPage.module.css";

export const metadata: Metadata = {
  title: "ROAS 계산기 - 광고비 대비 매출과 손익분기 ROAS 계산 | 계산박스",
  description:
    "광고비와 광고 매출을 입력해 ROAS, 광고비 비중, 광고 후 순이익, 손익분기 ROAS를 계산해보세요.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "ROAS 계산기 - 광고비 대비 매출과 손익분기 ROAS 계산 | 계산박스",
    description:
      "광고비와 광고 매출을 입력해 ROAS, 광고비 비중, 광고 후 순이익, 손익분기 ROAS를 계산해보세요.",
    type: "website",
  },
};

export default function RoasPage() {
  // AdSense 승인 전에는 명시적인 로컬 플래그가 있을 때만 ROAS 페이지를 노출합니다.
  if (!isRoasCalculatorEnabled()) {
    notFound();
  }

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
          <span>계산 기준일: 2026-06-29</span>
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
