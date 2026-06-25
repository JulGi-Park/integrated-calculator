import type { Metadata } from "next";
import Link from "next/link";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { LoanInterestCalculator } from "@/components/calculators/LoanInterestCalculator";
import { LoanInterestContent } from "@/components/calculators/LoanInterestContent";
import {
  loanInterestBreadcrumbJsonLd,
  loanInterestFaqJsonLd,
  loanInterestPolicySummary,
  loanInterestWebApplicationJsonLd,
} from "@/components/calculators/loanInterestContentData";

const title =
  "대출 이자 계산기 | 원리금균등·원금균등·만기일시상환 비교";
const description =
  "대출금액과 연이율, 기간을 입력해 월 납입액과 총이자를 계산하고 원리금균등·원금균등·만기일시상환 결과와 월별 일정을 비교해 보세요.";

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

export default function LoanInterestPage() {
  const jsonLdItems = [
    loanInterestWebApplicationJsonLd,
    loanInterestBreadcrumbJsonLd,
    loanInterestFaqJsonLd,
  ];

  return (
    <section className="page-section">
      <JsonLdScripts items={jsonLdItems} />

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
