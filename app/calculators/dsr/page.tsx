import type { Metadata } from "next";
import Link from "next/link";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { DsrCalculator } from "@/components/calculators/DsrCalculator";
import { DsrContent } from "@/components/calculators/DsrContent";
import {
  dsrBreadcrumbJsonLd,
  dsrFaqJsonLd,
  dsrPolicySummary,
  dsrWebApplicationJsonLd,
} from "@/components/calculators/dsrContentData";

const title = "DSR 계산기 2026 - 스트레스 DSR 비율 계산";
const description =
  "연소득, 기존 대출, 신규 대출 조건, 스트레스 금리를 입력해 예상 DSR 비율을 참고용으로 비교합니다. 실제 대출한도와 승인 여부는 금융기관 심사로 결정됩니다.";
const ogUrl = "https://gyesanbox.kr/calculators/dsr/";
const ogImage = "https://gyesanbox.kr/og/default.png";

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
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "DSR 계산기 2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
  },
};

export default function DsrPage() {
  const jsonLdItems = [
    dsrWebApplicationJsonLd,
    dsrBreadcrumbJsonLd,
    dsrFaqJsonLd,
  ];

  return (
    <section className="page-section">
      <JsonLdScripts items={jsonLdItems} />

      <div className="page-heading seller-margin-heading">
        <p className="page-heading__eyebrow">Debt service ratio</p>
        <h1>DSR 계산기 2026</h1>
        <p>
          연소득, 기존 대출 연간 원리금, 신규 대출 조건과 스트레스 금리를
          입력해 예상 DSR 비율을 계산합니다.
        </p>
        <div className="seller-margin-meta">
          <span>계산 기준일: {dsrPolicySummary.verifiedAt}</span>
          <span>기본 DSR 기준: {dsrPolicySummary.defaultLimitRate}</span>
          <span>예상 계산용이며 실제 금융기관 심사 결과와 다를 수 있습니다.</span>
        </div>
      </div>

      <DsrCalculator />
      <DsrContent />

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
