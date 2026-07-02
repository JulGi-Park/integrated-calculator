import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RentVsJeonseCalculator } from "@/components/calculators/RentVsJeonseCalculator";

const title = "전세 vs 월세 비교 계산기";
const description =
  "전세대출 이자, 월세, 보증금 차이, 관리비, 기회비용을 기준으로 전세와 월세의 월 부담과 총비용을 비교합니다.";

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

  return (
    <section className="page-section">
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

      {/*
        Future public content sections:
        title, one-line description, reference date, input area, result summary,
        detailed calculation, favorable jeonse case, favorable monthly rent case,
        legal conversion-rate reference, examples, exclusions, FAQ, official
        sources, disclaimer, SEO metadata, structured data, related calculators.
        Related calculator links must be added only at public launch.
      */}
    </section>
  );
}
