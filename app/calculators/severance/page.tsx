import type { Metadata } from "next";
import Link from "next/link";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { SeveranceCalculator } from "@/components/calculators/SeveranceCalculator";
import { SeveranceContent } from "@/components/calculators/SeveranceContent";
import {
  severanceBreadcrumbJsonLd,
  severanceFaqJsonLd,
  severanceWebApplicationJsonLd,
} from "@/components/calculators/severanceContentData";
import { SEVERANCE_POLICY_2026 } from "@/lib/calculators/severance/policy";

const title = "퇴직금 계산기 | 평균임금·통상임금 기준 예상 퇴직금 계산";
const description =
  "입사일, 퇴직일, 퇴직 전 3개월 임금과 상여금·연차수당을 입력해 평균임금·통상임금 기준 예상 퇴직금을 계산합니다.";

export const metadata: Metadata = {
  title,
  description,
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://gyesanbox.kr/calculators/severance/",
  },
  openGraph: {
    title,
    description,
    url: "https://gyesanbox.kr/calculators/severance/",
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

function formatKoreanDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

export default function SeverancePage() {
  const jsonLdItems = [
    severanceWebApplicationJsonLd,
    severanceBreadcrumbJsonLd,
    severanceFaqJsonLd,
  ];

  return (
    <section className="page-section">
      <JsonLdScripts items={jsonLdItems} />

      <div className="page-heading seller-margin-heading">
        <p className="page-heading__eyebrow">Severance pay</p>
        <h1>퇴직금 계산기</h1>
        <p>
          입사일과 퇴직 전 임금 정보를 입력해 법정 퇴직금의 예상 금액과
          평균임금 산정 내역을 확인할 수 있습니다.
        </p>
        <div className="seller-margin-meta">
          <span>공식 예제 7,868,434원 재현</span>
          <span>
            기준 확인일: {formatKoreanDate(SEVERANCE_POLICY_2026.verifiedAt)}
          </span>
          <span>계산 결과는 예상 금액이며 실제 지급액과 다를 수 있습니다.</span>
        </div>
      </div>

      <SeveranceCalculator />
      <SeveranceContent />

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
