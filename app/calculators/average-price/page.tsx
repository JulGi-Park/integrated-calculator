import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AveragePriceCalculator } from "@/components/calculators/AveragePriceCalculator";
import { AveragePriceContent } from "@/components/calculators/AveragePriceContent";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import {
  averagePriceBreadcrumbJsonLd,
  averagePriceFaqJsonLd,
  averagePriceWebApplicationJsonLd,
} from "@/lib/calculators/average-price/content";
import { isAveragePriceCalculatorEnabled } from "@/lib/calculators/average-price/visibility";

const title = "물타기 계산기 | 주식·코인 평균단가 계산";
const description =
  "현재 보유 수량, 평균 단가, 추가 매수 수량과 단가를 입력해 신규 평균단가, 총 투자금액, 예상 손익과 예상 수익률을 계산합니다.";

export const metadata: Metadata = {
  title,
  description,
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title,
    description,
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function AveragePricePage() {
  if (!isAveragePriceCalculatorEnabled()) {
    notFound();
  }

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
          현재 보유 수량과 평균 단가, 추가 매수 수량과 단가를 입력해 신규
          평균단가와 총 투자금액을 계산합니다. 현재가 또는 목표 매도가를
          입력하면 예상 손익과 수익률도 함께 확인할 수 있습니다.
        </p>
        <div className="seller-margin-meta">
          <span>로컬 비공개 계산기</span>
          <span>계산 기준일: 2026년 7월 3일</span>
          <span>수수료, 세금, 환율 등은 반영하지 않은 단순 계산값입니다.</span>
        </div>
      </div>

      <AveragePriceCalculator />
      <AveragePriceContent />

      <nav className="link-row seller-margin-links" aria-label="페이지 이동">
        <Link className="text-link" href="/calculators">
          ← 계산기 목록
        </Link>
        <Link className="text-link" href="/">
          홈으로
        </Link>
      </nav>
    </section>
  );
}
