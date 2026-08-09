import type { Metadata } from "next";
import Link from "next/link";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { WorkChildIncentiveCalculator } from "@/components/calculators/WorkChildIncentiveCalculator";
import { WorkChildIncentiveContent } from "@/components/calculators/WorkChildIncentiveContent";
import {
  workChildIncentiveBreadcrumbJsonLd,
  workChildIncentiveFaqJsonLd,
  workChildIncentivePolicySummary,
  workChildIncentiveWebApplicationJsonLd,
} from "@/components/calculators/workChildIncentiveContentData";

const title = "근로장려금 계산기 2026 - 자녀장려금 예상 지급액까지 확인";
const description =
  "근로장려금과 자녀장려금의 신청 가능성, 소득 기준, 재산 기준, 예상 지급액을 확인하는 계산기입니다. 예상 계산용이며 실제 지급 여부와 지급액은 국세청 심사 결과에 따라 달라질 수 있습니다.";
const ogUrl = "https://gyesanbox.kr/calculators/work-child-incentive/";
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
        alt: "근로·자녀장려금 계산기",
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

export default function WorkChildIncentivePage() {
  const jsonLdItems = [
    workChildIncentiveWebApplicationJsonLd,
    workChildIncentiveBreadcrumbJsonLd,
    workChildIncentiveFaqJsonLd,
  ];

  return (
    <section className="page-section">
      <JsonLdScripts items={jsonLdItems} />

      <div className="page-heading seller-margin-heading">
        <p className="page-heading__eyebrow">Work and child incentive</p>
        <h1>근로·자녀장려금 계산기</h1>
        <p>
          2026년 신청 기준으로 근로장려금과 자녀장려금 신청 가능성,
          재산 감액, 예상 지급액과 예상 구간을 자가진단합니다.
        </p>
        <div className="seller-margin-meta">
          <span>계산 기준일: {workChildIncentivePolicySummary.verifiedAt}</span>
          <span>{workChildIncentivePolicySummary.workIncomeLimits}</span>
          <span>예상 계산용이며 실제 국세청 심사 결과와 다를 수 있습니다.</span>
        </div>
      </div>

      <WorkChildIncentiveCalculator />
      <WorkChildIncentiveContent />

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
