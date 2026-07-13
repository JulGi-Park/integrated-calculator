import type { Metadata } from "next";
import Link from "next/link";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { LoanInterestCalculator } from "@/components/calculators/LoanInterestCalculator";
import { LoanInterestContent } from "@/components/calculators/LoanInterestContent";
import { CalculatorHeroImage } from "@/components/common/CalculatorHeroImage";
import {
  loanInterestBreadcrumbJsonLd,
  loanInterestFaqJsonLd,
  loanInterestPolicySummary,
  loanInterestWebApplicationJsonLd,
} from "@/components/calculators/loanInterestContentData";
import { PUBLIC_CALCULATOR_SEO } from "@/lib/seo/publicCalculatorSeo";

const seo = PUBLIC_CALCULATOR_SEO.loan;
const { title, description } = seo;
const ogTitle = "대출 이자 계산기 - 원리금·원금균등 상환액 확인";
const ogDescription =
  "대출금, 금리, 기간, 상환 방식을 입력하면 월 상환액과 총 이자 부담을 계산할 수 있습니다.";
const ogUrl = `https://gyesanbox.kr${seo.path}`;
const ogImage = seo.image;

export const metadata: Metadata = {
  title,
  description,
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: ogUrl,
  },
  openGraph: {
    title: ogTitle,
    description: ogDescription,
    url: ogUrl,
    type: "website",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: ogTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: ogTitle,
    description: ogDescription,
    images: [ogImage],
  },
};

export default function LoanInterestPage() {
  const jsonLdItems = [
    { ...loanInterestWebApplicationJsonLd, image: ogImage },
    loanInterestBreadcrumbJsonLd,
    loanInterestFaqJsonLd,
  ];

  return (
    <section className="page-section">
      <JsonLdScripts items={jsonLdItems} />

      <CalculatorHeroImage src={seo.imagePath} alt={seo.imageAlt} />

      <div className="page-heading seller-margin-heading">
        <p className="page-heading__eyebrow">Loan repayment</p>
        <h1>대출 이자 계산기</h1>
        <p>
          대출금액, 연이율과 기간을 입력해 원리금균등·원금균등·
          만기일시상환의 예상 비용과 월별 일정을 비교합니다.
        </p>
        <div className="seller-margin-meta">
          <span>원 단위 예상 계산</span>
          <span>계산 기준일: {loanInterestPolicySummary.verifiedAt}</span>
          <span>
            입력 한도는 계산 안전을 위한 서비스 제한이며 실제 대출 가능
            범위를 뜻하지 않습니다.
          </span>
        </div>
      </div>

      <LoanInterestCalculator />
      <LoanInterestContent />

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
