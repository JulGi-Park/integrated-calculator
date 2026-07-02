import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { RentVsJeonseCalculator } from "@/components/calculators/RentVsJeonseCalculator";
import { RentVsJeonseContent } from "@/components/calculators/RentVsJeonseContent";
import {
  rentVsJeonseBreadcrumbJsonLd,
  rentVsJeonseFaqJsonLd,
  rentVsJeonseWebApplicationJsonLd,
} from "@/components/calculators/rentVsJeonseContentData";

const title = "전세 vs 월세 비교 계산기 | 전세대출 이자·월세 부담 비교";
const description =
  "전세대출 이자, 월세, 관리비, 보증금 기회비용을 입력해 전세와 월세의 월 부담과 거주기간 총비용을 비교해 보세요.";

export const metadata: Metadata = {
  title,
  description,
  robots: {
    index: false,
    follow: false,
  },
};

function isRentVsJeonseEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_RENT_VS_JEONSE_CALCULATOR === "true";
}

export default function RentVsJeonsePage() {
  if (!isRentVsJeonseEnabled()) {
    notFound();
  }

  const jsonLdItems = [
    rentVsJeonseWebApplicationJsonLd,
    rentVsJeonseBreadcrumbJsonLd,
    rentVsJeonseFaqJsonLd,
  ];

  return (
    <section className="page-section">
      <JsonLdScripts items={jsonLdItems} />

      <div className="page-heading seller-margin-heading">
        <p className="page-heading__eyebrow">Local calculator preview</p>
        <h1>전세 vs 월세 비교 계산기</h1>
        <p>{description}</p>
        <div className="seller-margin-meta">
          <span>참고용 예상 계산</span>
          <span>기준일: 2026-07-02</span>
          <span>운영 공개 전 로컬 비공개 플래그 전용 페이지</span>
        </div>
      </div>

      <RentVsJeonseCalculator />
      <RentVsJeonseContent />
    </section>
  );
}
