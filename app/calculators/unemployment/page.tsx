import type { Metadata } from "next";
import Link from "next/link";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { UnemploymentCalculator } from "@/components/calculators/UnemploymentCalculator";
import { UNEMPLOYMENT_POLICY_2026 } from "@/lib/calculators/unemployment/policy";

const title = "실업급여 계산기 | 구직급여 예상 금액 계산";
const description =
  "월급 또는 1일 평균임금, 고용보험 가입기간, 나이 구간과 퇴직 사유를 입력해 실업급여 예상 금액과 소정급여일수를 계산합니다.";

export const metadata: Metadata = {
  title,
  description,
  robots: {
    index: true,
    follow: true,
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

const unemploymentWebApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "실업급여 계산기",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "KRW",
  },
} as const;

const unemploymentBreadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "홈",
      item: "/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "계산기 목록",
      item: "/calculators",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "실업급여 계산기",
      item: "/calculators/unemployment",
    },
  ],
} as const;

export default function UnemploymentPage() {
  return (
    <section className="page-section">
      <JsonLdScripts
        items={[unemploymentWebApplicationJsonLd, unemploymentBreadcrumbJsonLd]}
      />

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

      <section className="page-section seller-margin-related">
        <div className="page-heading seller-margin-heading">
          <p className="page-heading__eyebrow">Related calculators</p>
          <h2>함께 확인할 계산기</h2>
        </div>
        <div className="calculator-grid" role="list">
          <Link
            className="calculator-card"
            href="/calculators/severance"
            role="listitem"
          >
            <div>
              <span className="calculator-card__category">급여</span>
              <h3>퇴직금 계산기</h3>
              <p>입사일과 퇴직 전 임금으로 예상 퇴직금을 계산합니다.</p>
            </div>
            <span className="calculator-card__arrow" aria-hidden="true">
              →
            </span>
          </Link>
          <Link
            className="calculator-card"
            href="/calculators/salary"
            role="listitem"
          >
            <div>
              <span className="calculator-card__category">급여</span>
              <h3>연봉·월급 실수령액 계산기</h3>
              <p>4대보험과 간이세액표 기준 실수령액을 확인합니다.</p>
            </div>
            <span className="calculator-card__arrow" aria-hidden="true">
              →
            </span>
          </Link>
          <Link
            className="calculator-card"
            href="/calculators/loan"
            role="listitem"
          >
            <div>
              <span className="calculator-card__category">금융</span>
              <h3>대출이자 계산기</h3>
              <p>상환방식별 월 납입액과 총이자를 비교합니다.</p>
            </div>
            <span className="calculator-card__arrow" aria-hidden="true">
              →
            </span>
          </Link>
        </div>
      </section>

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
