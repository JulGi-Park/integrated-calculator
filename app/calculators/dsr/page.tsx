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

const title = "DSR 계산기 2026 | 스트레스 DSR·대출 원리금 계산";
const description =
  "주택담보·신용·비주택담보대출의 일반 DSR과 2026년 하반기 공식 스트레스 DSR 정책 자동판정, 사용자 금리상승 시나리오를 구분해 계산합니다.";
const ogUrl = "https://gyesanbox.kr/calculators/dsr/";
const ogImage = "https://gyesanbox.kr/og/dsr.png";

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
          기존 대출 연간 DSR 원리금과 신규 대출 종류·상환조건을 입력해
          공식 부채산정 기준의 일반 DSR과 2026년 하반기 공식 스트레스
          DSR을 자동 계산합니다.
        </p>
        <div className="seller-margin-meta">
          <span>계산 기준일: {dsrPolicySummary.verifiedAt}</span>
          <span>
            기본 DSR 기준: {dsrPolicySummary.defaultLimitRate} (대표 은행권 기준)
          </span>
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
