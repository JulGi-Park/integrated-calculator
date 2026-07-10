import type { Metadata } from "next";
import Link from "next/link";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { SocialInsuranceCalculator } from "@/components/calculators/SocialInsuranceCalculator";
import { SocialInsuranceContent } from "@/components/calculators/SocialInsuranceContent";
import {
  socialInsuranceBreadcrumbJsonLd,
  socialInsuranceFaqJsonLd,
  socialInsuranceWebApplicationJsonLd,
} from "@/components/calculators/socialInsuranceContentData";
import { SOCIAL_INSURANCE_POLICY_2026 } from "@/lib/calculators/social-insurance/constants";

const title =
  "4대보험 계산기 2026 - 국민연금·건강보험·고용보험 공제액 계산";
const description =
  "2026년 기준 국민연금, 건강보험, 장기요양보험, 고용보험 근로자 부담 공제액을 월급과 비과세 금액으로 계산합니다.";
const canonical = "https://gyesanbox.kr/calculators/social-insurance/";
const ogImage = "https://gyesanbox.kr/og/calculators.png";

export const metadata: Metadata = {
  title,
  description,
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical,
  },
  openGraph: {
    title,
    description,
    url: canonical,
    type: "website",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: title,
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

function formatKoreanDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

export default function SocialInsurancePage() {
  const jsonLdItems = [
    socialInsuranceWebApplicationJsonLd,
    socialInsuranceBreadcrumbJsonLd,
    socialInsuranceFaqJsonLd,
  ];

  return (
    <section className="page-section salary-page">
      <JsonLdScripts items={jsonLdItems} />

      <div className="page-heading seller-margin-heading">
        <p className="page-heading__eyebrow">Social insurance</p>
        <h1>2026 4대보험 계산기</h1>
        <p>
          월 급여와 비과세 금액을 입력해 국민연금, 건강보험,
          장기요양보험, 고용보험의 근로자 부담 공제액을 계산합니다.
        </p>
        <div className="seller-margin-meta">
          <span>기준 확인일: {formatKoreanDate(SOCIAL_INSURANCE_POLICY_2026.verifiedAt)}</span>
          <span>산재보험은 자동 계산에서 제외됩니다.</span>
          <span>소득세와 지방소득세는 포함하지 않습니다.</span>
        </div>
      </div>

      <SocialInsuranceCalculator />
      <SocialInsuranceContent />

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
