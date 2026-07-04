import type { Metadata } from "next";
import Link from "next/link";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { UnemploymentCalculator } from "@/components/calculators/UnemploymentCalculator";
import { UnemploymentContent } from "@/components/calculators/UnemploymentContent";
import {
  unemploymentBreadcrumbJsonLd,
  unemploymentFaqJsonLd,
  unemploymentWebApplicationJsonLd,
} from "@/components/calculators/unemploymentContentData";
import { UNEMPLOYMENT_POLICY_2026 } from "@/lib/calculators/unemployment/policy";

const title =
  "실업급여 계산기 2026 | 구직급여 상한액·하한액·수급기간 예상";
const description =
  "실업급여 계산기로 퇴직 전 임금 기준 1일 구직급여액, 상한액·하한액 적용 여부, 고용보험 가입기간별 수급기간과 예상 총액을 확인하세요. 실제 지급 여부는 퇴직 사유, 이직확인서, 실업인정 절차에 따라 달라질 수 있습니다.";

export const metadata: Metadata = {
  title,
  description,
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://gyesanbox.kr/calculators/unemployment/",
  },
  openGraph: {
    title,
    description,
    url: "https://gyesanbox.kr/calculators/unemployment/",
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function UnemploymentPage() {
  const jsonLdItems = [
    unemploymentWebApplicationJsonLd,
    unemploymentBreadcrumbJsonLd,
    unemploymentFaqJsonLd,
  ];

  return (
    <section className="page-section">
      <JsonLdScripts items={jsonLdItems} />

      <div className="page-heading seller-margin-heading">
        <p className="page-heading__eyebrow">Unemployment benefit</p>
        <h1>실업급여 계산기</h1>
        <p>
          월급 또는 1일 평균임금과 고용보험 가입기간을 입력해 예상 구직급여와
          소정급여일수를 확인합니다.
        </p>
        <div className="seller-margin-meta">
          <span>예상 계산</span>
          <span>기준일: {UNEMPLOYMENT_POLICY_2026.basisDate}</span>
          <span>실제 수급 여부는 고용센터 판단에 따라 달라질 수 있습니다.</span>
        </div>
      </div>

      <UnemploymentCalculator />
      <UnemploymentContent />

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
